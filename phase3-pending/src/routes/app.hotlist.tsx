import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { CampaignPicker } from "@/components/app/CampaignPicker";
import { AffiliateHeatMap, type HeatCreator } from "@/components/app/AffiliateHeatMap";
import { scoreCampaignCreators } from "@/lib/creators.functions";
import { GripVertical, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/app/hotlist")({
  validateSearch: (search: Record<string, unknown>) => ({
    campaign: typeof search.campaign === "string" ? search.campaign : undefined,
  }),
  component: HotlistPage,
});

type Row = Tables<"hotlist">;

const STAGES: { key: string; label: string }[] = [
  { key: "saved", label: "Saved" },
  { key: "contacted", label: "Contacted" },
  { key: "negotiating", label: "Negotiating" },
  { key: "contracted", label: "Contracted" },
  { key: "live", label: "Live / Posted" },
];

const PLATFORM_FILTERS = ["All", "YouTube", "Reddit", "X", "LinkedIn"];

const platBadge = (p: string | null) => {
  const v = (p ?? "").toLowerCase();
  if (v === "youtube") return { bg: "rgba(255,0,0,0.15)", color: "#FF6B6B" };
  if (v === "reddit") return { bg: "rgba(255,69,0,0.15)", color: "#FF7B3D" };
  if (v === "linkedin") return { bg: "rgba(10,102,194,0.15)", color: "#5BA4F5" };
  return { bg: "rgba(255,255,255,0.1)", color: "#FFFFFF" };
};

const slugify = (n: string) => encodeURIComponent(n.toLowerCase().replace(/\s+/g, "-"));

function HotlistPage() {
  const { user } = useAuth();
  const { campaign: campaignParam } = Route.useSearch();
  const status = useConnectorStatus();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [dragging, setDragging] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | undefined>(campaignParam);
  const [scoring, setScoring] = useState(false);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("hotlist")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Campaign scope first, then the platform chip filter.
  const campaignRows = useMemo(
    () => (campaignId ? rows.filter((r) => r.campaign_id === campaignId) : rows),
    [rows, campaignId],
  );

  const filtered = useMemo(
    () =>
      filter === "All"
        ? campaignRows
        : campaignRows.filter((r) => (r.platform ?? "").toLowerCase() === filter.toLowerCase()),
    [campaignRows, filter],
  );

  // Scored creators for the heat map, derived from stored breakdowns.
  const scored = useMemo<HeatCreator[]>(() => {
    if (!campaignId) return [];
    const out: HeatCreator[] = [];
    for (const r of campaignRows) {
      const pd = (r.profile_data ?? {}) as Record<string, any>;
      const b = pd.score_breakdown;
      if (!b) continue;
      out.push({
        id: r.id,
        name: r.creator_name,
        overall: typeof b.overall === "number" ? b.overall : (r.score ?? 0),
        alignment: b.alignment ?? null,
        channel: b.channel ?? null,
        content: b.content ?? null,
        comments: b.comments ?? null,
        method: b.method === "llm" ? "llm" : "keyword",
        reach: pd.stats?.subscribers ?? null,
      });
    }
    return out.sort((a, b) => b.overall - a.overall);
  }, [campaignRows, campaignId]);

  const byStage = useMemo(() => {
    const m: Record<string, Row[]> = {};
    STAGES.forEach((s) => (m[s.key] = []));
    filtered.forEach((r) => {
      const k = (r.stage ?? "saved").toLowerCase();
      (m[k] ?? m.saved).push(r);
    });
    return m;
  }, [filtered]);

  const moveTo = async (rowId: string, stage: string) => {
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === rowId ? { ...r, stage } : r)));
    const { error } = await supabase.from("hotlist").update({ stage }).eq("id", rowId);
    if (error) {
      toast.error(error.message);
      setRows(prev);
    }
  };

  const rescore = async () => {
    if (!campaignId) return;
    setScoring(true);
    try {
      const res = await scoreCampaignCreators({ data: { campaignId } });
      toast.success(res.scored > 0 ? `Scored ${res.scored} creators` : "No creators to score in this campaign yet");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not score creators");
    } finally {
      setScoring(false);
    }
  };

  const p = status.data?.platform;
  const filterConnected = status.data
    ? filter === "All"
      ? true
      : filter === "YouTube"
        ? p!.youtube
        : filter === "Reddit"
          ? p!.reddit
          : filter === "X"
            ? p!.x
            : false
    : undefined;
  const connected = filtered.length > 0 ? true : filter === "All" ? true : filterConnected;

  return (
    <AppShell
      title="Hotlist CRM"
      right={<CampaignPicker value={campaignId} onChange={setCampaignId} />}
    >
      <p className="text-[#8892A4] mb-4">
        {campaignId ? "Creators for this campaign, scored and organized by stage" : "Your shortlisted creators, organized by stage"}
      </p>

      {/* Heat map + scoring, per campaign */}
      {campaignId ? (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#F0F4FF]">Fit & reach map</h2>
            <button
              onClick={rescore}
              disabled={scoring}
              className="px-3 h-9 rounded-lg bg-[#00D97E] text-[#05080F] text-xs font-bold disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              {scoring ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Score creators
            </button>
          </div>
          <AffiliateHeatMap creators={scored} />
        </div>
      ) : (
        <p className="text-xs text-[#8892A4] mb-4">
          Pick a campaign above to score its creators on product fit and see the heat map.
        </p>
      )}

      <div className="flex gap-1.5 mb-6 flex-wrap">
        {PLATFORM_FILTERS.map((pf) => (
          <button
            key={pf}
            onClick={() => setFilter(pf)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === pf ? "bg-[#00D97E] text-[#05080F]" : "bg-white/[0.05] text-[#8892A4] hover:text-white"
            }`}
          >
            {pf}
          </button>
        ))}
      </div>

      <DataGate
        connected={connected}
        loading={loading || status.isLoading}
        empty={filtered.length === 0}
        label="Creators load once this platform is connected"
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragging) moveTo(dragging, col.key);
                setDragging(null);
              }}
              className="bg-[#0C1222] rounded-xl p-4 min-w-[260px] w-[260px] shrink-0"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm">{col.label}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-[#8892A4]">
                    {byStage[col.key].length}
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                {byStage[col.key].map((c) => {
                  const pb = platBadge(c.platform);
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDragging(c.id)}
                      onDragEnd={() => setDragging(null)}
                      className="bg-[#131D2E] border border-white/[0.07] rounded-lg p-3.5 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2.5">
                        {c.avatar_url ? (
                          <img className="w-9 h-9 rounded-full bg-white/5 shrink-0" src={c.avatar_url} alt={c.creator_name} />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-white/5 shrink-0 flex items-center justify-center text-[10px] font-bold text-[#8892A4]">
                            {c.creator_name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5 text-[#4B5563]" />
                            <Link
                              to="/app/creators/$id"
                              params={{ id: c.external_id ?? slugify(c.creator_name) }}
                              className="font-bold text-sm truncate hover:text-[#00D97E] transition-colors"
                            >
                              {c.creator_name}
                            </Link>
                          </div>
                          {c.platform ? (
                            <span
                              className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: pb.bg, color: pb.color }}
                            >
                              {c.platform}
                            </span>
                          ) : null}
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {typeof c.score === "number" ? (
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(0,217,126,0.15)", color: "#00D97E" }}
                              >
                                {c.score}% fit
                              </span>
                            ) : null}
                            {c.cpm ? (
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}
                              >
                                CPM {c.cpm}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {STAGES.filter((s) => s.key !== (c.stage ?? "saved")).map((s) => (
                              <button
                                key={s.key}
                                onClick={() => moveTo(c.id, s.key)}
                                className="text-[10px] text-[#8892A4] hover:text-[#00D97E]"
                              >
                                → {s.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DataGate>
    </AppShell>
  );
}
