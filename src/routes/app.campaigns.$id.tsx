import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Sparkles } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { findCreatorsForCampaign } from "@/lib/discover-creators.functions";

export const Route = createFileRoute("/app/campaigns/$id")({
  component: CampaignDetailPage,
});

type Campaign = Tables<"campaigns">;
type HotlistRow = Tables<"hotlist">;

const platColor = (p: string) =>
  p === "YouTube" ? "#FF0000" : p === "Reddit" ? "#FF4500" : p === "X" ? "#1A1A1A" : p === "LinkedIn" ? "#0A66C2" : "#7C3AED";

const statusStyle = (s: string) => {
  if (s === "active") return { color: "#00D97E", border: "#00D97E", bg: "rgba(0,217,126,0.12)", label: "Active" };
  if (s === "completed") return { color: "#0A66C2", border: "#0A66C2", bg: "rgba(10,102,194,0.15)", label: "Completed" };
  return { color: "#8892A4", border: "#8892A4", bg: "rgba(136,146,164,0.12)", label: "Draft" };
};

function CampaignDetailPage() {
  const { id } = useParams({ from: "/app/campaigns/$id" });
  const { user } = useAuth();
  const status = useConnectorStatus();
  const [finding, setFinding] = useState(false);

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

  const emailReady = status.data ? status.data.platform.email : undefined;

  const back = (
    <Link
      to="/app/campaigns"
      className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-white/10 hover:bg-white/5 text-sm text-[#8892A4] hover:text-white"
    >
      <ArrowLeft className="w-4 h-4" /> Campaigns
    </Link>
  );

  if (campaign.isLoading) {
    return (
      <AppShell title="" right={back}>
        <div className="text-sm text-[#8892A4] py-12 text-center">Loading…</div>
      </AppShell>
    );
  }

  const c = campaign.data;
  if (!c) {
    return (
      <AppShell title="" right={back}>
        <DataGate connected={true} empty>
          <></>
        </DataGate>
      </AppShell>
    );
  }

  const ss = statusStyle(c.status);

  return (
    <AppShell title="" right={back}>
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-3xl font-bold text-[#F0F4FF]">{c.name}</h1>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full border"
          style={{ color: ss.color, borderColor: ss.border, background: ss.bg }}
        >
          {ss.label}
        </span>
      </div>

      {/* Performance stats come from the email and tracking pipes */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Campaign Performance</h3>
        <DataGate
          connected={emailReady}
          empty
          loading={status.isLoading}
          label="Contact counts, reply rates, and spend load from your email connection"
        >
          <></>
        </DataGate>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Outreach */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Outreach Activity</h3>
          <DataGate
            connected={emailReady}
            empty
            loading={status.isLoading}
            label="Outreach activity loads from your email connection"
          >
            <></>
          </DataGate>
        </Card>

        {/* Details */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Campaign Details</h3>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs font-semibold text-[#8892A4] mb-1.5">Platforms</div>
              <div className="flex gap-1.5 flex-wrap">
                {(c.platforms ?? []).map((p) => (
                  <span
                    key={p}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: platColor(p) }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
            <Detail label="Goal" value={c.goal ?? "Not set"} />
            <Detail label="Budget" value={c.budget ?? "Not set"} />
            <Detail label="Start Date" value={c.start_date ?? "Not set"} />
            <Detail label="End Date" value={c.end_date ?? "Not set"} />
            <div>
              <div className="text-xs font-semibold text-[#8892A4] mb-1.5">Brief</div>
              <textarea
                readOnly
                value={c.brief ?? ""}
                rows={6}
                className="w-full p-3 rounded-lg bg-[#131D2E] border border-white/10 text-sm text-[#F0F4FF] resize-none"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Hotlist */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-lg font-bold text-[#F0F4FF]">Hotlist from this Campaign</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                setFinding(true);
                try {
                  const r = await findCreatorsForCampaign({ data: { campaignId: id } });
                  toast.success(`Added ${r.added} creator${r.added === 1 ? "" : "s"} (${r.skipped} already saved)`);
                  hotlist.refetch();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to find creators");
                } finally {
                  setFinding(false);
                }
              }}
              disabled={finding}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold hover:bg-[#00D97E]/90 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" /> {finding ? "Searching…" : "Find creators"}
            </button>
            <Link to="/app/hotlist" search={{ campaign: undefined }} className="text-sm text-[#00D97E] hover:underline">View all →</Link>
          </div>
        </div>
        <DataGate
          connected={true}
          loading={hotlist.isLoading}
          empty={(hotlist.data ?? []).length === 0}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(hotlist.data ?? []).map((h) => (
              <div
                key={h.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.07] bg-[#131D2E]"
              >
                {h.avatar_url ? (
                  <img src={h.avatar_url} alt="" className="w-10 h-10 rounded-full bg-white/5" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-[#8892A4]">
                    {h.creator_name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#F0F4FF] truncate">{h.creator_name}</div>
                  <div className="text-xs text-[#8892A4]">{h.platform ?? ""}</div>
                </div>
                {typeof h.score === "number" ? (
                  <div className="text-right">
                    <div className="text-xs text-[#8892A4]">Score</div>
                    <div className="text-sm font-bold text-[#00D97E]">{h.score}</div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </DataGate>
      </Card>
    </AppShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
      <span className="text-xs font-semibold text-[#8892A4]">{label}</span>
      <span className="text-sm text-[#F0F4FF]">{value}</span>
    </div>
  );
}
