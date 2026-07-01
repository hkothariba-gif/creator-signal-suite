import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { ArrowLeft, Mail, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/app/creators/$id")({
  component: CreatorProfilePage,
});

type Creator = {
  name: string;
  handle: string;
  platform: "YouTube" | "Reddit" | "X" | "LinkedIn";
  bio: string;
  location: string;
  followers: string;
  engagement: string;
  avgViews: string;
  score: number;
  topics: string[];
  recentPosts: { title: string; date: string; engagement: string }[];
  campaigns: { name: string; status: string; date: string }[];
};

const PROFILES: Record<string, Creator> = {
  "marques-chen": {
    name: "Marques Chen",
    handle: "@marqueschen",
    platform: "YouTube",
    bio: "Long-form tech reviewer covering consumer electronics, dev tools, and home lab gear. 8+ years of honest reviews.",
    location: "San Francisco, CA",
    followers: "1.2M",
    engagement: "6.8%",
    avgViews: "340K",
    score: 94,
    topics: ["Consumer Tech", "Dev Tools", "Home Lab", "Reviews"],
    recentPosts: [
      { title: "Testing the 2026 Summer Tech Bundle — Worth It?", date: "3d ago", engagement: "42K likes" },
      { title: "My Home Office Rebuild for Under $2K", date: "1w ago", engagement: "58K likes" },
      { title: "Framework 16 — 6 Months Later", date: "2w ago", engagement: "71K likes" },
    ],
    campaigns: [
      { name: "Summer Tech Drop", status: "Contracted", date: "Jun 20" },
      { name: "Spring Gadget Push", status: "Completed", date: "Apr 12" },
    ],
  },
  "priya-ramesh": {
    name: "Priya Ramesh",
    handle: "@priyabuilds",
    platform: "YouTube",
    bio: "Mid-tier reviewer focused on productivity gear and workspace setups. Known for detailed unboxings.",
    location: "Austin, TX",
    followers: "480K",
    engagement: "8.2%",
    avgViews: "125K",
    score: 89,
    topics: ["Productivity", "Workspace", "Unboxings"],
    recentPosts: [
      { title: "Best Desk Accessories of 2026", date: "5d ago", engagement: "18K likes" },
      { title: "Minimalist Setup Tour", date: "2w ago", engagement: "24K likes" },
    ],
    campaigns: [{ name: "Summer Tech Drop", status: "Negotiating", date: "Jun 22" }],
  },
};

const genericProfile = (slug: string): Creator => {
  const name = slug
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
  const isReddit = name.toLowerCase().startsWith("u/") || slug.startsWith("u-");
  const isX = name.startsWith("@") || slug.startsWith("-");
  return {
    name,
    handle: isReddit ? name : isX ? name : `@${slug.replace(/-/g, "")}`,
    platform: isReddit ? "Reddit" : isX ? "X" : "YouTube",
    bio: "Creator profile — full analytics and outreach history will populate as campaigns run.",
    location: "—",
    followers: "—",
    engagement: "—",
    avgViews: "—",
    score: 78,
    topics: ["General"],
    recentPosts: [],
    campaigns: [],
  };
};

const platColor = (p: string) =>
  p === "YouTube" ? "#FF0000" : p === "Reddit" ? "#FF4500" : p === "X" ? "#1A1A1A" : p === "LinkedIn" ? "#0A66C2" : "#7C3AED";

function CreatorProfilePage() {
  const { id } = useParams({ from: "/app/creators/$id" });
  const c = PROFILES[id] || genericProfile(id);
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}`;

  return (
    <AppShell
      title=""
      right={
        <Link
          to="/app/campaigns"
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-white/10 hover:bg-white/5 text-sm text-[#8892A4] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      }
    >
      {/* Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-5">
          <img src={avatar} alt="" className="w-24 h-24 rounded-full bg-white/5 border border-white/10" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-[#F0F4FF]">{c.name}</h1>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: platColor(c.platform) }}
              >
                {c.platform}
              </span>
            </div>
            <div className="text-sm text-[#8892A4] mt-1">
              {c.handle} · {c.location}
            </div>
            <p className="text-sm text-[#F0F4FF]/80 mt-3 max-w-2xl leading-relaxed">{c.bio}</p>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {c.topics.map((t) => (
                <span
                  key={t}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-[#131D2E] border border-white/10 text-[#8892A4]"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold">
              <Mail className="w-4 h-4" /> Outreach
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg border border-white/10 text-sm text-[#F0F4FF] hover:bg-white/5">
              <ExternalLink className="w-4 h-4" /> Add to Hotlist
            </button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Stat label="Followers" value={c.followers} />
        <Stat label="Engagement" value={c.engagement} />
        <Stat label="Avg Views" value={c.avgViews} />
        <Stat label="Match Score" value={String(c.score)} accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Recent Posts</h3>
          {c.recentPosts.length === 0 ? (
            <div className="text-sm text-[#8892A4]">No recent posts synced.</div>
          ) : (
            <div className="divide-y divide-white/[0.07]">
              {c.recentPosts.map((p) => (
                <div key={p.title} className="py-3">
                  <div className="font-semibold text-[#F0F4FF]">{p.title}</div>
                  <div className="text-xs text-[#8892A4] mt-1">
                    {p.date} · {p.engagement}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Campaign History</h3>
          {c.campaigns.length === 0 ? (
            <div className="text-sm text-[#8892A4]">No campaigns yet.</div>
          ) : (
            <div className="space-y-3">
              {c.campaigns.map((cp) => (
                <div
                  key={cp.name}
                  className="p-3 rounded-lg border border-white/[0.07] bg-[#131D2E]"
                >
                  <div className="font-semibold text-sm text-[#F0F4FF]">{cp.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-[#8892A4]">{cp.date}</span>
                    <span className="text-xs font-bold text-[#00D97E]">{cp.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-semibold text-[#8892A4] mb-2">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-[#00D97E]" : "text-[#F0F4FF]"}`}>{value}</div>
    </Card>
  );
}
