import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "@/components/landing/icons";
import { Telescope } from "lucide-react";

export const Route = createFileRoute("/app/discovery")({
  component: DiscoveryPage,
});

const PLAT_FILTERS = ["All", "YouTube", "Reddit", "X", "LinkedIn"];

function DiscoveryPage() {
  const [plat, setPlat] = useState("All");
  const [apiModal, setApiModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const ytKey = typeof window !== "undefined" ? (localStorage.getItem("ar_yt_api_key") || "") : "";

  return (
    <AppShell title="Creator Discovery">
      {!ytKey && (
        <div className="mb-4 flex items-center justify-between gap-3 p-4 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/[0.06]">
          <span className="text-sm text-[#FCD34D]">
            ⚠ YouTube API key not configured. Go to Settings → API Keys to connect.
          </span>
          <Link to="/app/settings" className="px-4 h-9 inline-flex items-center rounded-lg border border-[#F59E0B]/50 text-[#F59E0B] text-xs font-bold hover:bg-[#F59E0B]/10">
            Open Settings →
          </Link>
        </div>
      )}
      <Card className="p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {PLAT_FILTERS.map((p) => (
              <button
                key={p}
                onClick={() => setPlat(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  plat === p ? "bg-[#00D97E] text-[#05080F]" : "bg-white/[0.05] text-[#8892A4] hover:text-white"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <Sel label="Subscribers" opts={["Any","Under 10K","10K-100K","100K-500K","500K+"]} />
          <Sel label="Brand-fit" opts={["Any","70%+","80%+","90%+"]} />
          <Sel label="CPM" opts={["Any","$5-$15","$15-$30","$30-$50","$50+"]} />
          <input placeholder="e.g. tech reviews, personal finance..." className="flex-1 min-w-[200px] h-9 px-3 rounded-lg bg-[#131D2E] border border-white/10 text-sm focus:outline-none focus:border-[#00D97E]" />
        </div>
      </Card>

      <input
        placeholder="Search creators by name, niche, or keyword..."
        className="w-full h-[52px] px-5 rounded-lg bg-[#0C1222] border border-white/10 focus:outline-none focus:border-[#00D97E] mb-4"
      />

      {!ytKey && (
        <div className="flex items-center justify-between p-4 rounded-lg border border-[#F59E0B]/30 bg-[#F59E0B]/[0.06] mb-10">
          <span className="text-sm text-[#FCD34D]">
            ⚠ YouTube search requires API connection. Reddit and X signals load automatically once connected.
          </span>
          <button onClick={() => setApiModal(true)} className="px-4 h-9 rounded-lg border border-[#F59E0B]/50 text-[#F59E0B] text-xs font-bold hover:bg-[#F59E0B]/10">
            Connect YouTube API →
          </button>
        </div>
      )}

      <div className="flex flex-col items-center text-center py-12">
        <Telescope className="w-28 h-28 text-[#00D97E]" strokeWidth={1.2} />
        <h2 className="mt-6 text-[22px] font-bold">No creators loaded yet</h2>
        <p className="mt-2 max-w-[480px] text-[15px] text-[#8892A4]">
          Connect your YouTube API key to start discovering creators. Reddit and X signals load automatically once your account is configured.
        </p>
        <button onClick={() => setApiModal(true)} className="mt-6 px-6 h-11 rounded-lg bg-[#00D97E] text-[#05080F] font-bold">
          Connect YouTube API →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
        <InfoCard
          icon={<YouTubeIcon size={28} />}
          title="YouTube Creator Search"
          body="Search 800M+ videos. Filter by subscriber count, engagement rate, topic cluster, and CPM range. See brand-fit scores before you reach out."
        />
        <InfoCard
          icon={<RedditIcon size={28} />}
          title="Reddit Community Mapping"
          body="Map subreddits by community size, sentiment, buyer intent signals, and 'Why Flagged' conversation snippets."
        />
        <InfoCard
          icon={<XIcon size={28} bg="white" />}
          title="X Voice Discovery"
          body="Find niche voices by follower quality score, engagement rate, recent brand mentions, and ICP audience match."
        />
        <InfoCard
          icon={<LinkedInIcon size={28} />}
          title="LinkedIn Top Voices"
          body="Identify Director+ contributors and Top Voices in your niche by industry, role level, and post engagement rate."
        />
      </div>

      {apiModal && (
        <ModalShell onClose={() => setApiModal(false)}>
          <h3 className="text-xl font-bold">Connect your YouTube Data API v3</h3>
          <ol className="mt-4 space-y-2 text-sm text-[#8892A4] list-decimal list-inside">
            <li>Go to console.cloud.google.com</li>
            <li>Enable YouTube Data API v3</li>
            <li>Create an API key</li>
            <li>Paste it below</li>
          </ol>
          <input
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            className="mt-4 w-full h-11 px-4 rounded-lg bg-[#131D2E] border border-white/10 font-mono text-sm focus:outline-none focus:border-[#00D97E]"
          />
          <button
            onClick={() => {
              if (typeof window !== "undefined") localStorage.setItem("ar_yt_key", apiKey);
              toast.success("API key saved. YouTube search is now active!");
              setApiModal(false);
            }}
            className="mt-5 w-full h-11 rounded-lg bg-[#00D97E] text-[#05080F] font-bold"
          >
            Save API Key
          </button>
        </ModalShell>
      )}
    </AppShell>
  );
}

function Sel({ label, opts }: { label: string; opts: string[] }) {
  return (
    <select className="h-9 px-2 rounded-lg bg-[#131D2E] border border-white/10 text-xs text-[#F0F4FF] focus:outline-none focus:border-[#00D97E]">
      <option>{label}: Any</option>
      {opts.slice(1).map((o) => <option key={o}>{`${label}: ${o}`}</option>)}
    </select>
  );
}

function InfoCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <Card className="p-6">
      {icon}
      <h4 className="mt-3 font-bold">{title}</h4>
      <p className="mt-2 text-sm text-[#8892A4] leading-relaxed">{body}</p>
    </Card>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-[480px] p-8 rounded-2xl bg-[#0C1222] border border-white/10" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
