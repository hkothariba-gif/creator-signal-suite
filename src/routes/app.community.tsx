import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
import { RedditIcon, XIcon } from "@/components/landing/icons";

export const Route = createFileRoute("/app/community")({
  component: CommunityPage,
});

const SIGNALS = [
  { plat: "Reddit", source: "r/homelab", time: "5h ago", sentiment: "Positive", text: "Just tried AspenReach for our Q3 campaign and honestly the setup took 10 minutes and the brand fit scores were eerily accurate...", tags: ["WHY FLAGGED", "BUYER JOURNEY"] },
  { plat: "X", source: "@devtools_daily", time: "8h ago", sentiment: "Positive", text: "Hot take: most influencer tools are completely dead. AspenReach is the only one I've seen that actually tells you why a creator fits your audience before you pay them.", tags: ["BRAND MENTION"] },
  { plat: "Reddit", source: "r/entrepreneur", time: "1d ago", sentiment: "Neutral", text: "Anyone else struggle to measure real ROI from YouTube creator campaigns? We've been trying a few platforms but none of them give us audience data before the deal...", tags: ["BUYER JOURNEY", "COMPETITOR MENTION"] },
  { plat: "Reddit", source: "r/personalfinance", time: "1d ago", sentiment: "Positive", text: "We found Reddit micro-influencers who already had threads about our product. First campaign through AspenReach: 8x ROAS. Not joking.", tags: ["BRAND MENTION", "WHY FLAGGED"] },
  { plat: "X", source: "@saasfounder_tweets", time: "2d ago", sentiment: "Positive", text: "Replaced our entire influencer agency for scouting. AspenReach does in one hour what used to take a week of back-and-forth.", tags: ["BRAND MENTION"] },
  { plat: "Reddit", source: "r/SaaS", time: "3d ago", sentiment: "Neutral", text: "Which platform actually helps you find quality creators? We tried [Competitor] and the follower counts were all inflated. Looking for something that actually shows audience quality...", tags: ["COMPETITOR MENTION", "BUYER JOURNEY"] },
];

const TABS = ["Brand Mentions (4)", "Buyer Intent (8)", "Competitor Mentions (2)", "Trending Topics (6)"];

const tagColor = (t: string) => {
  if (t === "WHY FLAGGED") return { bg: "rgba(245,158,11,0.15)", color: "#F59E0B" };
  if (t === "BUYER JOURNEY") return { bg: "rgba(0,217,126,0.15)", color: "#00D97E" };
  if (t === "BRAND MENTION") return { bg: "rgba(124,58,237,0.15)", color: "#A78BFA" };
  return { bg: "rgba(255,255,255,0.08)", color: "#8892A4" };
};

const sentBadge = (s: string) => {
  if (s === "Positive") return { bg: "rgba(0,217,126,0.12)", color: "#00D97E" };
  if (s === "Negative") return { bg: "rgba(239,68,68,0.12)", color: "#EF4444" };
  return { bg: "rgba(255,255,255,0.08)", color: "#8892A4" };
};

function CommunityPage() {
  const [tab, setTab] = useState(0);
  const [thread, setThread] = useState(false);

  return (
    <AppShell title="Community Signals">
      <p className="text-[#8892A4] mb-4">Reddit and X conversations about your product and category</p>

      <div className="p-4 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/[0.06] mb-6">
        <span className="text-sm text-[#FCD34D]">Showing demo data. Connect Reddit and X APIs in Settings to load live signals.</span>
      </div>

      <div className="flex gap-6 border-b border-white/[0.07] mb-5 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px ${
              tab === i ? "border-[#00D97E] text-[#00D97E]" : "border-transparent text-[#8892A4] hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex gap-3 mb-5">
        <select className="h-9 px-3 rounded-lg bg-[#0C1222] border border-white/10 text-sm"><option>Platform: All</option><option>Reddit</option><option>X</option></select>
        <select className="h-9 px-3 rounded-lg bg-[#0C1222] border border-white/10 text-sm"><option>Sentiment: All</option><option>Positive</option><option>Neutral</option><option>Negative</option></select>
        <select className="h-9 px-3 rounded-lg bg-[#0C1222] border border-white/10 text-sm"><option>Last 7d</option><option>Last 30d</option><option>Last 90d</option></select>
      </div>

      <div className="space-y-3">
        {SIGNALS.map((s, i) => {
          const sent = sentBadge(s.sentiment);
          return (
            <Card key={i} className="px-5 py-4">
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <span className="text-[10px] font-bold px-2 py-1 rounded-full text-white" style={{ background: s.plat === "Reddit" ? "#FF4500" : "#1A1A1A" }}>
                  {s.plat === "Reddit" ? <RedditIcon size={12} /> : <XIcon size={12} bg="none" className="[&_path]:fill-white" />}
                </span>
                <span className="font-semibold text-sm">{s.source}</span>
                <span className="text-xs text-[#4B5563]">{s.time}</span>
                <span className="ml-auto text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: sent.bg, color: sent.color }}>{s.sentiment}</span>
              </div>
              <p className="text-sm italic text-[#F0F4FF] leading-relaxed line-clamp-3">"{s.text}"</p>
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {s.tags.map((t) => {
                  const tc = tagColor(t);
                  return <span key={t} className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: tc.bg, color: tc.color }}>{t}</span>;
                })}
              </div>
              <div className="mt-3 flex gap-4">
                <button onClick={() => setThread(true)} className="text-xs text-[#00D97E] hover:underline">View Thread →</button>
                <button onClick={() => toast.success("Signal saved to Hotlist research queue!")} className="text-xs text-[#00D97E] hover:underline">Add to Hotlist →</button>
              </div>
            </Card>
          );
        })}
      </div>

      {thread && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setThread(false)}>
          <div className="w-full max-w-[420px] p-7 rounded-2xl bg-[#0C1222] border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">External thread linking coming soon</h3>
            <p className="mt-3 text-sm text-[#8892A4]">You'll be able to jump directly to the original post.</p>
            <button onClick={() => setThread(false)} className="mt-5 w-full h-11 rounded-lg bg-[#00D97E] text-[#05080F] font-bold">Got it</button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
