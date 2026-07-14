import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Phase 4 outreach server functions. Reads and per-user writes go through the
// caller's own Supabase client, so row level security keeps everything scoped
// to the owner. Sending uses provider secrets from the server environment
// (never the browser bundle) and writes the resulting message rows through the
// same RLS client. Inbound replies arrive separately via the
// ingest-outreach-reply edge function.

export type Channel = "email" | "x" | "reddit" | "linkedin";

export type CreatorContact = {
  id: string;
  hotlist_id: string;
  channel: "email" | "x" | "reddit" | "linkedin" | "website";
  address: string;
  source: string;
  confidence: number;
  verified: boolean;
};

export type OutreachThread = {
  id: string;
  hotlist_id: string;
  campaign_id: string | null;
  channel: Channel;
  subject: string | null;
  status: string;
  last_message_at: string | null;
  creator_name?: string;
};

export type OutreachMessage = {
  id: string;
  thread_id: string;
  direction: "outbound" | "inbound";
  channel: Channel;
  subject: string | null;
  body: string;
  status: string;
  external_id: string | null;
  error: string | null;
  sent_at: string | null;
  created_at: string;
};

// ── Reads ────────────────────────────────────────────────────────────────────

export const listContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { hotlistId: string }) => data)
  .handler(async ({ data, context }): Promise<CreatorContact[]> => {
    if (!data.hotlistId) return [];
    const { data: rows, error } = await context.supabase
      .from("creator_contacts")
      .select("id,hotlist_id,channel,address,source,confidence,verified")
      .eq("hotlist_id", data.hotlistId)
      .order("confidence", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []) as CreatorContact[];
  });

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { campaignId?: string }) => data)
  .handler(async ({ data, context }): Promise<OutreachThread[]> => {
    let q = context.supabase
      .from("outreach_threads")
      .select("id,hotlist_id,campaign_id,channel,subject,status,last_message_at")
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (data.campaignId) q = q.eq("campaign_id", data.campaignId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const threads = (rows ?? []) as OutreachThread[];
    // Attach creator names in one follow-up query.
    const ids = Array.from(new Set(threads.map((t) => t.hotlist_id)));
    if (ids.length) {
      const { data: creators } = await context.supabase
        .from("hotlist")
        .select("id,creator_name")
        .in("id", ids);
      const nameById = new Map((creators ?? []).map((c) => [c.id, c.creator_name]));
      for (const t of threads) t.creator_name = nameById.get(t.hotlist_id) ?? undefined;
    }
    return threads;
  });

export const getThreadMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { threadId: string }) => data)
  .handler(async ({ data, context }): Promise<OutreachMessage[]> => {
    if (!data.threadId) return [];
    const { data: rows, error } = await context.supabase
      .from("outreach_messages")
      .select("id,thread_id,direction,channel,subject,body,status,external_id,error,sent_at,created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []) as OutreachMessage[];
  });

// ── Contacts (manual add + connection status) ────────────────────────────────

export const addContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { hotlistId: string; channel: CreatorContact["channel"]; address: string }) => data,
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (!data.hotlistId || !data.channel || !data.address) {
      throw new Error("hotlistId, channel and address are required");
    }
    const { error } = await context.supabase.from("creator_contacts").upsert(
      {
        user_id: context.userId,
        hotlist_id: data.hotlistId,
        channel: data.channel,
        address: data.address.trim(),
        source: "manual",
        confidence: 1,
        verified: true,
      },
      { onConflict: "user_id,hotlist_id,channel,address" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type ChannelConnections = { providers: string[] };

export const getChannelConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ChannelConnections> => {
    const { data: rows, error } = await context.supabase
      .from("channel_connections")
      .select("provider,status")
      .eq("status", "active");
    if (error) throw new Error(error.message);
    return { providers: (rows ?? []).map((r) => r.provider as string) };
  });

// ── Sending ──────────────────────────────────────────────────────────────────

type SendResult = { externalId: string | null; status: "sent" | "queued"; assistUrl?: string };

// Email via Resend, from the brand's own verified domain. CAN-SPAM footer is
// appended automatically. Returns the provider message id for reply matching.
async function sendEmail(args: {
  to: string;
  subject: string;
  body: string;
  fromAddress: string;
}): Promise<SendResult> {
  const key = process.env.EMAIL_API_KEY;
  if (!key) throw new Error("Email is not connected");
  const from = args.fromAddress || process.env.OUTREACH_FROM_ADDRESS || "";
  if (!from) throw new Error("No verified from-address configured");
  const unsub = process.env.OUTREACH_UNSUBSCRIBE_URL || "";
  const addr = process.env.OUTREACH_POSTAL_ADDRESS || "";
  const footer =
    `\n\n—\nYou received this because a brand is exploring a partnership with you.` +
    (unsub ? ` Unsubscribe: ${unsub}` : "") +
    (addr ? `\n${addr}` : "");
  const html = (args.body + footer)
    .split("\n")
    .map((l) => (l.trim() ? `<p>${escapeHtml(l)}</p>` : "<br/>"))
    .join("");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [args.to], subject: args.subject, html, text: args.body + footer }),
  });
  if (!res.ok) throw new Error(`Email send failed: ${await res.text()}`);
  const j = (await res.json()) as { id?: string };
  return { externalId: j.id ?? null, status: "sent" };
}

// X (Twitter) DM via API v2. Requires an app-level bearer with DM scope. Note
// that X only delivers to recipients who follow the sender or allow DMs from
// anyone; a rejection surfaces as a failed message the brand can see.
async function sendXDm(args: { recipientId: string; body: string }): Promise<SendResult> {
  const bearer = process.env.X_BEARER_TOKEN;
  if (!bearer) throw new Error("X is not connected");
  const res = await fetch(
    `https://api.twitter.com/2/dm_conversations/with/${encodeURIComponent(args.recipientId)}/messages`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
      body: JSON.stringify({ text: args.body }),
    },
  );
  if (!res.ok) throw new Error(`X DM failed: ${await res.text()}`);
  const j = (await res.json()) as { dm_event_id?: string; data?: { dm_event_id?: string } };
  return { externalId: j.dm_event_id ?? j.data?.dm_event_id ?? null, status: "sent" };
}

// Reddit private message via /api/compose using an app OAuth token.
async function sendRedditDm(args: { username: string; subject: string; body: string }): Promise<SendResult> {
  const token = process.env.REDDIT_ACCESS_TOKEN;
  if (!token) throw new Error("Reddit is not connected");
  const form = new URLSearchParams({
    api_type: "json",
    to: args.username,
    subject: args.subject || "Partnership",
    text: args.body,
  });
  const res = await fetch("https://oauth.reddit.com/api/compose", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "AspenReach/1.0",
    },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Reddit DM failed: ${await res.text()}`);
  return { externalId: null, status: "sent" };
}

// LinkedIn cannot be automated for cold outreach, so we return a prefilled
// compose deep-link the brand sends by hand; the message is still logged.
function linkedinAssist(body: string): SendResult {
  const url = `https://www.linkedin.com/messaging/compose/?body=${encodeURIComponent(body)}`;
  return { externalId: null, status: "queued", assistUrl: url };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const sendOutreachMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      hotlistId: string;
      campaignId?: string | null;
      channel: Channel;
      to: string; // email address, x recipient id, reddit username (ignored for linkedin)
      subject?: string;
      body: string;
    }) => data,
  )
  .handler(
    async ({ data, context }): Promise<{ messageId: string; status: string; assistUrl?: string }> => {
      if (!data.hotlistId || !data.channel || !data.body) {
        throw new Error("hotlistId, channel and body are required");
      }

      // Find or create the thread for this creator + channel.
      const { data: existing } = await context.supabase
        .from("outreach_threads")
        .select("id")
        .eq("hotlist_id", data.hotlistId)
        .eq("channel", data.channel)
        .maybeSingle();

      let threadId = existing?.id as string | undefined;
      if (!threadId) {
        const { data: created, error: tErr } = await context.supabase
          .from("outreach_threads")
          .insert({
            user_id: context.userId,
            hotlist_id: data.hotlistId,
            campaign_id: data.campaignId ?? null,
            channel: data.channel,
            subject: data.subject ?? null,
            status: "active",
          })
          .select("id")
          .single();
        if (tErr) throw new Error(tErr.message);
        threadId = created.id;
      }

      // Record the outbound message as queued first, so a send failure still
      // leaves an auditable row the brand can retry.
      const { data: msg, error: mErr } = await context.supabase
        .from("outreach_messages")
        .insert({
          user_id: context.userId,
          thread_id: threadId,
          direction: "outbound",
          channel: data.channel,
          subject: data.subject ?? null,
          body: data.body,
          status: "queued",
          sent_by: context.userId,
        })
        .select("id")
        .single();
      if (mErr) throw new Error(mErr.message);

      let result: SendResult;
      let status = "sent";
      let error: string | null = null;
      try {
        if (data.channel === "email") {
          result = await sendEmail({
            to: data.to,
            subject: data.subject ?? "Partnership opportunity",
            body: data.body,
            fromAddress: process.env.OUTREACH_FROM_ADDRESS ?? "",
          });
        } else if (data.channel === "x") {
          result = await sendXDm({ recipientId: data.to, body: data.body });
        } else if (data.channel === "reddit") {
          result = await sendRedditDm({
            username: data.to,
            subject: data.subject ?? "Partnership",
            body: data.body,
          });
        } else {
          result = linkedinAssist(data.body);
        }
        status = result.status;
      } catch (e) {
        status = "failed";
        error = e instanceof Error ? e.message : "Send failed";
        result = { externalId: null, status: "queued" };
      }

      await context.supabase
        .from("outreach_messages")
        .update({
          status,
          external_id: result.externalId,
          error,
          sent_at: status === "sent" ? new Date().toISOString() : null,
        })
        .eq("id", msg.id);

      // Advance the thread and, on a real send, the hotlist stage.
      await context.supabase
        .from("outreach_threads")
        .update({ status: "active", last_message_at: new Date().toISOString() })
        .eq("id", threadId);

      if (status === "sent") {
        await context.supabase
          .from("hotlist")
          .update({ stage: "contacted" })
          .eq("id", data.hotlistId)
          .eq("stage", "saved");
      }

      if (error) throw new Error(error);
      return { messageId: msg.id, status, assistUrl: result.assistUrl };
    },
  );
