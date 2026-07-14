// Supabase Edge Function: poll-email-replies
// Phase 4E reply capture for Outlook connections. For every active Outlook
// channel connection, reads recent inbox mail via Microsoft Graph, matches
// messages back to outreach threads by conversationId (stored when sending),
// appends them as inbound messages, flips the thread to "replied", and
// advances the creator from "contacted" to "negotiating". Gmail is send-only
// by design (reading Gmail requires Google's restricted-scope CASA audit).
//
// Gated by the shared OUTREACH_INBOUND_SECRET; meant to be invoked on a
// schedule (pg_cron + pg_net) or manually. Deploy with --no-verify-jwt.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Conn = {
  id: string;
  user_id: string;
  from_address: string | null;
  metadata: Record<string, unknown>;
};

async function freshOutlookToken(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string | null> {
  const { data: tok } = await supabase
    .from("channel_tokens")
    .select("access_token,refresh_token,token_expires_at")
    .eq("user_id", userId)
    .eq("provider", "outlook")
    .maybeSingle();
  if (!tok) return null;
  const stale =
    !tok.token_expires_at || new Date(tok.token_expires_at as string).getTime() <= Date.now();
  if (!stale) return tok.access_token as string;
  if (!tok.refresh_token) return null;

  const clientId = Deno.env.get("MS_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("MS_CLIENT_SECRET") ?? "";
  if (!clientId || !clientSecret) return null;
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: tok.refresh_token as string,
      grant_type: "refresh_token",
      scope: "offline_access User.Read Mail.Send Mail.Read",
    }),
  });
  if (!res.ok) {
    await supabase
      .from("channel_connections")
      .update({ status: "revoked" })
      .eq("user_id", userId)
      .eq("provider", "outlook");
    return null;
  }
  const j = await res.json();
  const expiresAt = new Date(Date.now() + ((j.expires_in ?? 3600) - 60) * 1000).toISOString();
  await supabase
    .from("channel_tokens")
    .update({
      access_token: j.access_token,
      ...(j.refresh_token ? { refresh_token: j.refresh_token } : {}),
      token_expires_at: expiresAt,
    })
    .eq("user_id", userId)
    .eq("provider", "outlook");
  return j.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  const secret = Deno.env.get("OUTREACH_INBOUND_SECRET");
  const url = new URL(req.url);
  const provided = req.headers.get("x-inbound-secret") ?? url.searchParams.get("secret") ?? "";
  if (!secret || provided !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Not configured" }), { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: conns } = await supabase
    .from("channel_connections")
    .select("id,user_id,from_address,metadata")
    .eq("provider", "outlook")
    .eq("status", "active");

  let matched = 0;
  let scanned = 0;

  for (const conn of (conns ?? []) as Conn[]) {
    const token = await freshOutlookToken(supabase, conn.user_id);
    if (!token) continue;

    const since =
      typeof conn.metadata?.last_email_poll_at === "string"
        ? (conn.metadata.last_email_poll_at as string)
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const pollStartedAt = new Date().toISOString();

    const filter = encodeURIComponent(`receivedDateTime ge ${since}`);
    const select = encodeURIComponent(
      "id,internetMessageId,conversationId,subject,bodyPreview,from,receivedDateTime",
    );
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/messages?$filter=${filter}&$select=${select}&$top=50`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) continue;
    const j = await res.json();
    const messages = (j.value ?? []) as Array<{
      id: string;
      internetMessageId?: string;
      conversationId?: string;
      subject?: string;
      bodyPreview?: string;
      from?: { emailAddress?: { address?: string } };
      receivedDateTime?: string;
    }>;

    for (const m of messages) {
      scanned++;
      const fromAddr = m.from?.emailAddress?.address ?? "";
      // Skip the user's own outbound mail.
      if (
        conn.from_address &&
        fromAddr.toLowerCase() === conn.from_address.toLowerCase()
      ) {
        continue;
      }
      if (!m.conversationId) continue;

      // Match back to a thread via the conversationId we stored on send.
      const { data: sent } = await supabase
        .from("outreach_messages")
        .select("thread_id,user_id")
        .eq("user_id", conn.user_id)
        .eq("channel", "email")
        .eq("direction", "outbound")
        .eq("metadata->>conversation_id", m.conversationId)
        .limit(1)
        .maybeSingle();
      if (!sent) continue;

      const { error: insErr } = await supabase.from("outreach_messages").upsert(
        {
          user_id: conn.user_id,
          thread_id: sent.thread_id,
          direction: "inbound",
          channel: "email",
          subject: m.subject ?? null,
          body: m.bodyPreview ?? "",
          status: "received",
          external_id: m.internetMessageId ?? m.id,
          metadata: { source: "outlook_poll", from_address: fromAddr },
        },
        { onConflict: "user_id,channel,external_id", ignoreDuplicates: true },
      );
      if (insErr) continue;
      matched++;

      await supabase
        .from("outreach_threads")
        .update({ status: "replied", last_message_at: new Date().toISOString() })
        .eq("id", sent.thread_id);
      const { data: thread } = await supabase
        .from("outreach_threads")
        .select("hotlist_id")
        .eq("id", sent.thread_id)
        .maybeSingle();
      if (thread?.hotlist_id) {
        await supabase
          .from("hotlist")
          .update({ stage: "negotiating" })
          .eq("id", thread.hotlist_id)
          .eq("stage", "contacted");
      }
    }

    await supabase
      .from("channel_connections")
      .update({ metadata: { ...conn.metadata, last_email_poll_at: pollStartedAt } })
      .eq("id", conn.id);
  }

  return new Response(JSON.stringify({ ok: true, scanned, matched }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
