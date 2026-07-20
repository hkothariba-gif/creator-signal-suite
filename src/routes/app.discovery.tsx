import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/AppShell";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { CampaignPicker } from "@/components/app/CampaignPicker";
import { Telescope, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { campaignText, contentRelevance, alignmentKeyword } from "@/lib/scoring";

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
    const key = process.env.YOUTUBE_API_KEY || process.env.YOU_TUBE_API;
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
  const [campaignId, setCampaignId] = useState<string | undefined>(campaignParam);
  const [campText, setCampText] = useState<string>("");
  const [detail, setDetail] = useState<CreatorResult | null>(null);

  const ytReady = status.data ? status.data.platform.youtube : undefined;

  // Load the selected campaign (or most recent) to prefill the query and to
  // score fit against. Runs when the chosen campaign changes.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      let q = supabase
        .from("campaigns")
        .select("id,name,product_description,target_audience,search_criteria")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);
      if (campaignId) q = q.eq("id", campaignId);
      const { data } = await q;
      if (cancelled) return;
      const camp = data?.[0];
      setCampText(camp ? campaignText(camp) : "");
      const sc = (camp?.search_criteria ?? null) as { primaryQuery?: string; searchQueries?: string[] } | null;
      const pre = sc?.primaryQuery || sc?.searchQueries?.[0];
      if (pre) setQuery((cur) => cur || pre);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, campaignId]);

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

  // Quick keyword fit shown right in Discovery. This is the fast client side
  // estimate; the full LLM and channel weighted score is computed on the
  // Hotlist once a creator is added and scored.
  const quickFit = useMemo(() => {
    return (c: CreatorResult): number | null => {
      if (!campText) return null;
      const text = [c.name, c.description].filter(Boolean).join(". ");
      const content = contentRelevance(text, campText);
      const align = alignmentKeyword(text, campText);
      return Math.round(align * 0.6 + content * 0.4);
    };
  }, [campText]);

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
      campaign_id: campaignId ?? null,
      profile_data: { description: c.description, thumbnail: c.thumbnail },
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(
      campaignId ? `${c.name} added to this campaign's hotlist` : `${c.name} added to hotlist`,
    );
  };

  const slugify = (n: string) => n.toLowerCase().replace(/\s+/g, "-");

  return (
    <AppShell title="Creator Discovery" right={<CampaignPicker value={campaignId} onChange={setCampaignId} />}>
      {!campaignId && (
        <p className="text-xs text-[#8892A4] mb-3">
          Pick a campaign above to attach creators to it and see fit estimates. Without one, creators are added to your general list.
        </p>
      )}
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
            {results.map((c) => {
              const fit = quickFit(c);
              return (
                <Card
                  key={c.id}
                  className="p-5 flex flex-col cursor-pointer hover:border-[#00D97E]/40 transition-colors"
                  onClick={() => setDetail(c)}
                >
                  <div className="flex items-center gap-3">
                    {c.thumbnail ? (
                      <img src={c.thumbnail} alt={c.name} className="w-12 h-12 rounded-full bg-white/5" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-[#8892A4]">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-white truncate">{c.name}</h3>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF0000]/15 text-[#FF6B6B]">
                          YouTube
                        </span>
                        {fit != null && (
                          <span
                            className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: "rgba(0,217,126,0.15)", color: "#00D97E" }}
                            title="Fast keyword fit estimate. Add to the campaign for the full score."
                          >
                            ~{fit}% fit
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-[#8892A4] line-clamp-3 flex-1">
                    {c.description || "No description available."}
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToHotlist(c);
                      }}
                      className="flex-1 h-9 rounded-lg bg-[#00D97E] text-[#05080F] text-xs font-bold hover:bg-[#00D97E]/90"
                    >
                      Add to Hotlist
                    </button>
                    <Link
                      to="/app/creators/$id"
                      params={{ id: c.id || slugify(c.name) }}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-9 inline-flex items-center justify-center rounded-lg border border-white/10 text-xs font-bold text-white hover:bg-white/5"
                    >
                      View Profile →
                    </Link>
                  </div>
                </Card>
              );
            })}
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

      {/* Creator detail modal. Discovery results are not saved rows yet, so
          the detail view shows what the search returned; metrics stay in the
          dev phase placeholder pattern until the creator is saved and scored. */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0C1222] p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end -mt-2 -mr-2">
              <button
                onClick={() => setDetail(null)}
                className="p-1.5 rounded-lg text-[#8892A4] hover:text-white hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              {detail.thumbnail ? (
                <img src={detail.thumbnail} alt={detail.name} className="w-16 h-16 rounded-full bg-white/5 border border-white/10" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg font-bold text-[#8892A4]">
                  {detail.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-white truncate">{detail.name}</h2>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF0000]/15 text-[#FF6B6B]">
                    {detail.platform}
                  </span>
                  {quickFit(detail) != null && (
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{ background: "rgba(0,217,126,0.15)", color: "#00D97E" }}
                    >
                      ~{quickFit(detail)}% fit
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-bold text-[#F0F4FF] mb-1">About</h3>
              <p className="text-sm text-[#8892A4] leading-relaxed">
                {detail.description || "No description available."}
              </p>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-bold text-[#F0F4FF] mb-1">Platform Metrics</h3>
              <p className="text-sm text-[#8892A4]">
                Metrics load once this creator is saved to your hotlist and scored.
              </p>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  addToHotlist(detail);
                }}
                className="flex-1 h-10 rounded-lg bg-[#00D97E] text-[#05080F] text-sm font-bold hover:bg-[#00D97E]/90"
              >
                Add to Hotlist
              </button>
              <Link
                to="/app/creators/$id"
                params={{ id: detail.id || slugify(detail.name) }}
                className="flex-1 h-10 inline-flex items-center justify-center rounded-lg border border-white/10 text-sm font-bold text-white hover:bg-white/5"
              >
                View Profile →
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
