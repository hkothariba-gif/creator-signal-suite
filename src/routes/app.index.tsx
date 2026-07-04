import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell, Card, StatCard } from "@/components/app/AppShell";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Search, Mail, DollarSign, X } from "lucide-react";

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

  const topCreators = useQuery({
    queryKey: ["home-top-creators", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("hotlist")
        .select("id,creator_name,platform,score")
        .eq("user_id", user!.id)
        .not("score", "is", null)
        .order("score", { ascending: false })
        .limit(3);
      return data ?? [];
    },
  });

  const firstName = (user?.email ?? "there").split("@")[0].split(/[._-]/)[0];
  const greeting = firstName.charAt(0).toUpperCase() + firstName.slice(1);
  const showSetup = user?.onboarded === false && !bannerDismissed;

  const emailReady = status.data ? status.data.platform.email : undefined;
  const perfReady = status.data ? status.data.platform.creatorPerformance : undefined;
  const salesReady = status.data ? status.data.account.sales : undefined;

  return (
    <AppShell title="Home">
      {showSetup && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-[#00D97E]/30 bg-[#00D97E]/10 text-sm">
          <span className="text-[#F0F4FF]">Finish setting up your account</span>
          <Link
            to="/onboarding"
            className="ml-auto px-3 h-8 inline-flex items-center rounded-lg bg-[#00D97E] text-[#05080F] font-bold text-xs hover:bg-[#00c472]"
          >
            Continue Setup →
          </Link>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-[#8892A4] hover:text-white"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold">Good morning, {greeting}</h2>
        <p className="text-[#8892A4] mt-1">Here is what is happening across your campaigns</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Campaigns" value={counts.data ? String(counts.data.campaigns) : "…"} />
        <StatCard label="Creators in Hotlist" value={counts.data ? String(counts.data.hotlist) : "…"} />
        <DataGate connected={emailReady} empty loading={status.isLoading} label="Pending outreach">
          <></>
        </DataGate>
        <DataGate connected={perfReady} empty loading={status.isLoading} label="Brand fit score">
          <></>
        </DataGate>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <Card className="lg:col-span-3 p-6">
          <h3 className="font-semibold mb-4">Recent Campaign Activity</h3>
          <DataGate connected={emailReady} empty loading={status.isLoading} label="Activity loads from your email connection">
            <></>
          </DataGate>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Top Creators by Brand Fit</h3>
          <DataGate
            connected={perfReady}
            loading={status.isLoading || topCreators.isLoading}
            empty={(topCreators.data ?? []).length === 0}
            label="Scores load from the creator performance connection"
          >
            <ul className="space-y-4">
              {(topCreators.data ?? []).map((c) => (
                <li key={c.id}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold">{c.creator_name}</span>
                    <span className="text-xs text-[#8892A4]">{c.platform ?? ""}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#00D97E]" style={{ width: `${c.score ?? 0}%` }} />
                    </div>
                    <span className="text-xs font-bold text-[#00D97E]">{c.score ?? 0}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </DataGate>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Views and Clicks</h3>
          <DataGate connected={perfReady} empty loading={status.isLoading} label="Metrics load from the creator performance connection">
            <></>
          </DataGate>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Revenue</h3>
          <DataGate connected={salesReady} empty loading={status.isLoading} label="Revenue loads from your sales connection">
            <></>
          </DataGate>
        </Card>
      </div>

      <h3 className="font-semibold mt-4 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction to="/app/campaigns" icon={<Plus className="w-5 h-5" />} label="New Campaign" />
        <QuickAction to="/app/discovery" icon={<Search className="w-5 h-5" />} label="Search Creators" />
        <QuickAction to="/app/outreach" icon={<Mail className="w-5 h-5" />} label="Send Outreach" />
        <QuickAction to="/app/affiliate" icon={<DollarSign className="w-5 h-5" />} label="View Payouts" />
      </div>
    </AppShell>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="bg-[#0C1222] border border-white/[0.07] rounded-xl p-5 flex flex-col items-center text-center hover:border-[#00D97E]/30 hover:shadow-[0_0_20px_rgba(0,217,126,0.05)] transition-all"
    >
      <span className="w-10 h-10 rounded-full bg-[#00D97E]/15 text-[#00D97E] flex items-center justify-center mb-3">{icon}</span>
      <span className="font-semibold text-sm">{label}</span>
    </Link>
  );
}
