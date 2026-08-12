import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DataGate } from "@/components/app/DataGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { findCreatorsForCampaign, type SourceStatus } from "@/lib/discover-creators.functions";
import { useCampaignPerformance, formatMoney } from "@/hooks/useCampaignPerformance";
import { CampaignDocuments } from "@/components/app/CampaignDocuments";

/* CAMPAIGN DETAIL — new Aspen screen, per SCREENS-TO-PORT.md §5.

   Everything the dark version did is still here: the campaign and hotlist
   reads, the findCreatorsForCampaign discovery run with its per-source result
   table, and the coming-soon stubs for X and LinkedIn discovery. Added: ads and
   attribution for this campaign, plus pause/resume, duplicate and archive,
   which the spec's header and footer call for and the schema can back.

   Spend, return and per-creator revenue are real as of
   SPEC-spend-and-attribution.md: ad_daily carries per-ad daily spend,
   campaigns.budget_minor the numeric budget, and affiliate_links.hotlist_id
   attributes a tracking link to a creator. Every figure still degrades to an
   honest empty state — "Not recorded", "Needs spend", "No link yet" — rather
   than a zero that reads as real, and useCampaignPerformance returns null
   rather than 0 so this screen can tell those apart.

   Still genuinely absent: the brief's "Offer" row (no column), and any way to
   enter spend from the UI — ad_daily rows are written by hand until that
   affordance is designed. */

export const Route = createFileRoute("/app/campaigns/$id")({
  component: CampaignDetailPage,
});

type Campaign = Tables<"campaigns">;
type HotlistRow = Tables<"hotlist">;
type AdRow = Pick<
  Tables<"ads">,
  "id" | "name" | "headline" | "status" | "target_platform" | "created_at"
>;

type DiscoveryRun = {
  added: number;
  skipped: number;
  total: number;
  sources: SourceStatus[];
  ranAt: string;
};

const PLATFORMS: Record<string, { glyph: string; color: string }> = {
  youtube: { glyph: "▶", color: "#F03" },
  reddit: { glyph: "r/", color: "#FF4500" },
  x: { glyph: "X", color: "#17141E" },
  linkedin: { glyph: "in", color: "#0A66C2" },
};
const platMark = (p: string | null | undefined) =>
  PLATFORMS[(p ?? "").toLowerCase()] ?? { glyph: "·", color: "#8A8494" };

const STATUS_STYLE: Record<string, { bg: string; fg: string; label: string }> = {
  active: { bg: "#DDF3E6", fg: "#0E7A3D", label: "Active" },
  draft: { bg: "#F5F1E9", fg: "#8A8494", label: "Draft" },
  completed: { bg: "#E7EDFB", fg: "#3159A8", label: "Completed" },
};

const STAGE_PILL: Record<string, { bg: string; fg: string }> = {
  live: { bg: "#DDF3E6", fg: "#0E7A3D" },
  contracted: { bg: "#FFECD9", fg: "#B33A12" },
};

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : null;

const CARD = "bg-surface border-[1.5px] border-border rounded-[20px]";
const OUTLINE_BTN =
  "border-[1.5px] border-border bg-transparent text-[13.5px] font-bold rounded-[11px] px-[15px] h-[38px] cursor-pointer transition-colors hover:border-dark disabled:opacity-40 disabled:cursor-not-allowed";

function CampaignDetailPage() {
  const { id } = useParams({ from: "/app/campaigns/$id" });
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = user?.organization?.id;
  const [finding, setFinding] = useState(false);
  const [lastRun, setLastRun] = useState<DiscoveryRun | null>(null);
  const [busy, setBusy] = useState<"pause" | "duplicate" | "archive" | null>(null);

  const campaign = useQuery({
    queryKey: ["campaign", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user!.id)
        .eq("id", id)
        .maybeSingle();
      return (data ?? null) as Campaign | null;
    },
  });

  const hotlist = useQuery({
    queryKey: ["campaign-hotlist", id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("hotlist")
        .select("*")
        .eq("user_id", user!.id)
        .eq("campaign_id", id)
        .order("created_at", { ascending: false });
      return (data ?? []) as HotlistRow[];
    },
  });

  const ads = useQuery({
    queryKey: ["campaign-ads", id, orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ads")
        .select("id,name,headline,status,target_platform,created_at")
        .eq("organization_id", orgId!)
        .eq("campaign_id", id)
        .order("updated_at", { ascending: false });
      return (data ?? []) as AdRow[];
    },
  });

  /* Every derived number for this campaign — budget, spend, revenue, ROAS, the
     per-ad and per-creator breakdowns and the daily series — comes from one
     hook so the guard rails around absent data and mixed currencies live in a
     single place. See src/hooks/useCampaignPerformance.ts. */
  const perf = useCampaignPerformance(id, orgId);

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    queryClient.invalidateQueries({ queryKey: ["shell-campaigns"] });
  };

  const setStatus = async (status: string, label: string) => {
    const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(label);
    refetchAll();
  };

  const duplicate = async () => {
    const c = campaign.data;
    if (!c || !user) return;
    setBusy("duplicate");
    const { data: copy, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name: `${c.name} (copy)`,
        product_description: c.product_description,
        platforms: c.platforms,
        goal: c.goal,
        budget: c.budget,
        budget_minor: c.budget_minor,
        currency: c.currency,
        brief: c.brief,
        target_audience: c.target_audience,
        never_say: c.never_say,
        proof_points: c.proof_points,
        brand_beliefs: c.brand_beliefs,
        search_criteria: c.search_criteria,
        status: "draft",
      })
      .select("id")
      .single();
    setBusy(null);
    if (error || !copy) {
      toast.error(error?.message ?? "Could not duplicate campaign");
      return;
    }
    toast.success("Campaign duplicated as a draft");
    queryClient.invalidateQueries({ queryKey: ["shell-campaigns"] });
  };

  const runDiscovery = async () => {
    setFinding(true);
    try {
      const r = (await findCreatorsForCampaign({ data: { campaignId: id } })) as DiscoveryRun;
      setLastRun(r);
      toast.success(
        `Added ${r.added} creator${r.added === 1 ? "" : "s"} (${r.skipped} already saved)`,
      );
      hotlist.refetch();
    } catch (e) {
      setLastRun({
        added: 0,
        skipped: 0,
        total: 0,
        sources: [
          {
            source: "discovery",
            ok: false,
            count: 0,
            reason: e instanceof Error ? e.message : "unknown error",
          },
        ],
        ranAt: new Date().toISOString(),
      });
      toast.error(e instanceof Error ? e.message : "Failed to find creators");
    } finally {
      setFinding(false);
    }
  };

  const back = (
    <Link
      to="/app/campaigns"
      search={{ new: undefined }}
      className="self-start border-0 bg-transparent text-[13.5px] font-bold text-subtle cursor-pointer p-0 transition-colors hover:text-accent"
    >
      ← All campaigns
    </Link>
  );

  if (campaign.isLoading) {
    return (
      <div className="aspen-scope flex flex-col gap-[16px] max-w-[1080px]">
        {back}
        <div className="text-[14px] text-subtle p-[48px_0] text-center">Loading…</div>
      </div>
    );
  }

  const c = campaign.data;
  if (!c) {
    return (
      <div className="aspen-scope flex flex-col gap-[16px] max-w-[1080px]">
        {back}
        <DataGate connected={true} empty>
          <></>
        </DataGate>
      </div>
    );
  }

  const ss = STATUS_STYLE[c.status] ?? { bg: "#F5F1E9", fg: "#8A8494", label: c.status };
  const rows = hotlist.data ?? [];
  const stageOf = (r: HotlistRow) => (r.stage ?? "saved").toLowerCase();
  // The board has a "negotiating" stage the funnel does not; those creators
  // have been contacted, so they are counted there rather than dropped.
  const funnel = [
    { label: "Discovered", n: rows.length, note: "on this campaign" },
    {
      label: "Shortlisted",
      n: rows.filter((r) => stageOf(r) === "saved").length,
      note: "not yet contacted",
    },
    {
      label: "Contacted",
      n: rows.filter((r) => ["contacted", "negotiating"].includes(stageOf(r))).length,
      note: "includes negotiating",
    },
    {
      label: "Contracted",
      n: rows.filter((r) => stageOf(r) === "contracted").length,
      note: "deal agreed",
    },
    { label: "Live", n: rows.filter((r) => stageOf(r) === "live").length, note: "posted" },
  ];

  const from = fmtDate(c.start_date);
  const to = fmtDate(c.end_date);
  const dateRange =
    from && to ? `${from} – ${to}` : from ? `From ${from}` : to ? `Until ${to}` : "No dates set";

  const p = perf.data;
  const adRows = ads.data ?? [];

  // Legacy free-text budget is display-only, and only when the numeric column
  // has nothing. Once budget_minor is set it is the single source of truth.
  const budgetText =
    p?.budget.minor != null
      ? formatMoney(p.budget.minor, p.budget.currency ?? "USD")
      : (c.budget ?? null);
  const spendText =
    p?.spend.minor != null ? formatMoney(p.spend.minor, p.spend.currency ?? "USD") : null;
  const over = (p?.budgetUsed ?? 0) > 1;

  /* The daily series bucketed into the design's twelve weekly columns. Null
     when nothing at all was recorded, so the panel can say so instead of
     drawing twelve empty bars. */
  const chart = (() => {
    if (!p || p.series.length === 0) return null;
    const now = Date.now();
    const buckets = Array.from({ length: 12 }, () => ({ spendMinor: 0, revenueMinor: 0 }));
    for (const row of p.series) {
      const weeksAgo = Math.floor((now - Date.parse(row.day)) / (7 * 24 * 3600 * 1000));
      if (weeksAgo < 0 || weeksAgo >= 12) continue;
      const b = buckets[11 - weeksAgo];
      b.spendMinor += row.spendMinor ?? 0;
      b.revenueMinor += row.revenueMinor ?? 0;
    }
    const hasSpend = buckets.some((b) => b.spendMinor > 0);
    const hasRevenue = buckets.some((b) => b.revenueMinor > 0);
    if (!hasSpend && !hasRevenue) return null;
    const max = Math.max(...buckets.map((b) => Math.max(b.spendMinor, b.revenueMinor)));
    return { buckets, hasSpend, hasRevenue, max };
  })();

  return (
    <div className="aspen-scope flex flex-col gap-[16px] max-w-[1080px]">
      {back}

      {/* ── Header card ── */}
      <div className={`${CARD} p-[26px]`}>
        <div className="flex gap-[24px] items-start justify-between flex-wrap">
          <div className="min-w-0">
            <span
              className="inline-block text-[12px] font-bold p-[6px_12px] rounded-[8px]"
              style={{ background: ss.bg, color: ss.fg }}
            >
              {ss.label}
            </span>
            <div className="flex gap-[6px] mt-[10px] flex-wrap">
              {(c.platforms ?? []).map((p) => (
                <span
                  key={p}
                  className="text-[11px] font-bold text-surface p-[4px_9px] rounded-[7px]"
                  style={{ background: platMark(p).color }}
                >
                  {p}
                </span>
              ))}
            </div>
            <div className="text-[14.5px] text-muted mt-[12px] leading-[1.5]">
              {c.product_description || "No product description"}
              {c.goal ? (
                <>
                  {" · goal is "}
                  <strong className="text-dark">{c.goal}</strong>
                </>
              ) : null}
            </div>
          </div>

          <div className="flex gap-[10px] flex-wrap shrink-0">
            <button
              onClick={runDiscovery}
              disabled={finding}
              className="border-0 bg-accent text-cream text-[13.5px] font-bold rounded-[11px] px-[16px] h-[38px] cursor-pointer transition-colors hover:bg-dark disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {finding ? "Searching…" : "Add creators"}
            </button>
            <button
              onClick={() =>
                c.status === "active"
                  ? setStatus("draft", "Campaign paused")
                  : setStatus("active", "Campaign resumed")
              }
              disabled={busy !== null}
              className={OUTLINE_BTN}
            >
              {c.status === "active" ? "Pause" : "Resume"}
            </button>
            <button onClick={duplicate} disabled={busy !== null} className={OUTLINE_BTN}>
              {busy === "duplicate" ? "Duplicating…" : "Duplicate"}
            </button>
          </div>
        </div>

        {/* Footer strip, per spec §4. Four states, and the track is only drawn
            when there is a budget to fill against — an empty bar with nothing
            behind it reads as "0% spent" rather than "not known". */}
        <div className="flex items-center gap-[16px] mt-[22px] pt-[18px] border-t-[1.5px] border-border flex-wrap">
          <div className="flex-1 min-w-[240px]">
            {spendText && budgetText ? (
              <>
                <div className="text-[13px]" style={{ color: over ? "#F2542D" : "#4A4553" }}>
                  <strong className={over ? "" : "text-dark"}>{spendText}</strong> of{" "}
                  <strong className={over ? "" : "text-dark"}>{budgetText}</strong> spent
                </div>
                <div className="h-[10px] rounded-full bg-sand mt-[8px] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.min(100, (p!.budgetUsed ?? 0) * 100)}%` }}
                  />
                </div>
              </>
            ) : budgetText ? (
              <>
                <div className="text-[13px] text-muted">
                  No spend recorded · budget <strong className="text-dark">{budgetText}</strong>
                </div>
                <div className="h-[10px] rounded-full bg-sand mt-[8px]" />
              </>
            ) : spendText ? (
              <div className="text-[13px] text-muted">
                <strong className="text-dark">{spendText}</strong> spent · no budget set
              </div>
            ) : (
              <div className="text-[13px] text-muted">No budget set · no spend recorded</div>
            )}
          </div>
          <div className="text-[13px] text-subtle">{dateRange}</div>
        </div>
      </div>

      {/* ── Funnel ── */}
      <div className={`${CARD} p-[22px] flex gap-[16px] flex-wrap`}>
        {funnel.map((s, i) => (
          <div key={s.label} className="flex-1 min-w-[140px]">
            <div
              className="font-heading font-extrabold text-[30px] tracking-[-0.03em] leading-[1.1]"
              style={{ color: i >= 3 ? "#F2542D" : "#17141E" }}
            >
              {hotlist.isLoading ? "—" : s.n}
            </div>
            <div className="text-[13.5px] font-bold mt-[4px]">{s.label}</div>
            <div className="text-[12px] text-subtle mt-[2px]">{s.note}</div>
          </div>
        ))}
      </div>

      {lastRun ? <DiscoveryRunPanel run={lastRun} onDismiss={() => setLastRun(null)} /> : null}

      {/* ── Creators + Ads ── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(380px,1fr))] gap-[16px]">
        <div className={`${CARD} p-[22px]`}>
          <div className="flex items-center justify-between gap-[12px] mb-[6px] flex-wrap">
            <h3 className="font-heading font-bold text-[16.5px] m-0">Creators on this campaign</h3>
            <Link
              to="/app/hotlist"
              search={{ campaign: id }}
              className="border-0 bg-transparent text-[13px] font-bold text-accent cursor-pointer"
            >
              Open hotlist →
            </Link>
          </div>
          {/* Kept from the dark version: the other two sources are not built yet. */}
          <div className="flex gap-[7px] mb-[14px]">
            <button
              onClick={() => toast.info("X (Twitter) discovery is coming soon")}
              className="border-[1.5px] border-border bg-transparent text-[11.5px] font-bold text-subtle rounded-[8px] px-[10px] h-[26px] cursor-pointer transition-colors hover:border-dark hover:text-dark"
            >
              X
            </button>
            <button
              onClick={() => toast.info("LinkedIn discovery is coming soon")}
              className="border-[1.5px] border-border bg-transparent text-[11.5px] font-bold text-subtle rounded-[8px] px-[10px] h-[26px] cursor-pointer transition-colors hover:border-dark hover:text-dark"
            >
              LinkedIn
            </button>
          </div>

          <DataGate connected={true} loading={hotlist.isLoading} empty={rows.length === 0}>
            <div className="flex flex-col gap-[9px]">
              {rows.map((h) => {
                const mark = platMark(h.platform);
                const pill = STAGE_PILL[stageOf(h)] ?? { bg: "#F5F1E9", fg: "#8A8494" };
                const creatorStat = p?.perCreator[h.id];
                return (
                  <Link
                    key={h.id}
                    to="/app/creators/$id"
                    params={{ id: h.id }}
                    className="flex items-center gap-[11px] bg-cream rounded-[14px] p-[12px_14px]"
                  >
                    {h.avatar_url ? (
                      <img
                        src={h.avatar_url}
                        alt=""
                        className="w-[32px] h-[32px] rounded-[10px] shrink-0 object-cover"
                      />
                    ) : (
                      <div
                        className="w-[32px] h-[32px] rounded-[10px] text-surface grid place-items-center font-extrabold text-[11px] shrink-0"
                        style={{ background: mark.color }}
                      >
                        {mark.glyph}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-bold truncate">{h.creator_name}</div>
                      {/* Clicks and revenue arrive through affiliate_links.hotlist_id.
                          A creator with no link attributed to them says so rather
                          than showing two zeros. */}
                      <div className="text-[12px] text-subtle mt-[2px]">
                        {creatorStat ? (
                          <>
                            {h.cpm ? `${h.cpm} · ` : ""}
                            {creatorStat.clicks.toLocaleString()} click
                            {creatorStat.clicks === 1 ? "" : "s"}
                          </>
                        ) : h.cpm ? (
                          `${h.cpm} · No link yet`
                        ) : (
                          "No link yet"
                        )}
                      </div>
                    </div>
                    {creatorStat ? (
                      <span className="w-[62px] shrink-0 text-right text-[13px] font-bold">
                        {formatMoney(creatorStat.revenueMinor, p?.revenue.currency ?? "USD")}
                      </span>
                    ) : null}
                    <span
                      className="text-[11px] font-bold p-[4px_9px] rounded-[7px] shrink-0 capitalize"
                      style={{ background: pill.bg, color: pill.fg }}
                    >
                      {stageOf(h)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </DataGate>
        </div>

        <div className={`${CARD} p-[22px]`}>
          <div className="flex items-center justify-between gap-[12px] mb-[14px] flex-wrap">
            <h3 className="font-heading font-bold text-[16.5px] m-0">Ads running</h3>
            <Link
              to="/app/ads"
              search={{ campaign: id }}
              className="border-0 bg-transparent text-[13px] font-bold text-accent cursor-pointer"
            >
              Ads Center →
            </Link>
          </div>
          <DataGate
            connected={!!orgId}
            loading={ads.isLoading}
            empty={adRows.length === 0}
            label="Ads are built in the Ads Center against this campaign"
          >
            <div className="flex flex-col gap-[9px]">
              {adRows.map((a) => {
                const mark = platMark(a.target_platform);
                const live = a.status === "saved" || a.status === "live";
                const adStat = p?.perAd[a.id];
                return (
                  <div key={a.id} className="bg-cream rounded-[14px] p-[13px_15px]">
                    <div className="flex items-center gap-[9px]">
                      <span
                        className="w-[10px] h-[10px] rounded-full shrink-0"
                        style={{ background: mark.color }}
                      />
                      <span className="text-[12.5px] font-semibold text-muted capitalize">
                        {a.target_platform ?? "No platform"}
                      </span>
                      <span
                        className="ml-[auto] text-[12px] font-bold capitalize"
                        style={{ color: live ? "#0E7A3D" : "#8A8494" }}
                      >
                        {a.status}
                      </span>
                    </div>
                    <div className="text-[14.5px] font-semibold mt-[8px] leading-[1.45]">
                      “{a.headline || a.name}”
                    </div>
                    {/* No ad_daily rows for this ad → omit the line entirely
                        rather than print zeros. The ad's own currency, not the
                        campaign's: the campaign total goes null once two
                        currencies meet, and this ad's figure is still good. */}
                    <div className="text-[12px] text-subtle mt-[6px]">
                      {adStat?.spendMinor != null && adStat.currency
                        ? [
                            `${formatMoney(adStat.spendMinor, adStat.currency)} spent`,
                            adStat.cpaMinor != null
                              ? `${formatMoney(adStat.cpaMinor, adStat.currency)} per conversion`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </DataGate>
        </div>
      </div>

      {/* Uploads were write-only until now: nothing showed what the campaign
          holds or whether extraction succeeded. */}
      <CampaignDocuments
        campaignId={id}
        sheetName={
          (c.target_audience as { lookalike_sheet_name?: string | null } | null)
            ?.lookalike_sheet_name ?? null
        }
      />



      {/* ── Proof band ── */}
      <div className="bg-dark text-cream rounded-[22px] p-[26px] flex gap-[26px] items-center flex-wrap">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[20px] flex-1 min-w-[300px]">
          <ProofStat
            label="Attributed revenue"
            value={
              p?.revenue.minor != null
                ? formatMoney(p.revenue.minor, p.revenue.currency ?? "USD")
                : perf.isLoading
                  ? "…"
                  : p && p.revenue.currencyCount > 1
                    ? `${p.revenue.currencyCount} currencies`
                    : "Not recorded"
            }
            small={p?.revenue.minor == null}
          />
          <ProofStat
            label="Spend"
            value={
              p?.spend.minor != null
                ? formatMoney(p.spend.minor, p.spend.currency ?? "USD")
                : perf.isLoading
                  ? "…"
                  : p && p.spend.currencyCount > 1
                    ? `${p.spend.currencyCount} currencies`
                    : "Not recorded"
            }
            small={p?.spend.minor == null}
            note={
              p && p.adsWithSpend > 0
                ? `across ${p.adsWithSpend} ad${p.adsWithSpend === 1 ? "" : "s"}`
                : undefined
            }
          />
          <ProofStat
            label="Return"
            value={p?.roas != null ? `${p.roas.toFixed(1)}x` : "Needs spend"}
            small={p?.roas == null}
            note={
              p?.roas != null && p.revenue.minor != null && p.spend.minor != null
                ? `${formatMoney(p.revenue.minor, p.revenue.currency ?? "USD")} from ${formatMoney(p.spend.minor, p.spend.currency ?? "USD")}`
                : undefined
            }
          />
          <ProofStat
            label="Conversions"
            value={
              p?.conversions != null
                ? p.conversions.toLocaleString()
                : perf.isLoading
                  ? "…"
                  : "Not recorded"
            }
            small={p?.conversions == null}
          />
        </div>
        <div className="flex-1 min-w-[280px]">
          {chart ? (
            <>
              <div className="relative flex items-end gap-[5px] h-[96px]">
                {/* Revenue is the filled series; spend rides the same axis as a
                    line so the two are comparable at a glance. */}
                {chart.buckets.map((b, i) => {
                  const h = chart.max > 0 ? Math.max(4, (b.revenueMinor / chart.max) * 100) : 4;
                  return (
                    <div
                      key={i}
                      className="flex-1 rounded-[5px_5px_0_0]"
                      style={{
                        height: `${h}%`,
                        background: i >= 9 ? "#F2542D" : i >= 5 ? "#FFD84D" : "#3A3546",
                      }}
                    />
                  );
                })}
                {chart.hasSpend ? (
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    <polyline
                      points={chart.buckets
                        .map((b, i) => {
                          const x = (i / (chart.buckets.length - 1 || 1)) * 100;
                          const y = 100 - (chart.max > 0 ? (b.spendMinor / chart.max) * 100 : 0);
                          return `${x},${y}`;
                        })
                        .join(" ")}
                      fill="none"
                      stroke="#8A8494"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                ) : null}
              </div>
              <div className="flex items-center gap-[14px] mt-[10px] flex-wrap">
                <div className="text-[12.5px] text-subtle">Last 12 weeks</div>
                {/* Legend only when both series carry data. */}
                {chart.hasSpend && chart.hasRevenue ? (
                  <div className="flex items-center gap-[12px] text-[12px] text-subtle">
                    <span className="inline-flex items-center gap-[5px]">
                      <span className="w-[10px] h-[10px] rounded-[3px] bg-accent" /> Revenue
                    </span>
                    <span className="inline-flex items-center gap-[5px]">
                      <span className="w-[12px] h-[2px] bg-subtle" /> Spend
                    </span>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <div className="text-[13px] text-on-dark leading-[1.55]">
              {perf.isLoading
                ? "Loading…"
                : "Nothing recorded for this campaign yet — attributed revenue needs a tracking link, spend needs ad_daily rows."}
            </div>
          )}
        </div>
      </div>

      {/* ── Brief ── */}
      <div className={`${CARD} p-[22px]`}>
        <div className="flex items-center justify-between gap-[12px] mb-[6px] flex-wrap">
          <h3 className="font-heading font-bold text-[16.5px] m-0">Brief</h3>
          <Link
            to="/app/campaigns"
            search={{ new: undefined }}
            className="border-[1.5px] border-border bg-transparent text-[12.5px] font-bold rounded-[9px] px-[13px] py-[7px] cursor-pointer transition-colors hover:border-dark"
          >
            Edit brief
          </Link>
        </div>
        <div className="flex flex-col">
          <BriefRow label="Product" value={c.product_description} />
          <BriefRow label="Audience" value={audienceText(c.target_audience)} />
          {/* No offer column on campaigns — the brief has product, audience,
              never_say and free text, but nothing that means "the offer". */}
          <BriefRow label="Offer" value={null} missing="No offer field on campaigns yet" />
          <BriefRow label="Avoid" value={c.never_say} />
        </div>
        {c.brief ? (
          <p className="text-[14px] text-muted leading-[1.6] m-[16px_0_0] pt-[14px] border-t-[1px] border-border-soft whitespace-pre-wrap">
            {c.brief}
          </p>
        ) : null}
      </div>

      <button
        onClick={() => setStatus("completed", "Campaign archived")}
        disabled={busy !== null || c.status === "completed"}
        className="self-start border-0 bg-transparent text-[13px] font-bold text-subtle cursor-pointer p-0 transition-colors hover:text-accent disabled:opacity-40"
      >
        Archive this campaign
      </button>
    </div>
  );
}

function ProofStat({
  label,
  value,
  small,
  note,
}: {
  label: string;
  value: string;
  small?: boolean;
  note?: string;
}) {
  return (
    <div>
      <div
        className={`font-heading font-extrabold tracking-[-0.02em] text-highlight ${
          small ? "text-[16px]" : "text-[25px]"
        }`}
      >
        {value}
      </div>
      <div className="text-[12.5px] text-subtle mt-[4px]">{label}</div>
      {note ? <div className="text-[11.5px] text-[#6E687A] mt-[2px]">{note}</div> : null}
    </div>
  );
}

function BriefRow({
  label,
  value,
  missing = "Not set",
}: {
  label: string;
  value: string | null;
  missing?: string;
}) {
  return (
    <div className="flex gap-[14px] items-baseline p-[12px_0] border-t-[1px] border-[#F0EBE1]">
      <div className="w-[92px] shrink-0 text-[12.5px] font-bold uppercase tracking-[0.06em] text-subtle">
        {label}
      </div>
      <div
        className={`flex-1 min-w-0 text-[14.5px] leading-[1.5] ${value ? "text-dark" : "text-subtle"}`}
      >
        {value || missing}
      </div>
    </div>
  );
}

// target_audience is a json column: a plain string on older rows, an object on
// newer ones. Render whichever it is without guessing at fields.
function audienceText(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    const vals = Object.values(v as Record<string, unknown>).filter(
      (x) => typeof x === "string" && x.trim(),
    );
    return vals.length ? vals.join(" · ") : null;
  }
  return null;
}

/* The discovery run's per-source result table, kept from the dark version — it
   is the only place that reports why a source returned nothing. */
function DiscoveryRunPanel({ run, onDismiss }: { run: DiscoveryRun; onDismiss: () => void }) {
  return (
    <div className={`${CARD} p-[20px_22px]`}>
      <div className="flex items-center justify-between gap-[12px] mb-[12px] flex-wrap">
        <div className="text-[14px] font-bold">
          Last discovery run
          <span className="ml-[8px] text-[12.5px] font-normal text-subtle">
            {new Date(run.ranAt).toLocaleString()} · {run.total} candidate
            {run.total === 1 ? "" : "s"} · {run.added} added · {run.skipped} already saved
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="border-0 bg-transparent text-[12.5px] font-bold text-subtle cursor-pointer transition-colors hover:text-accent"
        >
          Dismiss
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="text-left text-subtle">
              <th className="font-bold py-[6px] pr-[12px]">SOURCE</th>
              <th className="font-bold py-[6px] pr-[12px]">STATUS</th>
              <th className="font-bold py-[6px] pr-[12px]">COUNT</th>
              <th className="font-bold py-[6px]">REASON</th>
            </tr>
          </thead>
          <tbody>
            {run.sources.map((s, i) => (
              <tr key={`${s.source}-${i}`} className="border-t-[1px] border-border-soft">
                <td className="py-[7px] pr-[12px] font-semibold">{s.source}</td>
                <td className="py-[7px] pr-[12px]">
                  <span
                    className="text-[11px] font-bold p-[3px_8px] rounded-[6px]"
                    style={
                      s.ok
                        ? { background: "#DDF3E6", color: "#0E7A3D" }
                        : { background: "#FFECD9", color: "#B33A12" }
                    }
                  >
                    {s.ok ? "OK" : "FAIL"}
                  </span>
                </td>
                <td className="py-[7px] pr-[12px] tabular-nums">{s.count}</td>
                <td className="py-[7px] text-subtle">{s.reason ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
