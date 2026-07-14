import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Plus, Trash2, Users, BarChart3, Zap, Square } from "lucide-react";
import { Card } from "@/components/app/AppShell";
import {
  getEmailOAuthStatus,
  startEmailOAuth,
  disconnectEmailAccount,
  type EmailOAuthStatus,
  type EmailProvider,
} from "@/lib/email-oauth.functions";
import { getOutreachMetrics, type OutreachMetrics } from "@/lib/outreach.functions";
import {
  listSequences,
  saveSequence,
  archiveSequence,
  listEnrollments,
  stopEnrollment,
  type Sequence,
  type Enrollment,
} from "@/lib/sequences.functions";

// Phase 4E panels for the Outreach page: connect-your-own-inbox, delivery
// metrics, and multi-touch sequences. All data is real; empty states stay
// honest per the DataGate contract.

const PROVIDER_LABEL: Record<EmailProvider, string> = { outlook: "Outlook", gmail: "Gmail" };

export function EmailAccountsCard() {
  const [status, setStatus] = useState<EmailOAuthStatus | null>(null);
  const [busy, setBusy] = useState<EmailProvider | null>(null);

  const refresh = async () => setStatus(await getEmailOAuthStatus());
  useEffect(() => {
    refresh().catch(() => toast.error("Could not load email connections"));
  }, []);

  const connect = async (provider: EmailProvider) => {
    setBusy(provider);
    try {
      const { url } = await startEmailOAuth({
        data: { provider, returnTo: window.location.origin },
      });
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start connection");
      setBusy(null);
    }
  };

  const disconnect = async (provider: EmailProvider) => {
    setBusy(provider);
    try {
      await disconnectEmailAccount({ data: { provider } });
      toast.success(`${PROVIDER_LABEL[provider]} disconnected`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Disconnect failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="p-5">
      <h3 className="font-bold text-[#F0F4FF] flex items-center gap-2">
        <Mail className="w-4 h-4 text-[#00D97E]" /> Email accounts
      </h3>
      <p className="mt-1 text-xs text-[#8892A4]">
        Connect your own inbox so outreach sends from your real address. Without a connection,
        email goes out via the shared platform sender.
      </p>
      <div className="mt-4 space-y-2">
        {(["outlook", "gmail"] as EmailProvider[]).map((provider) => {
          const conn = status?.connections.find((c) => c.provider === provider);
          const configured =
            provider === "outlook" ? status?.outlookConfigured : status?.gmailConfigured;
          const active = conn?.status === "active";
          return (
            <div
              key={provider}
              className="flex items-center justify-between rounded-lg border border-white/[0.07] px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-semibold text-white">{PROVIDER_LABEL[provider]}</p>
                <p className="text-xs text-[#8892A4]">
                  {active
                    ? `Connected as ${conn?.from_address ?? "unknown"}`
                    : conn?.status === "revoked"
                      ? "Session expired — reconnect"
                      : configured
                        ? "Not connected"
                        : "Awaiting OAuth app setup"}
                </p>
              </div>
              {active ? (
                <button
                  onClick={() => disconnect(provider)}
                  disabled={busy === provider}
                  className="text-xs font-semibold px-3 h-8 rounded-lg border border-white/10 text-[#8892A4] hover:text-[#FF6B6B] disabled:opacity-50"
                >
                  {busy === provider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Disconnect"}
                </button>
              ) : (
                <button
                  onClick={() => connect(provider)}
                  disabled={!configured || busy === provider}
                  className="text-xs font-bold px-3 h-8 rounded-lg bg-[#00D97E] text-[#05080F] disabled:opacity-40 inline-flex items-center gap-1.5"
                >
                  {busy === provider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {conn?.status === "revoked" ? "Reconnect" : "Connect"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[10px] text-[#5A6478]">
        Outlook supports send + reply tracking. Gmail is send-only (replies land in your Gmail
        inbox). Tokens are stored server-side and never shared.
      </p>
    </Card>
  );
}

export function DeliveryMetricsPanel({ campaignId }: { campaignId?: string }) {
  const [metrics, setMetrics] = useState<OutreachMetrics | null>(null);
  useEffect(() => {
    getOutreachMetrics({ data: { campaignId } })
      .then(setMetrics)
      .catch(() => setMetrics(null));
  }, [campaignId]);

  return (
    <Card className="p-5">
      <h3 className="font-bold text-[#F0F4FF] flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-[#00D97E]" /> Delivery metrics
      </h3>
      {!metrics ? (
        <p className="mt-3 text-xs text-[#5A6478]">Loading…</p>
      ) : metrics.totals.sent === 0 && metrics.totals.replies === 0 ? (
        <p className="mt-3 text-xs text-[#5A6478]">No data to display</p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Sent", value: metrics.totals.sent, color: "#00D97E" },
              { label: "Replies", value: metrics.totals.replies, color: "#F59E0B" },
              { label: "Failed", value: metrics.totals.failed, color: "#FF6B6B" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-white/[0.03] px-3 py-2 text-center">
                <p className="text-lg font-bold" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-[10px] text-[#8892A4]">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1">
            {metrics.byChannel
              .filter((c) => c.sent || c.replies || c.failed)
              .map((c) => (
                <div key={c.channel} className="flex items-center justify-between text-xs">
                  <span className="text-[#8892A4] capitalize">{c.channel}</span>
                  <span className="text-[#F0F4FF]/80">
                    {c.sent} sent · {c.replies} replies · {c.replyRate}% reply rate
                  </span>
                </div>
              ))}
          </div>
        </>
      )}
    </Card>
  );
}

type EditingSequence = {
  id?: string;
  name: string;
  steps: Array<{ delayDays: number; subject: string; body: string }>;
};

export function SequencesPanel({ campaignId }: { campaignId?: string }) {
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingSequence | null>(null);
  const [saving, setSaving] = useState(false);
  const [enrollmentsFor, setEnrollmentsFor] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);

  const refresh = async () => {
    setLoading(true);
    try {
      setSequences(await listSequences());
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    refresh().catch(() => toast.error("Could not load sequences"));
  }, []);

  const openEnrollments = async (sequenceId: string) => {
    setEnrollmentsFor(sequenceId);
    setEnrollments(await listEnrollments({ data: { sequenceId } }));
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await saveSequence({
        data: {
          id: editing.id,
          name: editing.name,
          campaignId: campaignId ?? null,
          steps: editing.steps.map((s) => ({
            delayDays: s.delayDays,
            subject: s.subject,
            body: s.body,
          })),
        },
      });
      toast.success("Sequence saved");
      setEditing(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const archive = async (id: string) => {
    try {
      await archiveSequence({ data: { id } });
      toast.success("Sequence archived (live enrollments stopped)");
      if (enrollmentsFor === id) setEnrollmentsFor(null);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Archive failed");
    }
  };

  const stop = async (enrollmentId: string) => {
    try {
      await stopEnrollment({ data: { enrollmentId } });
      if (enrollmentsFor) await openEnrollments(enrollmentsFor);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Stop failed");
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-[#F0F4FF] flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00D97E]" /> Sequences
        </h3>
        {!editing && (
          <button
            onClick={() =>
              setEditing({ name: "", steps: [{ delayDays: 0, subject: "", body: "" }] })
            }
            className="text-xs font-bold px-3 h-8 rounded-lg bg-[#00D97E] text-[#05080F] inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-[#8892A4]">
        Multi-touch email follow-ups with stop-on-reply. Enroll creators from the composer. Use{" "}
        <code className="text-[#00D97E]">{"{{creator_name}}"}</code> to personalize.
      </p>

      {editing ? (
        <div className="mt-4 space-y-3">
          <input
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            placeholder="Sequence name (e.g. Creator intro, 3 touches)"
            className="w-full h-10 px-3 rounded-lg bg-[#05080F] border border-white/10 text-sm text-white focus:outline-none focus:border-[#00D97E]"
          />
          {editing.steps.map((step, i) => (
            <div key={i} className="rounded-lg border border-white/[0.07] p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-[#8892A4]">
                  Step {i + 1}
                  {i === 0 ? " — sends on enrollment" : ""}
                </p>
                {editing.steps.length > 1 && (
                  <button
                    onClick={() =>
                      setEditing({ ...editing, steps: editing.steps.filter((_, j) => j !== i) })
                    }
                    className="text-[#5A6478] hover:text-[#FF6B6B]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {i > 0 && (
                <label className="flex items-center gap-2 text-xs text-[#8892A4]">
                  Wait
                  <input
                    type="number"
                    min={0}
                    value={step.delayDays}
                    onChange={(e) => {
                      const steps = [...editing.steps];
                      steps[i] = { ...step, delayDays: Number(e.target.value) };
                      setEditing({ ...editing, steps });
                    }}
                    className="w-16 h-8 px-2 rounded bg-[#05080F] border border-white/10 text-white text-xs"
                  />
                  day(s) after the previous step
                </label>
              )}
              <input
                value={step.subject}
                onChange={(e) => {
                  const steps = [...editing.steps];
                  steps[i] = { ...step, subject: e.target.value };
                  setEditing({ ...editing, steps });
                }}
                placeholder="Subject"
                className="w-full h-9 px-3 rounded-lg bg-[#05080F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00D97E]"
              />
              <textarea
                value={step.body}
                onChange={(e) => {
                  const steps = [...editing.steps];
                  steps[i] = { ...step, body: e.target.value };
                  setEditing({ ...editing, steps });
                }}
                rows={3}
                placeholder={`Hi {{creator_name}}, …`}
                className="w-full px-3 py-2 rounded-lg bg-[#05080F] border border-white/10 text-xs text-white focus:outline-none focus:border-[#00D97E] resize-y"
              />
            </div>
          ))}
          <div className="flex justify-between">
            <button
              onClick={() =>
                setEditing({
                  ...editing,
                  steps: [...editing.steps, { delayDays: 3, subject: "", body: "" }],
                })
              }
              className="text-xs font-semibold px-3 h-8 rounded-lg border border-white/10 text-[#8892A4] hover:text-white inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add step
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(null)}
                className="text-xs px-3 h-8 rounded-lg border border-white/10 text-[#8892A4] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="text-xs font-bold px-4 h-8 rounded-lg bg-[#00D97E] text-[#05080F] disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save sequence
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <p className="mt-3 text-xs text-[#5A6478]">Loading…</p>
      ) : sequences.length === 0 ? (
        <p className="mt-3 text-xs text-[#5A6478]">No data to display</p>
      ) : (
        <div className="mt-3 space-y-2">
          {sequences.map((s) => (
            <div key={s.id} className="rounded-lg border border-white/[0.07] px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-[#8892A4]">
                    {s.steps.length} step{s.steps.length === 1 ? "" : "s"} · {s.active_enrollments}{" "}
                    active
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() =>
                      setEditing({
                        id: s.id,
                        name: s.name,
                        steps: s.steps.map((st) => ({
                          delayDays: st.delay_days,
                          subject: st.subject ?? "",
                          body: st.body,
                        })),
                      })
                    }
                    className="text-xs px-2.5 h-7 rounded-lg border border-white/10 text-[#8892A4] hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      enrollmentsFor === s.id ? setEnrollmentsFor(null) : openEnrollments(s.id)
                    }
                    className="text-xs px-2.5 h-7 rounded-lg border border-white/10 text-[#8892A4] hover:text-white inline-flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" /> Enrollments
                  </button>
                  <button
                    onClick={() => archive(s.id)}
                    className="text-xs px-2.5 h-7 rounded-lg border border-white/10 text-[#5A6478] hover:text-[#FF6B6B]"
                  >
                    Archive
                  </button>
                </div>
              </div>
              {enrollmentsFor === s.id && (
                <div className="mt-2 border-t border-white/[0.07] pt-2 space-y-1.5">
                  {enrollments.length === 0 ? (
                    <p className="text-xs text-[#5A6478]">No creators enrolled yet.</p>
                  ) : (
                    enrollments.map((e) => (
                      <div key={e.id} className="flex items-center justify-between text-xs">
                        <span className="text-[#F0F4FF]/85">
                          {e.creator_name ?? e.to_address}{" "}
                          <span className="text-[#5A6478]">
                            · step {e.current_step} · {e.status.replace("_", " ")}
                            {e.status === "active" && e.next_send_at
                              ? ` · next ${new Date(e.next_send_at).toLocaleDateString()}`
                              : ""}
                          </span>
                        </span>
                        {e.status === "active" && (
                          <button
                            onClick={() => stop(e.id)}
                            className="text-[#5A6478] hover:text-[#FF6B6B] inline-flex items-center gap-1"
                          >
                            <Square className="w-3 h-3" /> Stop
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
