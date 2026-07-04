import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "@/components/landing/icons";
import { Telescope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/app/discovery")({
  validateSearch: (search: Record<string, unknown>) => ({
    campaign: typeof search.campaign === "string" ? search.campaign : undefined,
  }),
  component: DiscoveryPage,
});

const PLAT_FILTERS = ["All", "YouTube", "Reddit", "X", "LinkedIn"];

interface CreatorResult {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  platform: string;
}

function DiscoveryPage() {
  const { user } = useAuth();
  const { campaign: campaignParam } = Route.useSearch();
  const [plat, setPlat] = useState("All");
  const [apiModal, setApiModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [ytKey, setYtKey] = useState(
    typeof window !== "undefined" ? localStorage.getItem("ar_yt_api_key") || "" : ""
  );
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CreatorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Prefill query from campaign search_criteria (specified id, else most recent)
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      let q = supabase
        .from("campaigns")
        .select("id,search_criteria")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (campaignParam) q = q.eq("id", campaignParam);
      const { data } = await q;
      if (cancelled) return;
      const sc = (data?.[0]?.search_criteria ?? null) as
        | { primaryQuery?: string; searchQueries?: string[] }
        | null;
      const pre = sc?.primaryQuery || sc?.searchQueries?.[0];
      if (pre) setQuery((cur) => cur || pre);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, campaignParam]);


  const handleSearch = async () => {
    if (!ytKey || !query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=12&key=${ytKey}`
      );
      const data = await res.json();
      if (data.items) {
        setResults(
          data.items.map((item: any) => ({
            id: item.id.channelId,
            name: item.snippet.channelTitle,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails?.default?.url,
            platform: "YouTube",
          }))
        );
      } else {
        setResults([]);
      }
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToHotlist = async (c: CreatorResult) => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    const { data: existing } = await supabase
      .from("hotlist")
      .select("id")
      .eq("user_id", user.id)
      .eq("external_id", c.id)
      .maybeSingle();
    if (existing) {
      toast.info(`${c.name} is already in your hotlist`);
      return;
    }
    const { error } = await supabase.from("hotlist").insert({
      user_id: user.id,
      creator_name: c.name,
      avatar_url: c.thumbnail ?? null,
      external_id: c.id,
      source: "youtube_api",
      platform: c.platform,
      stage: "saved",
      profile_data: { description: c.description, thumbnail: c.thumbnail },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${c.name} added to hotlist`);
  };


  const slugify = (n: string) => encodeURIComponent(n.toLowerCase().replace(/\s+/g, "-"));

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

      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search creators by name, niche, or keyword..."
          className="flex-1 h-[52px] px-5 rounded-lg bg-[#0C1222] border border-white/10 focus:outline-none focus:border-[#00D97E] text-white"
        />
        <button
          onClick={handleSearch}
          disabled={!ytKey || !query.trim() || loading}
          className="px-6 h-[52px] rounded-lg bg-[#00D97E] text-[#05080F] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Search
        </button>
      </div>

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

      {loading && (
        <div className="flex flex-col items-center py-16">
          <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[#00D97E] animate-spin" />
          <p className="mt-4 text-sm text-[#8892A4]">Searching YouTube…</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center text-center py-12">
          <Telescope className="w-20 h-20 text-[#8892A4]" strokeWidth={1.2} />
          <h2 className="mt-4 text-lg font-bold">No channels found</h2>
          <p className="mt-2 text-sm text-[#8892A4]">Try a different keyword or niche.</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((c) => (
            <Card key={c.id} className="p-5 flex flex-col">
              <div className="flex items-center gap-3">
                <img
                  src={c.thumbnail || `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(c.name)}`}
                  alt={c.name}
                  className="w-12 h-12 rounded-full bg-white/5"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white truncate">{c.name}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF0000]/15 text-[#FF6B6B]">
                    YouTube
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm text-[#8892A4] line-clamp-3 flex-1">
                {c.description || "No description available."}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => addToHotlist(c)}
                  className="flex-1 h-9 rounded-lg bg-[#00D97E] text-[#05080F] text-xs font-bold hover:bg-[#00D97E]/90"
                >
                  Add to Hotlist
                </button>
                <Link
                  to="/app/creators/$id"
                  params={{ id: slugify(c.name) }}
                  className="flex-1 h-9 inline-flex items-center justify-center rounded-lg border border-white/10 text-xs font-bold text-white hover:bg-white/5"
                >
                  View Profile →
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!searched && !loading && (
        <>
          <div className="flex flex-col items-center text-center py-12">
            <Telescope className="w-28 h-28 text-[#00D97E]" strokeWidth={1.2} />
            <h2 className="mt-6 text-[22px] font-bold">No creators loaded yet</h2>
            <p className="mt-2 max-w-[480px] text-[15px] text-[#8892A4]">
              {ytKey
                ? "Enter a keyword above to search YouTube channels in real time."
                : "Connect your YouTube API key to start discovering creators. Reddit and X signals load automatically once your account is configured."}
            </p>
            {!ytKey && (
              <button onClick={() => setApiModal(true)} className="mt-6 px-6 h-11 rounded-lg bg-[#00D97E] text-[#05080F] font-bold">
                Connect YouTube API →
              </button>
            )}
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
        </>
      )}

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
              if (typeof window !== "undefined") localStorage.setItem("ar_yt_api_key", apiKey);
              setYtKey(apiKey);
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
