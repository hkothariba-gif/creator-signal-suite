import { createFileRoute, Link } from "@tanstack/react-router";
import type { SearchSchemaInput } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { AffiliateHeatMap, type HeatCreator } from "@/components/app/AffiliateHeatMap";
import { scoreCampaignCreators } from "@/lib/creators.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAspenCampaign } from "@/routes/app";
import type { Tables } from "@/integrations/supabase/types";

/* HOTLIST CRM — the `v.isHotlist` block of src/aspen/AspenApp.tsx, on the live
   hooks the dark version used. Shell, header and title come from the /app
   layout route. Campaign scope comes from the sidebar switcher; the `campaign`
   search param still overrides it.

   Drag-and-drop across the stage columns writes straight to Supabase, with the
   same optimistic update and rollback as before. The design's cards only carry
   `cursor-grab`, so the drag handlers are re-attached here.

   NOTE: <AffiliateHeatMap /> is the real scored-creator map and is still in its
   dark palette — it replaces the design's decorative SVG, which drew fixed
   circles. It needs an Aspen pass of its own; until then it sits in the card as
   a dark inset rather than showing invented data. */

export const Route = createFileRoute("/app/hotlist")({
  validateSearch: (search: { campaign?: string } & SearchSchemaInput) => ({
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
  { key: "live", label: "Live / posted" },
];

const PLATFORM_FILTERS = ["All", "YouTube", "Reddit", "X", "LinkedIn"];

// The design's platform glyph + brand colour, keyed off the stored platform.
const platMark = (p: string | null) => {
  const v = (p ?? "").toLowerCase();
  if (v === "youtube") return { glyph: "▶", color: "#F03" };
  if (v === "reddit") return { glyph: "r/", color: "#FF4500" };
  if (v === "linkedin") return { glyph: "in", color: "#0A66C2" };
  if (v === "x") return { glyph: "X", color: "#17141E" };
  return { glyph: "·", color: "#8A8494" };
};

function HotlistPage() {
  const { user } = useAuth();
  const { campaign: campaignParam } = Route.useSearch();
  const { selected } = useAspenCampaign();
  const status = useConnectorStatus();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [dragging, setDragging] = useState<string | null>(null);
  const [scoring, setScoring] = useState(false);

  const campaignId = campaignParam ?? selected?.id;

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
    <div className="aspen-scope">
      <div className="flex gap-[16px] flex-wrap mb-[20px]">
        <div className="flex-[1_1_420px] min-w-[300px] bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
          <div className="flex items-center justify-between gap-[12px] mb-[6px]">
            <h3 className="font-heading font-bold text-[17px] m-0">Fit &amp; reach map</h3>
            <button
              onClick={rescore}
              disabled={!campaignId || scoring}
              className="border-0 bg-accent text-cream text-[13px] font-bold p-[9px_15px] rounded-[11px] cursor-pointer ah35 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {scoring ? "Scoring…" : "Score creators"}
            </button>
          </div>
          <div className="text-[13px] text-subtle mb-[14px]">
            {campaignId
              ? "Scored on product fit against this campaign. The best-match zone is highlighted."
              : "Create a campaign and pick it in the sidebar to score its creators."}
          </div>
          {campaignId ? <AffiliateHeatMap creators={scored} /> : null}
        </div>
        <div className="flex-[1_1_240px] min-w-[240px] bg-dark text-cream rounded-[20px] p-[22px] flex flex-col justify-between">
          <div>
            <h3 className="font-heading font-bold text-[17px] m-0">
              {filtered.length} creator{filtered.length === 1 ? "" : "s"}, {STAGES.length} stages
            </h3>
            <p className="text-[13.5px] text-on-dark leading-[1.55] m-[10px_0_0]">
              Drag a card to move it. Every stage change logs against the campaign, so the outreach cascade never double-messages anyone.
            </p>
          </div>
          <div className="flex gap-[7px] flex-wrap mt-[20px]">
            {PLATFORM_FILTERS.map((label) => {
              const on = filter === label;
              return (
                <button
                  key={label}
                  onClick={() => setFilter(label)}
                  className="text-[12.5px] font-bold p-[8px_13px] rounded-[10px] cursor-pointer"
                  style={{
                    border: `1.5px solid ${on ? "#FAF7F1" : "#3A3546"}`,
                    background: on ? "#FAF7F1" : "transparent",
                    color: on ? "#17141E" : "#B8B2C2",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <DataGate
        connected={connected}
        loading={loading || status.isLoading}
        empty={filtered.length === 0}
        label="Creators load once this platform is connected"
      >
        <div className="flex gap-[14px] overflow-x-auto pb-[12px]">
          {STAGES.map((col) => (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragging) moveTo(dragging, col.key);
                setDragging(null);
              }}
              className="min-w-[262px] w-[262px] shrink-0 bg-sand-deep rounded-[18px] p-[14px]"
            >
              <div className="flex items-center gap-[8px] mb-[12px]">
                <span className="font-bold text-[14px]">{col.label}</span>
                <span className="text-[11px] font-bold text-subtle bg-surface p-[2px_8px] rounded-[7px]">{byStage[col.key].length}</span>
              </div>
              <div className="flex flex-col gap-[9px]">
                {byStage[col.key].map((c) => {
                  const mark = platMark(c.platform);
                  return (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDragging(c.id)}
                      onDragEnd={() => setDragging(null)}
                      className="bg-surface border-[1.5px] border-border rounded-[14px] p-[13px] cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex gap-[10px] items-center">
                        {c.avatar_url ? (
                          <img src={c.avatar_url} alt="" className="w-[30px] h-[30px] rounded-[9px] shrink-0 object-cover" />
                        ) : (
                          <div className="w-[30px] h-[30px] rounded-[9px] text-surface grid place-items-center font-extrabold text-[11px] shrink-0" style={{ background: mark.color }}>{mark.glyph}</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <Link to="/app/creators/$id" params={{ id: c.id }} className="text-[13.5px] font-bold leading-[1.3] block truncate">
                            {c.creator_name}
                          </Link>
                        </div>
                      </div>
                      <div className="flex gap-[6px] mt-[10px] flex-wrap">
                        {typeof c.score === "number" ? (
                          <span className="text-[10.5px] font-bold bg-tint text-accent-ink p-[3px_7px] rounded-[6px]">{c.score}% fit</span>
                        ) : null}
                        {c.cpm ? (
                          <span className="text-[10.5px] font-bold bg-sand text-muted p-[3px_7px] rounded-[6px]">{c.cpm}</span>
                        ) : null}
                      </div>
                      {/* Keyboard/no-drag fallback, as the dark version had. */}
                      <div className="flex gap-[8px] mt-[9px] flex-wrap">
                        {STAGES.filter((s) => s.key !== (c.stage ?? "saved")).map((s) => (
                          <button
                            key={s.key}
                            onClick={() => moveTo(c.id, s.key)}
                            className="border-0 bg-transparent p-0 text-[10.5px] font-semibold text-subtle cursor-pointer ah20"
                          >
                            → {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DataGate>
    </div>
  );
}
