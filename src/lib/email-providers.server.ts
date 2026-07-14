import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Phase 4E server-only email provider layer. Finds the user's connected
// mailbox (Outlook or Gmail), refreshes tokens when stale, and sends through
// the provider's API so mail leaves from the brand's real address. Token
// material comes from channel_tokens (service role only) and never leaves the
// server. Callers fall back to Resend when no connection exists.

export type EmailSendOutcome = {
  externalId: string | null;
  provider: "outlook" | "gmail";
  fromAddress: string;
  metadata: Record<string, string>;
};

type TokenRow = {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
};

export type ActiveEmailConnection = {
  provider: "outlook" | "gmail";
  fromAddress: string;
  accessToken: string;
};

async function refreshToken(
  userId: string,
  provider: "outlook" | "gmail",
  refresh: string,
): Promise<string> {
  let res: Response;
  if (provider === "outlook") {
    const clientId = process.env.MS_CLIENT_ID ?? "";
    const clientSecret = process.env.MS_CLIENT_SECRET ?? "";
    res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refresh,
        grant_type: "refresh_token",
        scope: "offline_access User.Read Mail.Send Mail.Read",
      }),
    });
  } else {
    const clientId = process.env.GMAIL_CLIENT_ID ?? "";
    const clientSecret = process.env.GMAIL_CLIENT_SECRET ?? "";
    res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refresh,
        grant_type: "refresh_token",
      }),
    });
  }
  if (!res.ok) {
    // A dead refresh token means the user must reconnect; surface that state.
    await supabaseAdmin
      .from("channel_connections")
      .update({ status: "revoked" })
      .eq("user_id", userId)
      .eq("provider", provider);
    throw new Error(`${provider} session expired — reconnect your email account`);
  }
  const j = (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  };
  const expiresAt = new Date(Date.now() + ((j.expires_in ?? 3600) - 60) * 1000).toISOString();
  await supabaseAdmin
    .from("channel_tokens")
    .update({
      access_token: j.access_token,
      ...(j.refresh_token ? { refresh_token: j.refresh_token } : {}),
      token_expires_at: expiresAt,
    })
    .eq("user_id", userId)
    .eq("provider", provider);
  return j.access_token;
}

// The user's active BYO-inbox connection with a fresh access token, or null
// when none is connected (caller then falls back to Resend). If both providers
// are connected the most recently updated one wins.
export async function getActiveEmailConnection(
  userId: string,
): Promise<ActiveEmailConnection | null> {
  const { data: conns } = await supabaseAdmin
    .from("channel_connections")
    .select("provider,from_address,updated_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("provider", ["gmail", "outlook"])
    .order("updated_at", { ascending: false });
  const conn = (conns ?? [])[0];
  if (!conn || !conn.from_address) return null;
  const provider = conn.provider as "outlook" | "gmail";

  const { data: tok } = await supabaseAdmin
    .from("channel_tokens")
    .select("access_token,refresh_token,token_expires_at")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle<TokenRow>();
  if (!tok) return null;

  let accessToken = tok.access_token;
  const stale = !tok.token_expires_at || new Date(tok.token_expires_at).getTime() <= Date.now();
  if (stale) {
    if (!tok.refresh_token) throw new Error(`${provider} session expired — reconnect your email account`);
    accessToken = await refreshToken(userId, provider, tok.refresh_token);
  }
  return { provider, fromAddress: conn.from_address, accessToken };
}

// Outlook: create a draft first (its creation response carries the
// internetMessageId and conversationId we need for reply matching), then send
// it. Sent mail lands in the user's own Sent Items.
export async function sendViaOutlook(args: {
  connection: ActiveEmailConnection;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailSendOutcome> {
  const headers = {
    Authorization: `Bearer ${args.connection.accessToken}`,
    "Content-Type": "application/json",
    Prefer: 'IdType="ImmutableId"',
  };
  const draftRes = await fetch("https://graph.microsoft.com/v1.0/me/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({
      subject: args.subject,
      body: { contentType: "HTML", content: args.html },
      toRecipients: [{ emailAddress: { address: args.to } }],
    }),
  });
  if (!draftRes.ok) throw new Error(`Outlook draft failed: ${await draftRes.text()}`);
  const draft = (await draftRes.json()) as {
    id: string;
    internetMessageId?: string;
    conversationId?: string;
  };

  const sendRes = await fetch(
    `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(draft.id)}/send`,
    { method: "POST", headers },
  );
  if (!sendRes.ok && sendRes.status !== 202) {
    throw new Error(`Outlook send failed: ${await sendRes.text()}`);
  }
  return {
    externalId: draft.internetMessageId ?? draft.id,
    provider: "outlook",
    fromAddress: args.connection.fromAddress,
    metadata: {
      graph_message_id: draft.id,
      ...(draft.conversationId ? { conversation_id: draft.conversationId } : {}),
    },
  };
}

function base64Url(s: string): string {
  return Buffer.from(s, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Gmail: send a raw MIME message. Sent mail shows in the user's Sent folder;
// Gmail is send-only in 4E (reply reading would trigger Google's restricted
// scope audit), so replies stay in the user's real inbox.
export async function sendViaGmail(args: {
  connection: ActiveEmailConnection;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailSendOutcome> {
  const boundary = `b_${Math.random().toString(36).slice(2)}`;
  const mime = [
    `From: ${args.connection.fromAddress}`,
    `To: ${args.to}`,
    `Subject: ${args.subject.replace(/[\r\n]/g, " ")}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    args.text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    args.html,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.connection.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: base64Url(mime) }),
  });
  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
  const j = (await res.json()) as { id?: string; threadId?: string };
  return {
    externalId: j.id ?? null,
    provider: "gmail",
    fromAddress: args.connection.fromAddress,
    metadata: j.threadId ? { gmail_thread_id: j.threadId } : {},
  };
}
