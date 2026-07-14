import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Phase 4E multi-touch sequences (email-only in v1). A sequence is an ordered
// set of steps (delay + subject + body); an enrollment is one creator moving
// through it. The run-sequences edge function does the actual sending on a
// schedule with stop-on-reply, so nothing here sends mail directly.
// {{creator_name}} in step subject/body is replaced at send time.

export type SequenceStep = {
  id?: string;
  step_order: number;
  delay_days: number;
  subject: string | null;
  body: string;
};

export type Sequence = {
  id: string;
  name: string;
  campaign_id: string | null;
  status: string;
  steps: SequenceStep[];
  active_enrollments: number;
};

export type Enrollment = {
  id: string;
  sequence_id: string;
  hotlist_id: string;
  to_address: string;
  current_step: number;
  next_send_at: string | null;
  status: string;
  error: string | null;
  creator_name?: string;
};

export const listSequences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Sequence[]> => {
    const { data: seqs, error } = await context.supabase
      .from("outreach_sequences")
      .select("id,name,campaign_id,status")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    if (!seqs?.length) return [];

    const ids = seqs.map((s) => s.id);
    const [{ data: steps }, { data: enrollments }] = await Promise.all([
      context.supabase
        .from("outreach_sequence_steps")
        .select("id,sequence_id,step_order,delay_days,subject,body")
        .in("sequence_id", ids)
        .order("step_order", { ascending: true }),
      context.supabase
        .from("sequence_enrollments")
        .select("sequence_id,status")
        .in("sequence_id", ids)
        .eq("status", "active"),
    ]);

    const activeBySeq = new Map<string, number>();
    for (const e of enrollments ?? []) {
      activeBySeq.set(e.sequence_id, (activeBySeq.get(e.sequence_id) ?? 0) + 1);
    }
    return seqs.map((s) => ({
      id: s.id,
      name: s.name,
      campaign_id: s.campaign_id,
      status: s.status,
      steps: (steps ?? [])
        .filter((st) => st.sequence_id === s.id)
        .map((st) => ({
          id: st.id,
          step_order: st.step_order,
          delay_days: st.delay_days,
          subject: st.subject,
          body: st.body,
        })),
      active_enrollments: activeBySeq.get(s.id) ?? 0,
    }));
  });

export const saveSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string;
      name: string;
      campaignId?: string | null;
      steps: Array<{ delayDays: number; subject?: string; body: string }>;
    }) => data,
  )
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    if (!data.name.trim()) throw new Error("Name the sequence first");
    if (!data.steps.length) throw new Error("Add at least one step");
    if (data.steps.some((s) => !s.body.trim())) throw new Error("Every step needs a message");

    let sequenceId = data.id;
    if (sequenceId) {
      const { error } = await context.supabase
        .from("outreach_sequences")
        .update({ name: data.name.trim(), campaign_id: data.campaignId ?? null })
        .eq("id", sequenceId);
      if (error) throw new Error(error.message);
      // Replace the steps wholesale; enrollments track step numbers only.
      const { error: delErr } = await context.supabase
        .from("outreach_sequence_steps")
        .delete()
        .eq("sequence_id", sequenceId);
      if (delErr) throw new Error(delErr.message);
    } else {
      const { data: created, error } = await context.supabase
        .from("outreach_sequences")
        .insert({
          user_id: context.userId,
          name: data.name.trim(),
          campaign_id: data.campaignId ?? null,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      sequenceId = created.id;
    }

    const { error: stepErr } = await context.supabase.from("outreach_sequence_steps").insert(
      data.steps.map((s, i) => ({
        user_id: context.userId,
        sequence_id: sequenceId!,
        step_order: i + 1,
        delay_days: i === 0 ? 0 : Math.max(0, Math.round(s.delayDays)),
        subject: s.subject?.trim() || null,
        body: s.body,
      })),
    );
    if (stepErr) throw new Error(stepErr.message);
    return { id: sequenceId! };
  });

export const archiveSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    // Stop live enrollments first so the runner never picks them up again.
    await context.supabase
      .from("sequence_enrollments")
      .update({ status: "stopped_manual" })
      .eq("sequence_id", data.id)
      .eq("status", "active");
    const { error } = await context.supabase
      .from("outreach_sequences")
      .update({ status: "archived" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const enrollInSequence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sequenceId: string; hotlistId: string; toAddress: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (!data.toAddress.trim()) throw new Error("The creator needs an email address first");
    const { error } = await context.supabase.from("sequence_enrollments").upsert(
      {
        user_id: context.userId,
        sequence_id: data.sequenceId,
        hotlist_id: data.hotlistId,
        to_address: data.toAddress.trim(),
        current_step: 0,
        next_send_at: new Date().toISOString(),
        status: "active",
        error: null,
      },
      { onConflict: "sequence_id,hotlist_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const stopEnrollment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { enrollmentId: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("sequence_enrollments")
      .update({ status: "stopped_manual" })
      .eq("id", data.enrollmentId)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listEnrollments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { sequenceId?: string }) => data)
  .handler(async ({ data, context }): Promise<Enrollment[]> => {
    let q = context.supabase
      .from("sequence_enrollments")
      .select("id,sequence_id,hotlist_id,to_address,current_step,next_send_at,status,error")
      .order("created_at", { ascending: false });
    if (data.sequenceId) q = q.eq("sequence_id", data.sequenceId);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    const enrollments = (rows ?? []) as Enrollment[];
    const ids = Array.from(new Set(enrollments.map((e) => e.hotlist_id)));
    if (ids.length) {
      const { data: creators } = await context.supabase
        .from("hotlist")
        .select("id,creator_name")
        .in("id", ids);
      const nameById = new Map((creators ?? []).map((c) => [c.id, c.creator_name]));
      for (const e of enrollments) e.creator_name = nameById.get(e.hotlist_id) ?? undefined;
    }
    return enrollments;
  });
