import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell, Card } from "@/components/app/AppShell";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/app/campaigns/$id")({
  component: CampaignDetailPage,
});

type Status = "Active" | "Draft" | "Completed";
type OutreachStatus = "Contacted" | "Replied" | "Negotiating" | "Contracted";

type CampaignMock = {
  id: string;
  name: string;
  status: Status;
  platforms: string[];
  goal: string;
  budget: string;
  startDate: string;
  endDate: string;
  brief: string;
  stats: { contacted: number; replyRate: string; emailsSent: number; spend: string };
  outreach: { id: string; name: string; platform: string; status: OutreachStatus; date: string }[];
  hotlist: { name: string; platform: string; followers: string; score: number }[];
};

const MOCK: Record<string, CampaignMock> = {
  camp_001: {
    id: "camp_001",
    name: "Summer Tech Drop",
    status: "Active",
    platforms: ["YouTube", "Reddit"],
    goal: "Affiliate Sales",
    budget: "$8,400",
    startDate: "Jun 15, 2026",
    endDate: "Aug 30, 2026",
    brief:
      "Push our new summer tech accessories bundle to mid-tier tech reviewers. Focus on unboxing content and honest reviews. Target 5-7% affiliate commission structure. Priority on YouTube long-form and Reddit r/gadgets threads.",
    stats: { contacted: 20, replyRate: "42%", emailsSent: 34, spend: "$3,120" },
    outreach: [
      { id: "cr_marques_chen", name: "Marques Chen", platform: "YouTube", status: "Contracted", date: "Jun 20" },
      { id: "cr_priya_ramesh", name: "Priya Ramesh", platform: "YouTube", status: "Negotiating", date: "Jun 22" },
      { id: "cr_techdadmike", name: "u/techdadmike", platform: "Reddit", status: "Replied", date: "Jun 24" },
      { id: "cr_alex_johansson", name: "Alex Johansson", platform: "YouTube", status: "Contacted", date: "Jun 26" },
      { id: "cr_gadgetlab", name: "u/gadgetlab", platform: "Reddit", status: "Contacted", date: "Jun 28" },
    ],
    hotlist: [
      { name: "Marques Chen", platform: "YouTube", followers: "1.2M", score: 94 },
      { name: "Priya Ramesh", platform: "YouTube", followers: "480K", score: 89 },
      { name: "u/techdadmike", platform: "Reddit", followers: "42K karma", score: 86 },
    ],
  },
  camp_002: {
    id: "camp_002",
    name: "Home Lab Awareness",
    status: "Active",
    platforms: ["Reddit"],
    goal: "Brand Awareness",
    budget: "$3,200",
    startDate: "Jun 1, 2026",
    endDate: "Jul 31, 2026",
    brief:
      "Seed conversations in r/homelab, r/selfhosted, and r/HomeServer. Focus on organic-feeling posts from trusted community members. No aggressive CTAs — build trust first.",
    stats: { contacted: 12, replyRate: "58%", emailsSent: 18, spend: "$1,240" },
    outreach: [
      { name: "u/rackmountking", platform: "Reddit", status: "Contracted", date: "Jun 05" },
      { name: "u/selfhostedsam", platform: "Reddit", status: "Contracted", date: "Jun 08" },
      { name: "u/proxmoxpete", platform: "Reddit", status: "Negotiating", date: "Jun 12" },
      { name: "u/unraidundine", platform: "Reddit", status: "Replied", date: "Jun 15" },
      { name: "u/homelabhelen", platform: "Reddit", status: "Contacted", date: "Jun 20" },
    ],
    hotlist: [
      { name: "u/rackmountking", platform: "Reddit", followers: "88K karma", score: 92 },
      { name: "u/selfhostedsam", platform: "Reddit", followers: "54K karma", score: 88 },
    ],
  },
  camp_003: {
    id: "camp_003",
    name: "SaaS Tool Launch",
    status: "Active",
    platforms: ["YouTube", "X", "LinkedIn"],
    goal: "Product Review",
    budget: "$12,000",
    startDate: "Jul 01, 2026",
    endDate: "Sep 15, 2026",
    brief:
      "Launch cross-platform push for our new SaaS tool. Prioritize B2B thought leaders on LinkedIn and X. YouTube reviews should target productivity and dev-tools channels.",
    stats: { contacted: 15, replyRate: "36%", emailsSent: 22, spend: "$4,850" },
    outreach: [
      { name: "Devon Park", platform: "LinkedIn", status: "Contracted", date: "Jul 03" },
      { name: "Sarah Kwon", platform: "X", status: "Negotiating", date: "Jul 05" },
      { name: "Fireship Dev", platform: "YouTube", status: "Replied", date: "Jul 07" },
      { name: "Melissa Ortiz", platform: "LinkedIn", status: "Contacted", date: "Jul 09" },
      { name: "Ravi Sundar", platform: "X", status: "Contacted", date: "Jul 11" },
    ],
    hotlist: [
      { name: "Fireship Dev", platform: "YouTube", followers: "3.4M", score: 96 },
      { name: "Devon Park", platform: "LinkedIn", followers: "128K", score: 91 },
    ],
  },
  camp_004: {
    id: "camp_004",
    name: "B2B Thought Leadership",
    status: "Active",
    platforms: ["LinkedIn"],
    goal: "Thought Leadership",
    budget: "$7,500",
    startDate: "Jun 10, 2026",
    endDate: "Aug 10, 2026",
    brief:
      "Partner with senior B2B voices on LinkedIn to publish co-authored posts and carousels. Focus on industry insights, not product features.",
    stats: { contacted: 10, replyRate: "50%", emailsSent: 14, spend: "$2,900" },
    outreach: [
      { name: "Erika Vasquez", platform: "LinkedIn", status: "Contracted", date: "Jun 12" },
      { name: "Nathan Ho", platform: "LinkedIn", status: "Negotiating", date: "Jun 15" },
      { name: "Sofia Lindqvist", platform: "LinkedIn", status: "Replied", date: "Jun 18" },
      { name: "Tomás Ribeiro", platform: "LinkedIn", status: "Contacted", date: "Jun 22" },
      { name: "Yuki Tanaka", platform: "LinkedIn", status: "Contacted", date: "Jun 25" },
    ],
    hotlist: [
      { name: "Erika Vasquez", platform: "LinkedIn", followers: "240K", score: 93 },
      { name: "Nathan Ho", platform: "LinkedIn", followers: "180K", score: 90 },
    ],
  },
};

// Aliases for the two demo ids referenced in campaigns list
MOCK["camp_summer"] = MOCK.camp_001;
MOCK["camp_homelab"] = MOCK.camp_002;

const genericMock = (id: string): CampaignMock => ({
  id,
  name: "Untitled Campaign",
  status: "Draft",
  platforms: ["All"],
  goal: "Brand Awareness",
  budget: "$—",
  startDate: "—",
  endDate: "—",
  brief: "No brief yet. Add campaign details to get started.",
  stats: { contacted: 0, replyRate: "—", emailsSent: 0, spend: "$0" },
  outreach: [],
  hotlist: [],
});

const platColor = (p: string) =>
  p === "YouTube" ? "#FF0000" : p === "Reddit" ? "#FF4500" : p === "X" ? "#1A1A1A" : p === "LinkedIn" ? "#0A66C2" : "#7C3AED";

const statusStyle = (s: Status) => {
  if (s === "Active") return { color: "#00D97E", border: "#00D97E", bg: "rgba(0,217,126,0.12)" };
  if (s === "Completed") return { color: "#0A66C2", border: "#0A66C2", bg: "rgba(10,102,194,0.15)" };
  return { color: "#8892A4", border: "#8892A4", bg: "rgba(136,146,164,0.12)" };
};

const outreachColor = (s: OutreachStatus) =>
  s === "Contracted" ? "#00D97E" : s === "Negotiating" ? "#F59E0B" : s === "Replied" ? "#60A5FA" : "#8892A4";

function CampaignDetailPage() {
  const { id } = useParams({ from: "/app/campaigns/$id" });
  const [c, setC] = useState<CampaignMock | null>(null);

  useEffect(() => {
    if (MOCK[id]) {
      setC(MOCK[id]);
      return;
    }
    const stored = JSON.parse(localStorage.getItem("ar_campaigns") || "[]") as Array<Record<string, unknown>>;
    const found = stored.find((s) => s.id === id);
    if (found) {
      const base = genericMock(id);
      setC({
        ...base,
        name: (found.name as string) || base.name,
        goal: (found.goal as string) || base.goal,
        budget: found.budget ? `$${found.budget}` : base.budget,
        startDate: (found.startDate as string) || base.startDate,
        endDate: (found.endDate as string) || base.endDate,
        platforms: found.platform ? [found.platform as string] : base.platforms,
        brief: (found.brief as string) || base.brief,
        status:
          ((found.status as string) || "").toLowerCase() === "active"
            ? "Active"
            : ((found.status as string) || "").toLowerCase() === "completed"
            ? "Completed"
            : "Draft",
      });
    } else {
      setC(genericMock(id));
    }
  }, [id]);

  if (!c) return <AppShell title="Campaign">Loading…</AppShell>;

  const ss = statusStyle(c.status);
  const avatar = (name: string) =>
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

  return (
    <AppShell
      title=""
      right={
        <Link
          to="/app/campaigns"
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-white/10 hover:bg-white/5 text-sm text-[#8892A4] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Campaigns
        </Link>
      }
    >
      <div className="mb-6 flex items-center gap-4">
        <h1 className="text-3xl font-bold text-[#F0F4FF]">{c.name}</h1>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full border"
          style={{ color: ss.color, borderColor: ss.border, background: ss.bg }}
        >
          {c.status}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Creators Contacted" value={String(c.stats.contacted)} />
        <Stat label="Reply Rate" value={c.stats.replyRate} />
        <Stat label="Emails Sent" value={String(c.stats.emailsSent)} />
        <Stat label="Total Spend" value={c.stats.spend} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Outreach */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Outreach Activity</h3>
          {c.outreach.length === 0 ? (
            <div className="text-sm text-[#8892A4]">No outreach yet.</div>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {c.outreach.map((o) => (
                <div key={o.name} className="flex items-center gap-4 py-3">
                  <img src={avatar(o.name)} alt="" className="w-10 h-10 rounded-full bg-white/5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[#F0F4FF] truncate">{o.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: platColor(o.platform) }}
                      >
                        {o.platform}
                      </span>
                      <span className="text-xs text-[#8892A4]">{o.date}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: outreachColor(o.status) }}>
                    {o.status}
                  </span>
                  <Link
                    to="/app/creators/$id"
                    params={{ id: o.name.replace(/\s+/g, "-").toLowerCase() }}
                    className="text-sm text-[#00D97E] hover:underline"
                  >
                    View Profile →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Details */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Campaign Details</h3>
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-xs font-semibold text-[#8892A4] mb-1.5">Platforms</div>
              <div className="flex gap-1.5 flex-wrap">
                {c.platforms.map((p) => (
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
            <Detail label="Goal" value={c.goal} />
            <Detail label="Budget" value={c.budget} />
            <Detail label="Start Date" value={c.startDate} />
            <Detail label="End Date" value={c.endDate} />
            <div>
              <div className="text-xs font-semibold text-[#8892A4] mb-1.5">Brief</div>
              <textarea
                readOnly
                value={c.brief}
                rows={6}
                className="w-full p-3 rounded-lg bg-[#131D2E] border border-white/10 text-sm text-[#F0F4FF] resize-none"
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Hotlist */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[#F0F4FF]">Hotlist from this Campaign</h3>
          <Link to="/app/hotlist" className="text-sm text-[#00D97E] hover:underline">View all →</Link>
        </div>
        {c.hotlist.length === 0 ? (
          <div className="text-sm text-[#8892A4]">No creators added to the hotlist yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {c.hotlist.map((h) => (
              <div
                key={h.name}
                className="flex items-center gap-3 p-3 rounded-lg border border-white/[0.07] bg-[#131D2E]"
              >
                <img src={avatar(h.name)} alt="" className="w-10 h-10 rounded-full bg-white/5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#F0F4FF] truncate">{h.name}</div>
                  <div className="text-xs text-[#8892A4]">{h.followers}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#8892A4]">Score</div>
                  <div className="text-sm font-bold text-[#00D97E]">{h.score}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-semibold text-[#8892A4] mb-2">{label}</div>
      <div className="text-2xl font-bold text-[#F0F4FF]">{value}</div>
    </Card>
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
