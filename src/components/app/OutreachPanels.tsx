import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Square } from "lucide-react";
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

/* Phase 4E panels for the Outreach page: connect-your-own-inbox, delivery
   metrics, and multi-touch sequences. All data is real; empty states stay
   honest per the DataGate contract.

   Ported to Aspen per SCREENS-TO-PORT.md §1–3. Behaviour is untouched — OAuth
   start and disconnect, the `configured` gate, the revoked state, busy
   spinners, the sequence editor, enrollments, stop-on-reply and archive all
   work exactly as before. Sequences deliberately stays dark: it is the accent
   card in that row.

   These render inside the Outreach route's `.aspen-scope`, which is what binds
   `accent` / `muted` / `border` to the Aspen palette rather than shadcn's. */

const PROVIDER_LABEL: Record<EmailProvider, string> = { outlook: "Outlook", gmail: "Gmail" };

const CARD = "bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]";
const HEADING = "font-heading font-bold text-[16.5px]";

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
    <div className={CARD}>
      <h3 className={`${HEADING} m-[0_0_6px]`}>Sending identity</h3>
      <p className="text-[12.5px] text-subtle leading-[1.5] m-0">
        Connect your own inbox so outreach sends from your real address. Without one, email goes out
        via the shared Aspen sender.
      </p>

      <div className="flex flex-col gap-[9px] mt-[14px]">
        {(["outlook", "gmail"] as EmailProvider[]).map((provider) => {
          const conn = status?.connections.find((c) => c.provider === provider);
          const configured =
            provider === "outlook" ? status?.outlookConfigured : status?.gmailConfigured;
          const active = conn?.status === "active";
          const spinning = busy === provider;
          return (
            <div
              key={provider}
              className="flex items-center justify-between gap-[12px] bg-cream rounded-[13px] px-[15px] py-[12px]"
            >
              <div className="min-w-0">
                <div className="text-[14px] font-bold">{PROVIDER_LABEL[provider]}</div>
                <div className="text-[12px] text-subtle mt-[2px] truncate">
                  {active
                    ? `Connected as ${conn?.from_address ?? "unknown"}`
                    : conn?.status === "revoked"
                      ? "Session expired — reconnect"
                      : configured
                        ? "Not connected"
                        : "Awaiting OAuth app setup"}
                </div>
              </div>
              {active ? (
                <button
                  onClick={() => disconnect(provider)}
                  disabled={spinning}
                  className="shrink-0 inline-flex items-center gap-[6px] border-[1.5px] border-border bg-transparent text-[12.5px] font-bold text-subtle rounded-[9px] px-[13px] h-[32px] cursor-pointer transition-colors hover:border-accent-deep hover:text-accent-deep disabled:opacity-50"
                >
                  {spinning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => connect(provider)}
                  disabled={!configured || spinning}
                  className="shrink-0 inline-flex items-center gap-[6px] border-0 bg-accent text-cream text-[12.5px] font-bold rounded-[9px] px-[13px] h-[32px] cursor-pointer transition-colors hover:bg-dark disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {spinning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {conn?.status === "revoked" ? "Reconnect" : "Connect"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11.5px] text-sand-ink leading-[1.5] mt-[12px] m-0">
        Outlook supports send and reply tracking. Gmail is send-only — replies land in your Gmail
        inbox. Tokens are stored server-side and never shared.
      </p>
    </div>
  );
}

export function DeliveryMetricsPanel({ campaignId }: { campaignId?: string }) {
  const [metrics, setMetrics] = useState<OutreachMetrics | null>(null);
  useEffect(() => {
    getOutreachMetrics({ data: { campaignId } })
      .then(setMetrics)
      .catch(() => setMetrics(null));
  }, [campaignId]);

  const empty = metrics && metrics.totals.sent === 0 && metrics.totals.replies === 0;

  return (
    <div className={CARD}>
      <h3 className={`${HEADING} m-[0_0_14px]`}>Delivery metrics</h3>

      {!metrics ? (
        <p className="text-[12.5px] text-subtle m-0">Loading…</p>
      ) : empty ? (
        <p className="text-[12.5px] text-subtle m-0">No data to display</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-[9px]">
            {[
              { label: "Sent", value: metrics.totals.sent, color: "var(--color-dark)" },
              { label: "Replies", value: metrics.totals.replies, color: "var(--color-accent)" },
              { label: "Failed", value: metrics.totals.failed, color: "var(--color-subtle)" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-cream rounded-[13px] px-[10px] py-[13px] text-center"
              >
                <div
                  className="font-heading font-extrabold text-[26px] tracking-[-0.02em] leading-[1.1]"
                  style={{ color: s.color }}
                >
                  {s.value}
                </div>
                <div className="text-[12px] font-semibold text-subtle mt-[2px]">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col mt-[14px]">
            {metrics.byChannel
              .filter((c) => c.sent || c.replies || c.failed)
              .map((c) => (
                <div
                  key={c.channel}
                  className="flex items-center justify-between gap-[12px] text-[12.5px] py-[8px] border-t-[1px] border-border-soft"
                >
                  <span className="font-semibold text-subtle capitalize">{c.channel}</span>
                  <span className="text-muted">
                    {c.sent} sent · {c.replies} replies · {c.replyRate}% reply rate
                  </span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

type EditingSequence = {
  id?: string;
  name: string;
  steps: Array<{ delayDays: number; subject: string; body: string }>;
};

// Aspen field style, per SCREENS-TO-PORT.md §3. Cream on a dark card reads as an
// input rather than a hole in the surface.
const FIELD =
  "w-full box-border bg-cream text-dark border-[1.5px] border-border rounded-[11px] px-[13px] outline-none focus:border-accent";

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

  const ghostBtn =
    "border-[1.5px] border-dark-line bg-transparent text-[11.5px] font-bold rounded-[8px] px-[11px] h-[28px] cursor-pointer transition-colors";

  return (
    <div className="bg-dark text-cream rounded-[20px] p-[22px]">
      <div className="flex items-center justify-between gap-[12px]">
        <h3 className={`${HEADING} m-0`}>Sequences</h3>
        {!editing && (
          <button
            onClick={() =>
              setEditing({ name: "", steps: [{ delayDays: 0, subject: "", body: "" }] })
            }
            className="inline-flex items-center gap-[5px] border-0 bg-accent text-cream text-[12.5px] font-bold rounded-[9px] px-[13px] h-[30px] cursor-pointer transition-colors hover:bg-highlight hover:text-dark"
          >
            <Plus className="w-3.5 h-3.5" /> New
          </button>
        )}
      </div>
      <p className="text-[12.5px] text-subtle leading-[1.5] m-[6px_0_0]">
        Multi-touch follow-ups that stop the moment someone replies. Enroll creators from the
        composer.
      </p>

      {editing ? (
        <div className="flex flex-col gap-[12px] mt-[16px]">
          <input
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            placeholder="Sequence name (e.g. Creator intro, 3 touches)"
            className={`${FIELD} h-[42px] text-[14px]`}
          />
          {editing.steps.map((step, i) => (
            <div
              key={i}
              className="bg-dark-raised rounded-[13px] p-[15px] flex flex-col gap-[10px]"
            >
              <div className="flex items-center justify-between gap-[10px]">
                <div className="text-[11.5px] font-bold tracking-[0.06em] text-subtle">
                  STEP {i + 1}
                  {i === 0 ? " — SENDS ON ENROLLMENT" : ""}
                </div>
                {editing.steps.length > 1 && (
                  <button
                    onClick={() =>
                      setEditing({ ...editing, steps: editing.steps.filter((_, j) => j !== i) })
                    }
                    className="border-0 bg-transparent text-subtle cursor-pointer transition-colors hover:text-accent-soft"
                    aria-label={`Remove step ${i + 1}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {i > 0 && (
                <label className="flex items-center gap-[8px] text-[12.5px] text-on-dark">
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
                    className={`${FIELD} w-[64px] h-[32px] text-[12.5px] px-[9px]`}
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
                className={`${FIELD} h-[38px] text-[13px]`}
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
                className={`${FIELD} py-[10px] text-[13px] leading-[1.55] resize-y rounded-[12px]`}
              />
            </div>
          ))}
          <div className="flex justify-between gap-[10px] flex-wrap">
            <button
              onClick={() =>
                setEditing({
                  ...editing,
                  steps: [...editing.steps, { delayDays: 3, subject: "", body: "" }],
                })
              }
              className={`${ghostBtn} inline-flex items-center gap-[5px] text-on-dark hover:text-cream hover:border-subtle`}
            >
              <Plus className="w-3.5 h-3.5" /> Add step
            </button>
            <div className="flex gap-[8px]">
              <button
                onClick={() => setEditing(null)}
                className={`${ghostBtn} text-on-dark hover:text-cream hover:border-subtle`}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-[6px] border-0 bg-accent text-cream text-[12.5px] font-bold rounded-[9px] px-[15px] h-[28px] cursor-pointer transition-colors hover:bg-highlight hover:text-dark disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Save sequence
              </button>
            </div>
          </div>
        </div>
      ) : loading ? (
        <p className="text-[12.5px] text-subtle m-[16px_0_0]">Loading…</p>
      ) : sequences.length === 0 ? (
        <p className="text-[12.5px] text-subtle m-[16px_0_0]">No data to display</p>
      ) : (
        <div className="flex flex-col gap-[9px] mt-[16px]">
          {sequences.map((s) => (
            <div key={s.id} className="bg-dark-raised rounded-[13px] px-[15px] py-[13px]">
              <div className="flex items-start justify-between gap-[12px]">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold">{s.name}</div>
                  <div className="text-[12px] text-subtle mt-[2px]">
                    {s.steps.length} step{s.steps.length === 1 ? "" : "s"} · {s.active_enrollments}{" "}
                    active
                  </div>
                </div>
                <span
                  className="text-[11.5px] font-bold shrink-0"
                  style={{
                    color:
                      s.active_enrollments > 0 ? "var(--color-highlight)" : "var(--color-subtle)",
                  }}
                >
                  {s.active_enrollments > 0 ? "Running" : "Paused"}
                </span>
              </div>

              <div className="flex gap-[7px] mt-[11px] flex-wrap">
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
                  className={`${ghostBtn} text-on-dark hover:text-cream hover:border-subtle`}
                >
                  Edit
                </button>
                <button
                  onClick={() =>
                    enrollmentsFor === s.id ? setEnrollmentsFor(null) : openEnrollments(s.id)
                  }
                  className={`${ghostBtn} text-on-dark hover:text-cream hover:border-subtle`}
                >
                  Enrollments
                </button>
                <button
                  onClick={() => archive(s.id)}
                  className={`${ghostBtn} text-subtle hover:text-accent-soft hover:border-accent-soft`}
                >
                  Archive
                </button>
              </div>

              {enrollmentsFor === s.id && (
                <div className="mt-[11px] pt-[11px] border-t-[1px] border-dark-border flex flex-col gap-[7px]">
                  {enrollments.length === 0 ? (
                    <p className="text-[12px] text-subtle m-0">No creators enrolled yet.</p>
                  ) : (
                    enrollments.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center justify-between gap-[10px] text-[12px]"
                      >
                        <span className="text-on-dark min-w-0 truncate">
                          {e.creator_name ?? e.to_address}{" "}
                          <span className="text-subtle">
                            · step {e.current_step} · {e.status.replace("_", " ")}
                            {e.status === "active" && e.next_send_at
                              ? ` · next ${new Date(e.next_send_at).toLocaleDateString()}`
                              : ""}
                          </span>
                        </span>
                        {e.status === "active" && (
                          <button
                            onClick={() => stop(e.id)}
                            className="shrink-0 inline-flex items-center gap-[4px] border-0 bg-transparent text-subtle text-[12px] font-bold cursor-pointer transition-colors hover:text-accent-soft"
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

      <p className="text-[11.5px] text-dark-muted leading-[1.5] m-[16px_0_0]">
        Use <code className="text-highlight font-bold">{"{{creator_name}}"}</code> to personalize a
        step.
      </p>
    </div>
  );
}
