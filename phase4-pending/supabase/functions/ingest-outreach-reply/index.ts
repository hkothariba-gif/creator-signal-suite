// Supabase Edge Function: ingest-outreach-reply
// Inbound replies to outreach. A provider webhook (Resend inbound email today;
// other channels later) posts a reply here. We match it back to a thread by the
// in-reply-to id (the external_id we stored when sending) or by a thread token
// carried in a plus-addressed reply-to. The reply is appended as an inbound
// message, the thread is flipped to "replied", and the creator advances from
// "contacted" to "negotiating". A shared secret gates the endpoint; deploy
// without JWT verification.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const secret = Deno.env.get("OUTREACH_INBOUND_SECRET");
  const url = new URL(req.url);
  const provided = req.headers.get("x-inbound-secret") ?? url.searchParams.get("secret") ?? "";
  if (!secret || provided !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const channel = ["email", "x", "reddit", "linkedin"].includes(String(body.channel))
    ? String(body.channel)
    : "email";
  const text = typeof body.text === "string" ? body.text : typeof body.body === "string" ? body.body : "";
  const subject = typeof body.subject === "string" ? body.subject : null;
  const inReplyTo = typeof body.in_reply_to === "string" ? body.in_reply_to : "";
  const threadToken = typeof body.thread_token === "string" ? body.thread_token : "";
  const externalId = typeof body.external_id === "string" ? body.external_id : null;

  // Resolve the thread: prefer an explicit thread token, else the in-reply-to
  // id matched against an outbound message's external_id.
  let threadId: string | null = null;
  let userId: string | null = null;

  if (threadToken) {
    const { data: t } = await supabase
      .from("outreach_threads")
      .select("id,user_id")
      .eq("id", threadToken)
      .maybeSingle();
    if (t) {
      threadId = t.id;
      userId = t.user_id;
    }
  }
  if (!threadId && inReplyTo) {
    const { data: m } = await supabase
      .from("outreach_messages")
      .select("thread_id,user_id")
      .eq("external_id", inReplyTo)
      .maybeSingle();
    if (m) {
      threadId = m.thread_id;
      userId = m.user_id;
    }
  }

  if (!threadId || !userId) {
    return new Response(JSON.stringify({ error: "Could not match reply to a thread" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { error } = await supabase.from("outreach_messages").upsert(
    {
      user_id: userId,
      thread_id: threadId,
      direction: "inbound",
      channel,
      subject,
      body: text,
      status: "received",
      external_id: externalId,
    },
    externalId ? { onConflict: "user_id,channel,external_id", ignoreDuplicates: true } : undefined,
  );
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  await supabase
    .from("outreach_threads")
    .update({ status: "replied", last_message_at: new Date().toISOString() })
    .eq("id", threadId);

  // Move the creator forward on first reply.
  const { data: thread } = await supabase
    .from("outreach_threads")
    .select("hotlist_id")
    .eq("id", threadId)
    .maybeSingle();
  if (thread?.hotlist_id) {
    await supabase
      .from("hotlist")
      .update({ stage: "negotiating" })
      .eq("id", thread.hotlist_id)
      .eq("stage", "contacted");
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
