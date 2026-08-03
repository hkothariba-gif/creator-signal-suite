import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

/* HOME — the `v.isHome` block of src/aspen/AspenApp.tsx, on the live hooks the
   dark version used. Shell, header and title come from the /app layout route.

   Every number here is real or gated: the two counts are Supabase head counts,
   brand fit is averaged from the scored hotlist rows, and the three panels that
   need an integration (outreach, activity, revenue) go through DataGate rather
   than showing a plausible-looking zero. The design's own sample figures are
   gone; only the quick-action copy is still a literal, because it is copy. */

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

function HomePage() {
  const { user } = useAuth();
  const status = useConnectorStatus();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const counts = useQuery({
    queryKey: ["home-counts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [c, h] = await Promise.all([
        supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
        supabase.from("hotlist").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      ]);
      return { campaigns: c.count ?? 0, hotlist: h.count ?? 0 };
    },
  });

  // The design shows a status line under each count ("2 active · 1 draft · 1
  // done", "9 added this week"), so the breakdown is fetched rather than faked.
  const campaignBreakdown = useQuery({
    queryKey: ["home-campaign-breakdown", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("campaigns").select("status").eq("user_id", user!.id);
      const rows = data ?? [];
      return {
        active: rows.filter((r) => r.status === "active").length,
        draft: rows.filter((r) => r.status === "draft").length,
        completed: rows.filter((r) => r.status === "completed").length,
      };
    },
  });

  const hotlist = useQuery({
    queryKey: ["home-hotlist", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("hotlist")
        .select("id,creator_name,platform,score,created_at")
        .eq("user_id", user!.id)
        .order("score", { ascending: false, nullsFirst: false });
      return data ?? [];
    },
  });

  const rows = hotlist.data ?? [];
  const topCreators = rows.filter((r) => r.score != null).slice(0, 4);
  const scored = rows.filter((r) => r.score != null);
  const avgFit = scored.length
    ? Math.round(scored.reduce((sum, r) => sum + (r.score ?? 0), 0) / scored.length)
    : null;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const addedThisWeek = rows.filter((r) => r.created_at && Date.parse(r.created_at) >= weekAgo).length;

  const firstName = (user?.email ?? "there").split("@")[0].split(/[._-]/)[0];
  const greeting = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const showSetup = user?.onboarded === false && !bannerDismissed;

  const emailReady = status.data ? status.data.platform.email : undefined;
  const perfReady = status.data ? status.data.platform.creatorPerformance : undefined;
  const salesReady = status.data ? status.data.account.sales : undefined;

  const dash = "—";

  return (
    <div className="aspen-scope flex flex-col gap-[20px]">
      {showSetup ? (
        <div className="flex items-center gap-[12px] bg-tint rounded-[16px] p-[14px_18px]">
          <span className="text-[14px] font-semibold text-accent-ink">
            {greeting}, finish setting up your account
          </span>
          <Link
            to="/onboarding"
            className="ml-[auto] border-0 bg-accent text-cream text-[13px] font-bold p-[9px_15px] rounded-[11px] cursor-pointer ah21"
          >
            Continue setup →
          </Link>
          <button
            onClick={() => setBannerDismissed(true)}
            className="border-0 bg-transparent text-accent-ink cursor-pointer ah20"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[16px]">
        <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px]">
          <div className="text-[12.5px] font-bold tracking-[0.1em] text-subtle">CAMPAIGNS</div>
          <div className="font-heading font-extrabold text-[38px] tracking-[-0.03em] leading-[1.1] mt-[8px]">{counts.data ? counts.data.campaigns : dash}</div>
          <div className="text-[13px] text-muted">
            {campaignBreakdown.data
              ? `${campaignBreakdown.data.active} active · ${campaignBreakdown.data.draft} draft · ${campaignBreakdown.data.completed} done`
              : "Loading"}
          </div>
        </div>
        <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px]">
          <div className="text-[12.5px] font-bold tracking-[0.1em] text-subtle">CREATORS IN HOTLIST</div>
          <div className="font-heading font-extrabold text-[38px] tracking-[-0.03em] leading-[1.1] mt-[8px]">{counts.data ? counts.data.hotlist : dash}</div>
          <div className="text-[13px] text-muted">{hotlist.data ? `${addedThisWeek} added this week` : "Loading"}</div>
        </div>
        <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px]">
          <div className="text-[12.5px] font-bold tracking-[0.1em] text-subtle">PENDING OUTREACH</div>
          {emailReady ? (
            <>
              <div className="font-heading font-extrabold text-[38px] tracking-[-0.03em] leading-[1.1] mt-[8px]">{dash}</div>
              <div className="text-[13px] text-muted">Counts arrive with the inbox sync</div>
            </>
          ) : (
            <DataGate connected={emailReady} empty loading={status.isLoading} label="Needs your email connection">
              <></>
            </DataGate>
          )}
        </div>
        <div className="bg-tint rounded-[20px] p-[20px]">
          <div className="text-[12.5px] font-bold tracking-[0.1em] text-accent-ink">AVG BRAND FIT</div>
          <div className="font-heading font-extrabold text-[38px] tracking-[-0.03em] leading-[1.1] mt-[8px] text-accent-ink">{avgFit ?? dash}</div>
          <div className="text-[13px] text-accent-ink-soft">
            {scored.length ? `Across ${scored.length} scored creators` : "No creators scored yet"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-[16px]">
        <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
          <div className="flex items-center justify-between mb-[16px]">
            <h3 className="font-heading font-bold text-[17px] m-0">Recent campaign activity</h3>
            <Link to="/app/outreach" className="border-0 bg-transparent text-[13px] font-bold text-accent cursor-pointer">Open inbox →</Link>
          </div>
          <DataGate connected={emailReady} empty loading={status.isLoading} label="Activity loads from your email connection">
            <></>
          </DataGate>
        </div>

        <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
          <h3 className="font-heading font-bold text-[17px] m-[0_0_18px]">Top creators by brand fit</h3>
          <DataGate
            connected={perfReady}
            loading={status.isLoading || hotlist.isLoading}
            empty={topCreators.length === 0}
            label="Scores load from the creator performance connection"
          >
            <div className="flex flex-col gap-[16px]">
              {topCreators.map((c) => (
                <div key={c.id}>
                  <div className="flex justify-between items-baseline gap-[12px] mb-[7px]">
                    <span className="text-[14px] font-bold">{c.creator_name}</span>
                    <span className="text-[12px] font-semibold text-subtle">{c.platform ?? ""}</span>
                  </div>
                  <div className="flex items-center gap-[11px]">
                    <div className="flex-1 h-[8px] rounded-full bg-sand">
                      <div className="h-[8px] rounded-full bg-accent" style={{ width: `${c.score ?? 0}%` }}></div>
                    </div>
                    <span className="text-[12.5px] font-bold text-accent">{c.score ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </DataGate>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[16px]">
        <div className="bg-dark text-cream rounded-[20px] p-[22px]">
          <div className="flex items-baseline justify-between gap-[12px]">
            <h3 className="font-heading font-bold text-[17px] m-0">Attributed revenue</h3>
            <span className="text-[12.5px] font-semibold text-on-dark">Last 30 days</span>
          </div>
          {salesReady ? (
            <div className="flex items-baseline gap-[12px] mt-[14px]">
              <span className="font-heading font-extrabold text-[42px] tracking-[-0.03em]">{dash}</span>
            </div>
          ) : (
            <div className="mt-[14px] text-[13.5px] text-on-dark leading-[1.55]">
              Waiting for API connection — revenue loads from your sales connection.
            </div>
          )}
        </div>
        <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[22px]">
          <h3 className="font-heading font-bold text-[17px] m-[0_0_4px]">Quick actions</h3>
          <div className="text-[13px] text-subtle mb-[16px]">Where teams usually pick up.</div>
          <div className="grid grid-cols-[1fr_1fr] gap-[10px]">
            <Link to="/app/discovery" search={{ campaign: undefined }} className="block text-left border-[1.5px] border-border bg-cream rounded-[14px] p-[14px] cursor-pointer ah22">
              <div className="font-bold text-[14.5px]">Find creators</div>
              <div className="text-[12.5px] text-subtle mt-[3px]">Search all four platforms</div>
            </Link>
            <Link to="/app/outreach" className="block text-left border-[1.5px] border-border bg-cream rounded-[14px] p-[14px] cursor-pointer ah23">
              <div className="font-bold text-[14.5px]">Send outreach</div>
              <div className="text-[12.5px] text-subtle mt-[3px]">Open the inbox</div>
            </Link>
            <Link to="/app/ads" search={{ campaign: undefined }} className="block text-left border-[1.5px] border-border bg-cream rounded-[14px] p-[14px] cursor-pointer ah24">
              <div className="font-bold text-[14.5px]">Build an ad</div>
              <div className="text-[12.5px] text-subtle mt-[3px]">From this week's signals</div>
            </Link>
            <Link to="/app/affiliate" className="block text-left border-[1.5px] border-border bg-cream rounded-[14px] p-[14px] cursor-pointer ah25">
              <div className="font-bold text-[14.5px]">View payouts</div>
              <div className="text-[12.5px] text-subtle mt-[3px]">Tracking links and revenue</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
