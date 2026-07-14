// Supabase Edge Function: poll-reddit-inbox
// Phase 4E reply capture for Reddit. Reads unread private messages with the
// platform Reddit token (the same identity used to send), matches senders back
// to creator contacts, appends inbound messages to the matching reddit thread,
// flips it to "replied", advances the hotlist stage, and marks the Reddit
// message read so it is not processed twice (external_id is the idempotency
// backstop). Gated by OUTREACH_INBOUND_SECRET; run on a schedule.
// Deploy with --no-verify-jwt.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  const secret = Deno.env.get("OUTREACH_INBOUND_SECRET");
  const url = new URL(req.url);
  const provided = req.headers.get("x-inbound-secret") ?? url.searchParams.get("secret") ?? "";
  if (!secret || provided !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const token = Deno.env.get("REDDIT_ACCESS_TOKEN");
  if (!token) {
    return new Response(JSON.stringify({ ok: true, skipped: "reddit not connected" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Not configured" }), { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const inboxRes = await fetch("https://oauth.reddit.com/message/unread?limit=50", {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "AspenReach/1.0" },
  });
  if (!inboxRes.ok) {
    return new Response(JSON.stringify({ error: `Reddit inbox failed: ${inboxRes.status}` }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
  const inbox = await inboxRes.json();
  const items = (inbox?.data?.children ?? []) as Array<{
    kind: string;
    data: { name: string; author?: string; subject?: string; body?: string };
  }>;

  let matched = 0;
  const processed: string[] = [];

  for (const item of items) {
    // t4 = private message. Comment replies etc. are left unread for the user.
    if (item.kind !== "t4" || !item.data?.author) continue;
    const author = item.data.author;

    // Every creator contact with this Reddit handle (a creator may be in
    // several users' hotlists; each gets its own thread).
    const { data: contacts } = await supabase
      .from("creator_contacts")
      .select("user_id,hotlist_id")
      .eq("channel", "reddit")
      .ilike("address", author);
    if (!contacts?.length) continue;

    let anyMatched = false;
    for (const c of contacts) {
      const { data: thread } = await supabase
        .from("outreach_threads")
        .select("id,hotlist_id")
        .eq("user_id", c.user_id)
        .eq("hotlist_id", c.hotlist_id)
        .eq("channel", "reddit")
        .maybeSingle();
      if (!thread) continue;

      const { error: insErr } = await supabase.from("outreach_messages").upsert(
        {
          user_id: c.user_id,
          thread_id: thread.id,
          direction: "inbound",
          channel: "reddit",
          subject: item.data.subject ?? null,
          body: item.data.body ?? "",
          status: "received",
          external_id: item.data.name,
          metadata: { source: "reddit_poll", author },
        },
        { onConflict: "user_id,channel,external_id", ignoreDuplicates: true },
      );
      if (insErr) continue;
      anyMatched = true;
      matched++;

      await supabase
        .from("outreach_threads")
        .update({ status: "replied", last_message_at: new Date().toISOString() })
        .eq("id", thread.id);
      await supabase
        .from("hotlist")
        .update({ stage: "negotiating" })
        .eq("id", thread.hotlist_id)
        .eq("stage", "contacted");
    }

    if (anyMatched) processed.push(item.data.name);
  }

  // Mark matched messages read so the unread feed stays clean; unmatched mail
  // stays unread for the human.
  if (processed.length) {
    await fetch("https://oauth.reddit.com/api/read_message", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AspenReach/1.0",
      },
      body: new URLSearchParams({ id: processed.join(",") }).toString(),
    });
  }

  return new Response(JSON.stringify({ ok: true, unread: items.length, matched }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
