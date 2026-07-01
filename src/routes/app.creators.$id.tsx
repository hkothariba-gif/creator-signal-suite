// Creator Profile Page
import { createFileRoute, useParams } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
import { ArrowLeft, Mail, Star } from "lucide-react";

export const Route = createFileRoute("/app/creators/$id")({
  component: CreatorProfilePage,
});

type Platform = "YouTube" | "Reddit" | "X" | "LinkedIn";

const platColor = (p: Platform) =>
  p === "YouTube" ? "#FF0000" : p === "Reddit" ? "#FF4500" : p === "X" ? "#1A1A1A" : "#0A66C2";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function mockFor(id: string) {
  const name = id
    .split("-")
    .map((s) => (s.startsWith("@") || s.startsWith("u/") ? s : s.charAt(0).toUpperCase() + s.slice(1)))
    .join(" ");
  const h = hash(id);
  const platforms: Platform[] = ["YouTube", "Reddit", "X", "LinkedIn"];
  const lowered = id.toLowerCase();
  const platform: Platform = lowered.startsWith("u-") || lowered.startsWith("r-")
    ? "Reddit"
    : lowered.startsWith("-") || lowered.includes("twitter")
    ? "X"
    : platforms[h % 4];

  const followersNum = 40 + (h % 1500);
  const followers = followersNum > 1000 ? `${(followersNum / 1000).toFixed(1)}M` : `${followersNum}K`;
  const engagement = `${(3 + ((h >> 3) % 60) / 10).toFixed(1)}%`;
  const avgViewsNum = 20 + ((h >> 5) % 400);
  const avgViews = avgViewsNum > 500 ? `${(avgViewsNum / 1000).toFixed(1)}M` : `${avgViewsNum}K`;
  const dealValue = `${60 + ((h >> 7) % 40)}`;

  const bio = `${name} is a trusted voice on ${platform}, known for deeply-researched content and an engaged, high-intent audience. They regularly partner with brands on long-term campaigns and consistently outperform category benchmarks on conversion.`;

  const content = [
    { title: "Why the new 2026 lineup actually matters", views: `${(h % 400) + 40}K`, days: 2 },
    { title: "I tested 12 tools so you don't have to", views: `${(h % 250) + 30}K`, days: 6 },
    { title: "The honest review nobody asked for", views: `${(h % 180) + 20}K`, days: 12 },
  ];

  const audience = [
    { label: "United States", pct: 45 },
    { label: "Tech & Software", pct: 38 },
    { label: "Age 18–34", pct: 55 },
  ];

  return { name, platform, followers, engagement, avgViews, dealValue, bio, content, audience };
}

function CreatorProfilePage() {
  const { id } = useParams({ from: "/app/creators/$id" });
  const c = mockFor(id);
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(id)}`;

  const addHotlist = () => {
    const list = JSON.parse(localStorage.getItem("ar_hotlist") || "[]");
    if (!list.find((x: { id: string }) => x.id === id)) {
      list.push({ id, name: c.name, platform: c.platform });
      localStorage.setItem("ar_hotlist", JSON.stringify(list));
    }
    toast.success("Added to hotlist!");
  };

  return (
    <AppShell
      title=""
      right={
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-white/10 hover:bg-white/5 text-sm text-[#8892A4] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      }
    >
      {/* Header */}
      <Card className="p-6 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          <img
            src={avatar}
            alt={c.name}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full bg-white/5 border border-white/10 shrink-0"
          />
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-[#F0F4FF]">{c.name}</h1>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                style={{ background: platColor(c.platform) }}
              >
                {c.platform}
              </span>
            </div>
            <div className="text-sm text-[#8892A4] mt-1.5">
              <span className="font-semibold text-[#F0F4FF]">{c.followers}</span> followers ·{" "}
              <span className="font-semibold text-[#F0F4FF]">{c.engagement}</span> engagement
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => alert(`Outreach sequence started for ${c.name}`)}
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold hover:brightness-110"
            >
              <Mail className="w-4 h-4" /> Contact Creator
            </button>
            <button
              onClick={addHotlist}
              className="inline-flex items-center gap-1.5 px-4 h-10 rounded-lg border border-[#00D97E] text-[#00D97E] text-sm font-bold hover:bg-[#00D97E]/10"
            >
              <Star className="w-4 h-4" /> Add to Hotlist
            </button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat label="Avg Views" value={c.avgViews} />
        <Stat label="Engagement Rate" value={c.engagement} />
        <Stat label="Brand Fit Score" value={`${c.dealValue}/100`} accent />
      </div>

      {/* Bio */}
      <Card className="p-6 mb-6">
        <h3 className="text-lg font-bold text-[#F0F4FF] mb-2">About</h3>
        <p className="text-sm text-[#F0F4FF]/80 leading-relaxed">{c.bio}</p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Content */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Recent Content</h3>
          <div className="divide-y divide-white/[0.07]">
            {c.content.map((p) => (
              <div key={p.title} className="py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#F0F4FF] truncate">{p.title}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ background: platColor(c.platform) }}
                    >
                      {c.platform}
                    </span>
                    <span className="text-xs text-[#8892A4]">
                      {p.views} {c.platform === "Reddit" ? "upvotes" : "views"} · {p.days}d ago
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Audience */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-[#F0F4FF] mb-4">Audience</h3>
          <div className="space-y-4">
            {c.audience.map((a) => (
              <div key={a.label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-[#F0F4FF]">{a.label}</span>
                  <span className="font-bold text-[#00D97E]">{a.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[#131D2E] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#00D97E]"
                    style={{ width: `${a.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
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
