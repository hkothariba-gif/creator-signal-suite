// Supabase Edge Function: run-sequences
// Phase 4E sequence runner. Finds due enrollments, enforces stop-on-reply,
// sends the next step through the user's connected mailbox (Outlook or Gmail,
// with token refresh) or the platform Resend sender, logs the message into the
// thread, and schedules the following step. {{creator_name}} is replaced in
// subject and body. Gated by OUTREACH_INBOUND_SECRET; run on a schedule
// (every 15 minutes is plenty). Deploy with --no-verify-jwt.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Supa = ReturnType<typeof createClient>;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildBodies(body: string): { text: string; html: string } {
  const unsub = Deno.env.get("OUTREACH_UNSUBSCRIBE_URL") ?? "";
  const addr = Deno.env.get("OUTREACH_POSTAL_ADDRESS") ?? "";
  const footer =
    `\n\n—\nYou received this because a brand is exploring a partnership with you.` +
    (unsub ? ` Unsubscribe: ${unsub}` : "") +
    (addr ? `\n${addr}` : "");
  const text = body + footer;
  const html = text
    .split("\n")
    .map((l) => (l.trim() ? `<p>${escapeHtml(l)}</p>` : "<br/>"))
    .join("");
  return { text, html };
}

async function freshToken(
  supabase: Supa,
  userId: string,
  provider: "outlook" | "gmail",
): Promise<string | null> {
  const { data: tok } = await supabase
    .from("channel_tokens")
    .select("access_token,refresh_token,token_expires_at")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  if (!tok) return null;
  const stale =
    !tok.token_expires_at || new Date(tok.token_expires_at as string).getTime() <= Date.now();
  if (!stale) return tok.access_token as string;
  if (!tok.refresh_token) return null;

  const isOutlook = provider === "outlook";
  const clientId = Deno.env.get(isOutlook ? "MS_CLIENT_ID" : "GMAIL_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get(isOutlook ? "MS_CLIENT_SECRET" : "GMAIL_CLIENT_SECRET") ?? "";
  if (!clientId || !clientSecret) return null;
  const res = await fetch(
    isOutlook
      ? "https://login.microsoftonline.com/common/oauth2/v2.0/token"
      : "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tok.refresh_token as string,
        grant_type: "refresh_token",
        ...(isOutlook ? { scope: "offline_access User.Read Mail.Send Mail.Read" } : {}),
      }),
    },
  );
  if (!res.ok) {
    await supabase
      .from("channel_connections")
      .update({ status: "revoked" })
      .eq("user_id", userId)
      .eq("provider", provider);
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
    .eq("provider", provider);
  return j.access_token as string;
}

function base64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Send one email as the user. Returns the external id + metadata for reply
// matching, mirroring the app's send path.
async function sendAsUser(
  supabase: Supa,
  userId: string,
  to: string,
  subject: string,
  body: string,
): Promise<{ externalId: string | null; metadata: Record<string, string> }> {
  const { text, html } = buildBodies(body);

  const { data: conns } = await supabase
    .from("channel_connections")
    .select("provider,from_address,updated_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .in("provider", ["gmail", "outlook"])
    .order("updated_at", { ascending: false });
  const conn = (conns ?? [])[0] as
    | { provider: "outlook" | "gmail"; from_address: string | null }
    | undefined;

  if (conn?.from_address) {
    const token = await freshToken(supabase, userId, conn.provider);
    if (token) {
      if (conn.provider === "outlook") {
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: 'IdType="ImmutableId"',
        };
        const draftRes = await fetch("https://graph.microsoft.com/v1.0/me/messages", {
          method: "POST",
          headers,
          body: JSON.stringify({
            subject,
            body: { contentType: "HTML", content: html },
            toRecipients: [{ emailAddress: { address: to } }],
          }),
        });
        if (!draftRes.ok) throw new Error(`Outlook draft failed: ${await draftRes.text()}`);
        const draft = await draftRes.json();
        const sendRes = await fetch(
          `https://graph.microsoft.com/v1.0/me/messages/${encodeURIComponent(draft.id)}/send`,
          { method: "POST", headers },
        );
        if (!sendRes.ok && sendRes.status !== 202) {
          throw new Error(`Outlook send failed: ${await sendRes.text()}`);
        }
        return {
          externalId: draft.internetMessageId ?? draft.id,
          metadata: {
            sent_via: "outlook",
            from_address: conn.from_address,
            graph_message_id: draft.id,
            ...(draft.conversationId ? { conversation_id: draft.conversationId } : {}),
          },
        };
      }
      // Gmail
      const boundary = `b_${Math.random().toString(36).slice(2)}`;
      const mime = [
        `From: ${conn.from_address}`,
        `To: ${to}`,
        `Subject: ${subject.replace(/[\r\n]/g, " ")}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        'Content-Type: text/plain; charset="UTF-8"',
        "",
        text,
        "",
        `--${boundary}`,
        'Content-Type: text/html; charset="UTF-8"',
        "",
        html,
        "",
        `--${boundary}--`,
      ].join("\r\n");
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: base64Url(mime) }),
      });
      if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
      const j = await res.json();
      return {
        externalId: j.id ?? null,
        metadata: {
          sent_via: "gmail",
          from_address: conn.from_address,
          ...(j.threadId ? { gmail_thread_id: j.threadId } : {}),
        },
      };
    }
  }

  // Platform fallback: Resend.
  const key = Deno.env.get("EMAIL_API_KEY");
  const from = Deno.env.get("OUTREACH_FROM_ADDRESS") ?? "";
  if (!key || !from) throw new Error("No email sending identity available");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html, text }),
  });
  if (!res.ok) throw new Error(`Email send failed: ${await res.text()}`);
  const j = await res.json();
  return {
    externalId: j.id ?? null,
    metadata: { sent_via: "resend", from_address: from },
  };
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

  const { data: due } = await supabase
    .from("sequence_enrollments")
    .select("id,user_id,sequence_id,hotlist_id,thread_id,to_address,current_step")
    .eq("status", "active")
    .lte("next_send_at", new Date().toISOString())
    .order("next_send_at", { ascending: true })
    .limit(20);

  let sent = 0;
  let stopped = 0;
  let completed = 0;
  let failed = 0;

  for (const e of due ?? []) {
    try {
      // Stop-on-reply: any inbound message in the creator's email thread ends
      // the sequence.
      const { data: thread } = await supabase
        .from("outreach_threads")
        .select("id,status")
        .eq("user_id", e.user_id)
        .eq("hotlist_id", e.hotlist_id)
        .eq("channel", "email")
        .maybeSingle();
      if (thread && thread.status === "replied") {
        await supabase
          .from("sequence_enrollments")
          .update({ status: "stopped_replied" })
          .eq("id", e.id);
        stopped++;
        continue;
      }

      const { data: steps } = await supabase
        .from("outreach_sequence_steps")
        .select("step_order,delay_days,subject,body")
        .eq("sequence_id", e.sequence_id)
        .order("step_order", { ascending: true });
      const nextOrder = (e.current_step as number) + 1;
      const step = (steps ?? []).find((s) => s.step_order === nextOrder);
      if (!step) {
        await supabase
          .from("sequence_enrollments")
          .update({ status: "completed" })
          .eq("id", e.id);
        completed++;
        continue;
      }

      const { data: creator } = await supabase
        .from("hotlist")
        .select("creator_name,campaign_id")
        .eq("id", e.hotlist_id)
        .maybeSingle();
      const name = (creator?.creator_name as string) ?? "there";
      const subject = ((step.subject as string) ?? "Partnership opportunity").replaceAll(
        "{{creator_name}}",
        name,
      );
      const body = (step.body as string).replaceAll("{{creator_name}}", name);

      // Find or create the email thread.
      let threadId = thread?.id as string | undefined;
      if (!threadId) {
        const { data: createdThread, error: tErr } = await supabase
          .from("outreach_threads")
          .insert({
            user_id: e.user_id,
            hotlist_id: e.hotlist_id,
            campaign_id: creator?.campaign_id ?? null,
            channel: "email",
            subject,
            status: "active",
          })
          .select("id")
          .single();
        if (tErr) throw new Error(tErr.message);
        threadId = createdThread.id as string;
      }

      const out = await sendAsUser(supabase, e.user_id as string, e.to_address as string, subject, body);

      await supabase.from("outreach_messages").insert({
        user_id: e.user_id,
        thread_id: threadId,
        direction: "outbound",
        channel: "email",
        subject,
        body,
        status: "sent",
        external_id: out.externalId,
        sent_at: new Date().toISOString(),
        metadata: { ...out.metadata, sequence_id: e.sequence_id, sequence_step: nextOrder },
      });
      await supabase
        .from("outreach_threads")
        .update({ status: "active", last_message_at: new Date().toISOString() })
        .eq("id", threadId);
      await supabase
        .from("hotlist")
        .update({ stage: "contacted" })
        .eq("id", e.hotlist_id)
        .eq("stage", "saved");

      const following = (steps ?? []).find((s) => s.step_order === nextOrder + 1);
      await supabase
        .from("sequence_enrollments")
        .update(
          following
            ? {
                current_step: nextOrder,
                thread_id: threadId,
                next_send_at: new Date(
                  Date.now() + (following.delay_days as number) * 24 * 60 * 60 * 1000,
                ).toISOString(),
                error: null,
              }
            : { current_step: nextOrder, thread_id: threadId, status: "completed", error: null },
        )
        .eq("id", e.id);
      if (following) sent++;
      else completed++;
    } catch (err) {
      failed++;
      await supabase
        .from("sequence_enrollments")
        .update({
          status: "failed",
          error: err instanceof Error ? err.message.slice(0, 500) : "send failed",
        })
        .eq("id", e.id);
    }
  }

  return new Response(JSON.stringify({ ok: true, due: due?.length ?? 0, sent, stopped, completed, failed }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
