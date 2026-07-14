import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell, Card } from "@/components/app/AppShell";
import { CampaignPicker } from "@/components/app/CampaignPicker";
import { OutreachComposer } from "@/components/app/OutreachComposer";
import { Inbox, MessageSquare, ArrowRight, Loader2 } from "lucide-react";
import {
  listThreads,
  getThreadMessages,
  type OutreachThread,
  type OutreachMessage,
} from "@/lib/outreach.functions";

// Unified outreach inbox. Every conversation across email, X, Reddit, and
// LinkedIn-assisted lands here, scoped by campaign. Threads on the left, the
// selected conversation on the right, with a reply composer. New outreach is
// started from a creator's profile or the hotlist; this page manages the
// back-and-forth once it exists.
export const Route = createFileRoute("/app/outreach")({
  validateSearch: (search: Record<string, unknown>) => ({
    campaign: typeof search.campaign === "string" ? search.campaign : undefined,
  }),
  component: OutreachPage,
});

const CHANNEL_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  email: { bg: "rgba(0,217,126,0.15)", color: "#00D97E", label: "Email" },
  x: { bg: "rgba(255,255,255,0.1)", color: "#FFFFFF", label: "X" },
  reddit: { bg: "rgba(255,69,0,0.15)", color: "#FF7B3D", label: "Reddit" },
  linkedin: { bg: "rgba(10,102,194,0.15)", color: "#5BA4F5", label: "LinkedIn" },
};

const STATUS_COLOR: Record<string, string> = {
  active: "#00D97E",
  replied: "#F59E0B",
  bounced: "#FF6B6B",
  closed: "#5A6478",
  draft: "#8892A4",
};

function OutreachPage() {
  const { campaign: campaignParam } = Route.useSearch();
  const [campaignId, setCampaignId] = useState<string | undefined>(campaignParam);
  const [threads, setThreads] = useState<OutreachThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OutreachThread | null>(null);
  const [messages, setMessages] = useState<OutreachMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [replying, setReplying] = useState(false);

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

  const counts = useMemo(() => {
    const c = { total: threads.length, replied: threads.filter((t) => t.status === "replied").length };
    return c;
  }, [threads]);

  return (
    <AppShell
      title="Outreach Inbox"
      right={<CampaignPicker value={campaignId} onChange={setCampaignId} />}
    >
      <p className="text-[#8892A4] mb-4">
        {counts.total} conversation{counts.total === 1 ? "" : "s"}
        {counts.replied > 0 ? ` · ${counts.replied} replied` : ""} — email, X, Reddit, and LinkedIn in one place.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-[#8892A4] text-sm py-12 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading conversations…
        </div>
      ) : threads.length === 0 ? (
        <Card className="p-10 text-center">
          <Inbox className="w-12 h-12 mx-auto text-[#00D97E]" strokeWidth={1.2} />
          <h2 className="mt-4 text-lg font-bold text-[#F0F4FF]">No conversations yet</h2>
          <p className="mt-1 text-sm text-[#8892A4] max-w-md mx-auto">
            Start outreach from a creator's profile or your hotlist. Replies and sent messages will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
          {/* Threads list */}
          <div className="space-y-2">
            {threads.map((t) => {
              const b = CHANNEL_BADGE[t.channel] ?? CHANNEL_BADGE.email;
              return (
                <button
                  key={t.id}
                  onClick={() => openThread(t)}
                  className={`w-full text-left rounded-xl border p-3 transition-colors ${
                    selected?.id === t.id
                      ? "border-[#00D97E] bg-[#0C1222]"
                      : "border-white/[0.07] bg-[#0C1222] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-white truncate">
                      {t.creator_name ?? "Creator"}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                      style={{ background: b.bg, color: b.color }}
                    >
                      {b.label}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: STATUS_COLOR[t.status] ?? "#8892A4" }}
                    >
                      ● {t.status}
                    </span>
                    {t.last_message_at && (
                      <span className="text-[10px] text-[#5A6478]">
                        {new Date(t.last_message_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Conversation */}
          <Card className="p-5 min-h-[400px]">
            {!selected ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[#5A6478]">
                <MessageSquare className="w-10 h-10" strokeWidth={1.2} />
                <p className="mt-3 text-sm">Select a conversation to read and reply.</p>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#F0F4FF]">{selected.creator_name ?? "Creator"}</h3>
                  <button
                    onClick={() => setReplying(true)}
                    className="px-4 h-9 rounded-lg bg-[#00D97E] text-[#05080F] text-xs font-bold inline-flex items-center gap-1.5"
                  >
                    Reply <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                {loadingMsgs ? (
                  <p className="text-xs text-[#5A6478]">Loading messages…</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`rounded-lg p-3 border ${
                          m.direction === "outbound"
                            ? "bg-[#00D97E]/[0.06] border-[#00D97E]/20 ml-8"
                            : "bg-white/[0.03] border-white/[0.07] mr-8"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8892A4]">
                            {m.direction === "outbound" ? "You" : selected.creator_name ?? "Creator"}
                          </span>
                          <span
                            className="text-[10px]"
                            style={{ color: m.status === "failed" ? "#FF6B6B" : "#5A6478" }}
                          >
                            {m.status}
                          </span>
                        </div>
                        {m.subject && <p className="text-xs font-semibold text-[#F0F4FF]">{m.subject}</p>}
                        <p className="text-sm text-[#F0F4FF]/85 whitespace-pre-wrap">{m.body}</p>
                        {m.error && <p className="mt-1 text-[10px] text-[#FF6B6B]">{m.error}</p>}
                      </div>
                    ))}
                    {messages.length === 0 && (
                      <p className="text-xs text-[#5A6478]">No messages in this thread yet.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
