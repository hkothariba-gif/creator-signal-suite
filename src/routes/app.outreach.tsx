import { createFileRoute } from "@tanstack/react-router";
import type { SearchSchemaInput } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { OutreachComposer } from "@/components/app/OutreachComposer";
import {
  EmailAccountsCard,
  DeliveryMetricsPanel,
  SequencesPanel,
} from "@/components/app/OutreachPanels";
import {
  listThreads,
  getThreadMessages,
  type OutreachThread,
  type OutreachMessage,
} from "@/lib/outreach.functions";
import { useAspenCampaign } from "@/routes/app";

/* OUTREACH INBOX — the `v.isOutreach` block of src/aspen/AspenApp.tsx, on the
   live hooks the dark version used. Shell, header and title come from the /app
   layout route. Campaign scope comes from the sidebar switcher; the `campaign`
   search param still overrides it.

   Unified outreach inbox. Every conversation across email, X, Reddit, and
   LinkedIn-assisted lands here, scoped by campaign. Threads on the left, the
   selected conversation on the right, with a reply composer. New outreach is
   started from a creator's profile or the hotlist; this page manages the
   back-and-forth once it exists.

   The design's Open/Archived tabs map onto thread status: "Archived" is the
   closed threads, which the dark version never surfaced at all. */

export const Route = createFileRoute("/app/outreach")({
  validateSearch: (
    search: { campaign?: string; connected?: string; email_error?: string } & SearchSchemaInput,
  ) => ({
    campaign: typeof search.campaign === "string" ? search.campaign : undefined,
    connected: typeof search.connected === "string" ? search.connected : undefined,
    email_error: typeof search.email_error === "string" ? search.email_error : undefined,
  }),
  component: OutreachPage,
});

// The design's channel chips, in its brand colours.
const CHANNEL: Record<string, { color: string; label: string }> = {
  email: { color: "var(--color-youtube)", label: "Email" },
  x: { color: "var(--color-dark)", label: "X" },
  reddit: { color: "var(--color-reddit)", label: "Reddit" },
  linkedin: { color: "var(--color-linkedin)", label: "LinkedIn" },
};

const STATUS_COLOR: Record<string, string> = {
  active: "var(--color-success)",
  replied: "var(--color-accent)",
  bounced: "var(--color-accent-deep)",
  closed: "var(--color-subtle)",
  draft: "var(--color-subtle)",
};

function OutreachPage() {
  const { campaign: campaignParam, connected, email_error } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { selected: selectedCampaign } = useAspenCampaign();
  const campaignId = campaignParam ?? selectedCampaign?.id;

  const [threads, setThreads] = useState<OutreachThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OutreachThread | null>(null);
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [replying, setReplying] = useState(false);
  const [inbox, setInbox] = useState<"open" | "archived">("open");

  // Post-OAuth landing: surface the outcome once, then clean the URL.
  useEffect(() => {
    if (connected) toast.success(`${connected === "outlook" ? "Outlook" : "Gmail"} connected`);
    if (email_error) toast.error(`Email connection failed: ${email_error.replace(/_/g, " ")}`);
    if (connected || email_error) {
      navigate({
        search: (s: {
          campaign: string | undefined;
          connected: string | undefined;
          email_error: string | undefined;
        }) => ({ ...s, connected: undefined, email_error: undefined }),
        replace: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, email_error]);

  const loadThreads = async () => {
    setLoading(true);
    try {
      const rows = await listThreads({ data: { campaignId } });
      setThreads(rows);
      if (selected && !rows.find((r) => r.id === selected.id)) setSelected(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const openThread = async (t: OutreachThread) => {
    setSelected(t);
    setReplying(false);
    setLoadingMsgs(true);
    try {
      setMessages(await getThreadMessages({ data: { threadId: t.id } }));
    } finally {
      setLoadingMsgs(false);
    }
  };

  const open = useMemo(() => threads.filter((t) => t.status !== "closed"), [threads]);
  const archived = useMemo(() => threads.filter((t) => t.status === "closed"), [threads]);
  const visible = inbox === "archived" ? archived : open;
  const replied = open.filter((t) => t.status === "replied").length;

  return (
    <div className="aspen-scope">
      <div className="text-[14px] text-muted mb-[18px]">
        {threads.length} conversation{threads.length === 1 ? "" : "s"}
        {replied > 0 ? ` · ${replied} replied` : ""} — email, X, Reddit and LinkedIn in one place.
      </div>

      <div className="flex gap-[16px] items-start flex-wrap">
        <div className="flex-[0_1_320px] min-w-[280px] flex flex-col gap-[9px]">
          <div className="flex gap-[7px] mb-[3px]">
            {[
              { key: "open" as const, label: `Open (${open.length})` },
              { key: "archived" as const, label: `Archived (${archived.length})` },
            ].map((t) => {
              const on = inbox === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setInbox(t.key)}
                  className="text-[12.5px] font-bold p-[8px_13px] rounded-[10px] cursor-pointer"
                  style={{
                    border: `1.5px solid ${on ? "var(--color-dark)" : "var(--color-border)"}`,
                    background: on ? "var(--color-dark)" : "var(--color-surface)",
                    color: on ? "var(--color-cream)" : "var(--color-muted)",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="text-[13.5px] text-subtle p-[24px_0] text-center">
              Loading conversations…
            </div>
          ) : visible.length === 0 ? (
            <div className="bg-surface border-[1.5px] border-border rounded-[18px] p-[32px_22px] text-center">
              <img
                src="/aspen/empty-outreach.webp"
                alt="A clay letterbox with one folded note"
                className="w-[120px] block mx-auto"
                loading="lazy"
              />
              <div className="font-heading font-extrabold text-[18px] tracking-[-0.02em] mt-[4px]">
                {inbox === "archived" ? "Nothing archived" : "No conversations yet"}
              </div>
              <p className="text-[13.5px] text-muted leading-[1.55] m-[8px_auto_0] max-w-[230px]">
                {inbox === "archived"
                  ? "Conversations you close land here, with every contact attempt still logged."
                  : "Start outreach from a creator's profile or your hotlist. Replies and sent messages appear here."}
              </p>
            </div>
          ) : (
            visible.map((t) => {
              const ch = CHANNEL[t.channel] ?? CHANNEL.email;
              const on = selected?.id === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => openThread(t)}
                  className="text-left cursor-pointer bg-surface rounded-[15px] p-[14px_15px]"
                  style={{ border: `1.5px solid ${on ? "var(--color-accent)" : "var(--color-border)"}` }}
                >
                  <div className="flex items-center justify-between gap-[10px]">
                    <span className="text-[14.5px] font-bold truncate">
                      {t.creator_name ?? "Creator"}
                    </span>
                    <span
                      className="text-[10.5px] font-bold text-surface p-[3px_8px] rounded-[6px] shrink-0"
                      style={{ background: ch.color }}
                    >
                      {ch.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-[9px] mt-[7px]">
                    <span
                      className="text-[11.5px] font-bold"
                      style={{ color: STATUS_COLOR[t.status] ?? "var(--color-subtle)" }}
                    >
                      ● {t.status}
                    </span>
                    {t.last_message_at ? (
                      <span className="text-[11.5px] text-subtle">
                        {new Date(t.last_message_at).toLocaleDateString()}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex-[1_1_420px] min-w-[320px] bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
          {!selected ? (
            <div className="text-center text-[13.5px] text-subtle p-[48px_0]">
              Select a conversation to read and reply.
            </div>
          ) : replying ? (
            <OutreachComposer
              hotlistId={selected.hotlist_id}
              campaignId={selected.campaign_id}
              creatorName={selected.creator_name ?? "creator"}
              onSent={async () => {
                setReplying(false);
                await openThread(selected);
                await loadThreads();
              }}
              onClose={() => setReplying(false)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between gap-[12px] pb-[16px] border-b-[1.5px] border-border-soft">
                <div>
                  <div className="font-heading font-bold text-[18px]">
                    {selected.creator_name ?? "Creator"}
                  </div>
                  <div className="text-[12.5px] text-subtle mt-[2px]">
                    {(CHANNEL[selected.channel] ?? CHANNEL.email).label}
                    {selected.last_message_at
                      ? ` · ${new Date(selected.last_message_at).toLocaleDateString()}`
                      : ""}
                  </div>
                </div>
                <button
                  onClick={() => setReplying(true)}
                  className="border-0 bg-accent text-cream text-[13.5px] font-bold p-[10px_16px] rounded-[11px] cursor-pointer ah36"
                >
                  Reply →
                </button>
              </div>
              <div className="flex flex-col gap-[12px] mt-[18px]">
                {loadingMsgs ? (
                  <div className="text-[13px] text-subtle">Loading messages…</div>
                ) : messages.length === 0 ? (
                  <div className="text-[13px] text-subtle">No messages in this thread yet.</div>
                ) : (
                  messages.map((m) => {
                    const out = m.direction === "outbound";
                    return (
                      <div
                        key={m.id}
                        className="rounded-[15px] p-[15px]"
                        style={{
                          background: out ? "var(--color-accent-wash)" : "var(--color-cream)",
                          border: `1.5px solid ${out ? "var(--color-accent-pale)" : "var(--color-border)"}`,
                          marginLeft: out ? "32px" : "0px",
                          marginRight: out ? "0px" : "32px",
                        }}
                      >
                        <div className="flex items-center justify-between gap-[10px] mb-[7px]">
                          <span className="text-[11px] font-bold tracking-[0.1em] text-subtle">
                            {out ? "YOU" : (selected.creator_name ?? "CREATOR").toUpperCase()}
                          </span>
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: m.status === "failed" ? "var(--color-accent-deep)" : "var(--color-subtle)" }}
                          >
                            {m.status}
                          </span>
                        </div>
                        {m.subject ? (
                          <div className="text-[13.5px] font-bold mb-[4px]">{m.subject}</div>
                        ) : null}
                        <div className="text-[14px] leading-[1.6] text-muted whitespace-pre-wrap">
                          {m.body}
                        </div>
                        {m.error ? (
                          <div className="text-[11.5px] text-accent-deep mt-[6px]">{m.error}</div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Phase 4E: sending identity, delivery metrics, and sequences. */}
      <div className="text-[12px] font-bold tracking-[0.14em] text-subtle m-[34px_0_14px]">
        SENDING &amp; AUTOMATION
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[16px]">
        <EmailAccountsCard />
        <DeliveryMetricsPanel campaignId={campaignId} />
      </div>
      <div className="mt-[16px]">
        <SequencesPanel campaignId={campaignId} />
      </div>
    </div>
  );
}
