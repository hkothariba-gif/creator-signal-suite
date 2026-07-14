import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Phase 4E: bring-your-own inbox. Starts the OAuth dance for Outlook
// (Microsoft Graph) or Gmail and reports connection state. Token exchange and
// storage happen in the oauth-email-callback edge function; token material
// lives in channel_tokens (service role only) and never reaches the browser.
//
// Provider notes:
//   Outlook — scopes offline_access + Mail.Send + Mail.Read + User.Read.
//             Delegated user consent only, works for personal + work accounts.
//   Gmail   — scope gmail.send only (send-only keeps us out of Google's
//             restricted-scope CASA audit; replies stay in the user's inbox).

export type EmailProvider = "gmail" | "outlook";

export type EmailOAuthStatus = {
  outlookConfigured: boolean;
  gmailConfigured: boolean;
  connections: Array<{
    provider: EmailProvider;
    from_address: string | null;
    status: string;
  }>;
};

function callbackUrl(): string {
  const base = process.env.SUPABASE_URL ?? "";
  return `${base}/functions/v1/oauth-email-callback`;
}

export const getEmailOAuthStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailOAuthStatus> => {
    const { data: rows, error } = await context.supabase
      .from("channel_connections")
      .select("provider,from_address,status")
      .in("provider", ["gmail", "outlook"]);
    if (error) throw new Error(error.message);
    return {
      outlookConfigured: Boolean(process.env.MS_CLIENT_ID && process.env.MS_CLIENT_SECRET),
      gmailConfigured: Boolean(process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET),
      connections: (rows ?? []).map((r) => ({
        provider: r.provider as EmailProvider,
        from_address: r.from_address,
        status: r.status,
      })),
    };
  });

export const startEmailOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: EmailProvider; returnTo?: string }) => data)
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    if (data.provider !== "gmail" && data.provider !== "outlook") {
      throw new Error("Unknown provider");
    }
    const clientId =
      data.provider === "outlook" ? process.env.MS_CLIENT_ID : process.env.GMAIL_CLIENT_ID;
    if (!clientId) throw new Error(`${data.provider} OAuth is not configured yet`);

    const returnTo =
      typeof data.returnTo === "string" && /^https?:\/\//.test(data.returnTo)
        ? data.returnTo
        : (process.env.APP_BASE_URL ?? "");

    // CSRF state row, read back (and deleted) by the callback edge function.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: state, error } = await supabaseAdmin
      .from("oauth_states")
      .insert({ user_id: context.userId, provider: data.provider, redirect_to: returnTo })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const redirect = callbackUrl();
    let url: string;
    if (data.provider === "outlook") {
      const p = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirect,
        response_mode: "query",
        scope: "offline_access User.Read Mail.Send Mail.Read",
        state: state.id,
      });
      url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${p}`;
    } else {
      const p = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirect,
        scope: "openid email https://www.googleapis.com/auth/gmail.send",
        access_type: "offline",
        prompt: "consent",
        state: state.id,
      });
      url = `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
    }
    return { url };
  });

export const disconnectEmailAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { provider: EmailProvider }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("channel_tokens")
      .delete()
      .eq("user_id", context.userId)
      .eq("provider", data.provider);
    const { error } = await context.supabase
      .from("channel_connections")
      .update({ status: "revoked" })
      .eq("provider", data.provider);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
