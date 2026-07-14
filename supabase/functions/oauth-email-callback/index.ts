// Supabase Edge Function: oauth-email-callback
// Completes the Gmail/Outlook OAuth dance started by startEmailOAuth. Looks up
// the CSRF state row, exchanges the code for tokens, resolves the mailbox
// address, stores token material in channel_tokens (service role only), and
// upserts the client-visible channel_connections row. Finishes with a browser
// redirect back to the app. Deploy with --no-verify-jwt (the state row is the
// auth; it is single-use and expires after 15 minutes).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function redirectBack(base: string, params: string): Response {
  const to = `${base || "/"}/app/outreach?${params}`;
  return new Response(null, { status: 302, headers: { Location: to } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code") ?? "";
  const stateId = url.searchParams.get("state") ?? "";
  const oauthError = url.searchParams.get("error") ?? "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const appBase = Deno.env.get("APP_BASE_URL") ?? "";
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Not configured" }), { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  // Resolve + consume the state row first, so we always know where to send
  // the browser back to, even on provider errors.
  const { data: state } = stateId
    ? await supabase
        .from("oauth_states")
        .select("id,user_id,provider,redirect_to,created_at")
        .eq("id", stateId)
        .maybeSingle()
    : { data: null };
  if (state) await supabase.from("oauth_states").delete().eq("id", state.id);

  const back = state?.redirect_to || appBase;
  if (!state) return redirectBack(back, "email_error=invalid_state");
  const ageMs = Date.now() - new Date(state.created_at).getTime();
  if (ageMs > 15 * 60 * 1000) return redirectBack(back, "email_error=state_expired");
  if (oauthError) return redirectBack(back, `email_error=${encodeURIComponent(oauthError)}`);
  if (!code) return redirectBack(back, "email_error=missing_code");

  const provider = state.provider as "gmail" | "outlook";
  const redirectUri = `${supabaseUrl}/functions/v1/oauth-email-callback`;

  try {
    let accessToken = "";
    let refreshToken: string | null = null;
    let expiresIn = 3600;
    let scope: string | null = null;
    let fromAddress: string | null = null;
    let externalAccountId: string | null = null;

    if (provider === "outlook") {
      const clientId = Deno.env.get("MS_CLIENT_ID") ?? "";
      const clientSecret = Deno.env.get("MS_CLIENT_SECRET") ?? "";
      if (!clientId || !clientSecret) return redirectBack(back, "email_error=not_configured");
      const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
      const j = await res.json();
      accessToken = j.access_token;
      refreshToken = j.refresh_token ?? null;
      expiresIn = j.expires_in ?? 3600;
      scope = j.scope ?? null;

      const me = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (me.ok) {
        const mj = await me.json();
        fromAddress = mj.mail ?? mj.userPrincipalName ?? null;
        externalAccountId = mj.id ?? null;
      }
    } else {
      const clientId = Deno.env.get("GMAIL_CLIENT_ID") ?? "";
      const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET") ?? "";
      if (!clientId || !clientSecret) return redirectBack(back, "email_error=not_configured");
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });
      if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`);
      const j = await res.json();
      accessToken = j.access_token;
      refreshToken = j.refresh_token ?? null;
      expiresIn = j.expires_in ?? 3600;
      scope = j.scope ?? null;

      const info = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (info.ok) {
        const ij = await info.json();
        fromAddress = ij.email ?? null;
        externalAccountId = ij.id ?? null;
      }
    }

    if (!accessToken) throw new Error("No access token returned");

    const expiresAt = new Date(Date.now() + (expiresIn - 60) * 1000).toISOString();
    const { error: tokErr } = await supabase.from("channel_tokens").upsert(
      {
        user_id: state.user_id,
        provider,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt,
        scope,
      },
      { onConflict: "user_id,provider" },
    );
    if (tokErr) throw new Error(tokErr.message);

    const { error: connErr } = await supabase.from("channel_connections").upsert(
      {
        user_id: state.user_id,
        provider,
        from_address: fromAddress,
        external_account_id: externalAccountId,
        status: "active",
        metadata: { connected_at: new Date().toISOString() },
      },
      { onConflict: "user_id,provider" },
    );
    if (connErr) throw new Error(connErr.message);

    return redirectBack(back, `connected=${provider}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return redirectBack(back, `email_error=${encodeURIComponent(msg.slice(0, 120))}`);
  }
});
