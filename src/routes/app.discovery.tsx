import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { Telescope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/app/discovery")({
  validateSearch: (search: Record<string, unknown>) => ({
    campaign: typeof search.campaign === "string" ? search.campaign : undefined,
  }),
  component: DiscoveryPage,
});

interface CreatorResult {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  platform: string;
}

// Runs on the server so the YouTube key never reaches the browser.
const searchYouTubeChannels = createServerFn({ method: "GET" })
  .inputValidator((data: { query: string }) => data)
  .handler(async ({ data }): Promise<CreatorResult[]> => {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return [];
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(data.query)}&type=channel&maxResults=12&key=${key}`,
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      items?: Array<{
        id: { channelId: string };
        snippet: { channelTitle: string; description: string; thumbnails?: { default?: { url?: string } } };
      }>;
    };
    return (json.items ?? []).map((item) => ({
      id: item.id.channelId,
      name: item.snippet.channelTitle,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.default?.url,
      platform: "YouTube",
    }));
  });

function DiscoveryPage() {
  const { user } = useAuth();
  const { campaign: campaignParam } = Route.useSearch();
  const status = useConnectorStatus();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CreatorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const ytReady = status.data ? status.data.platform.youtube : undefined;

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
    if (!ytReady || !query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const found = await searchYouTubeChannels({ data: { query: query.trim() } });
      setResults(found);
    } catch {
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
      <div className="flex gap-2 mb-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search creators by name, niche, or keyword"
          className="flex-1 h-[52px] px-5 rounded-lg bg-[#0C1222] border border-white/10 focus:outline-none focus:border-[#00D97E] text-white"
        />
        <button
          onClick={handleSearch}
          disabled={!ytReady || !query.trim() || loading}
          className="px-6 h-[52px] rounded-lg bg-[#00D97E] text-[#05080F] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Search
        </button>
      </div>

      <DataGate
        connected={ytReady}
        loading={status.isLoading || loading}
        empty={searched && results.length === 0}
        label="Creator search runs through the YouTube connection"
      >
        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((c) => (
              <Card key={c.id} className="p-5 flex flex-col">
                <div className="flex items-center gap-3">
                  {c.thumbnail ? (
                    <img
                      src={c.thumbnail}
                      alt={c.name}
                      className="w-12 h-12 rounded-full bg-white/5"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-[#8892A4]">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
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
                    params={{ id: c.id || slugify(c.name) }}
                    className="flex-1 h-9 inline-flex items-center justify-center rounded-lg border border-white/10 text-xs font-bold text-white hover:bg-white/5"
                  >
                    View Profile →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-12">
            <Telescope className="w-28 h-28 text-[#00D97E]" strokeWidth={1.2} />
            <h2 className="mt-6 text-[22px] font-bold">No creators loaded yet</h2>
            <p className="mt-2 max-w-[480px] text-[15px] text-[#8892A4]">
              Enter a keyword above to search YouTube channels.
            </p>
          </div>
        )}
      </DataGate>
    </AppShell>
  );
}
