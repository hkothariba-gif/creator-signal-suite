import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card } from "@/components/app/AppShell";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/app/campaigns/$id")({
  component: CampaignDetailPage,
});

type StoredCampaign = {
  id: string;
  name: string;
  product?: string;
  platform?: string;
  goal?: string;
  budget?: string;
  startDate?: string;
  endDate?: string;
  brief?: string;
  status?: string;
  createdAt?: number;
};

function CampaignDetailPage() {
  const { id } = useParams({ from: "/app/campaigns/$id" });
  const [campaign, setCampaign] = useState<StoredCampaign | null>(null);

  useEffect(() => {
    const stored: StoredCampaign[] = JSON.parse(localStorage.getItem("ar_campaigns") || "[]");
    const found = stored.find((c) => c.id === id);
    if (found) {
      setCampaign(found);
    } else {
      setCampaign({ id, name: id, status: "active" });
    }
  }, [id]);

  return (
    <AppShell
      title={campaign?.name || "Campaign"}
      right={
        <Link to="/app/campaigns" className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-white/10 hover:bg-white/5 text-sm text-[#8892A4] hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Campaigns
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Overview</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Status" value={campaign?.status || "—"} />
            <Info label="Platform" value={campaign?.platform || "—"} />
            <Info label="Goal" value={campaign?.goal || "—"} />
            <Info label="Budget" value={campaign?.budget ? `$${campaign.budget}` : "—"} />
            <Info label="Start Date" value={campaign?.startDate || "—"} />
            <Info label="End Date" value={campaign?.endDate || "—"} />
            <Info label="Product" value={campaign?.product || "—"} />
            <Info label="Campaign ID" value={id} />
          </div>
          {campaign?.brief && (
            <div className="mt-6 pt-6 border-t border-white/[0.07]">
              <div className="text-xs font-semibold text-[#8892A4] mb-2">Brief</div>
              <p className="text-sm text-[#F0F4FF] leading-relaxed">{campaign.brief}</p>
            </div>
          )}
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Performance</h3>
          <div className="space-y-4">
            <Metric label="Creators Contacted" value="0" />
            <Metric label="Response Rate" value="—" />
            <Metric label="Deals Closed" value="0" />
            <Metric label="Est. Reach" value="—" />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-[#8892A4] mb-1">{label}</div>
      <div className="text-[#F0F4FF] capitalize">{value}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-white/[0.07] last:border-0">
      <span className="text-sm text-[#8892A4]">{label}</span>
      <span className="text-sm font-bold text-[#F0F4FF]">{value}</span>
    </div>
  );
}
