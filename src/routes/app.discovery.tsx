import { createFileRoute, Link } from "@tanstack/react-router";
import type { SearchSchemaInput } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { campaignText, contentRelevance, alignmentKeyword } from "@/lib/scoring";
import { useAspenCampaign } from "@/routes/app";

/* CREATOR DISCOVERY — the `v.isDiscovery` block of src/aspen/AspenApp.tsx, on
   the live hooks the dark version used. Shell, header and title come from the
   /app layout route.

   The campaign this scores against comes from the sidebar switcher now (see
   the CAMPAIGN block in app.tsx) instead of the old header CampaignPicker; the
   `campaign` search param still overrides it so existing links keep working.

   Profile links point at hotlist row UUIDs, never a slug: a discovery result is
   not a saved row, so "Profile →" only appears once the creator is in the
   hotlist and we know its id. */

export const Route = createFileRoute("/app/discovery")({
  validateSearch: (search: { campaign?: string } & SearchSchemaInput) => ({
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
    // Throwing rather than returning [] — a missing key or a quota rejection is
    // not "no creators matched", and the screen needs to be able to say so.
    if (!key) throw new Error("YouTube is not configured on the server yet.");
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(data.query)}&type=channel&maxResults=12&key=${key}`,
    );
    if (!res.ok)
      throw new Error(
        res.status === 403
          ? "YouTube rejected the search — the daily quota is likely used up. Try again tomorrow."
          : `YouTube returned an error (${res.status}). Try again in a moment.`,
      );

    const json = (await res.json()) as {
      items?: Array<{
        id: { channelId: string };
        snippet: {
          channelTitle: string;
          description: string;
          thumbnails?: { default?: { url?: string } };
        };
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
  const { selected } = useAspenCampaign();
  const status = useConnectorStatus();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CreatorResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [campText, setCampText] = useState<string>("");
  const [campName, setCampName] = useState<string>("");
  // external_id → hotlist row id, so a result can link to its real profile.
  const [saved, setSaved] = useState<Record<string, string>>({});

  const campaignId = campaignParam ?? selected?.id;
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
      setCampName(camp?.name ?? "");
      const sc = (camp?.search_criteria ?? null) as {
        primaryQuery?: string;
        searchQueries?: string[];
      } | null;
      const pre = sc?.primaryQuery || sc?.searchQueries?.[0];
      if (pre) setQuery((cur) => cur || pre);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, campaignId]);

  // Which of these creators are already saved, and under what row id.
  useEffect(() => {
    if (!user || results.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("hotlist")
        .select("id,external_id")
        .eq("user_id", user.id)
        .in(
          "external_id",
          results.map((r) => r.id),
        );
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const row of data ?? []) if (row.external_id) next[row.external_id] = row.id;
      setSaved((cur) => ({ ...cur, ...next }));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, results]);

  const handleSearch = async () => {
    if (!ytReady || !query.trim()) return;
    setLoading(true);
    setSearched(true);
    setSearchError(null);
    try {
      const found = await searchYouTubeChannels({ data: { query: query.trim() } });
      setResults(found);
      // The server function returns [] both for "no matches" and for a key or
      // quota failure. Only the second case is an error the user can act on, so
      // it is reported as one instead of reading as zero results.
      if (found.length === 0) setSearchError(null);
    } catch (e) {
      setResults([]);
      setSearchError(
        e instanceof Error ? e.message : "The YouTube search request failed. Try again.",
      );
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
      setSaved((cur) => ({ ...cur, [c.id]: existing.id }));
      toast.info(`${c.name} is already in your hotlist`);
      return;
    }
    const { data: inserted, error } = await supabase
      .from("hotlist")
      .insert({
        user_id: user.id,
        creator_name: c.name,
        avatar_url: c.thumbnail ?? null,
        external_id: c.id,
        source: "youtube_api",
        platform: c.platform,
        stage: "saved",
        campaign_id: campaignId ?? null,
        profile_data: { description: c.description, thumbnail: c.thumbnail },
      })
      .select("id")
      .single();
    if (error || !inserted) {
      toast.error(error?.message ?? "Failed to add to hotlist");
      return;
    }
    setSaved((cur) => ({ ...cur, [c.id]: inserted.id }));
    toast.success(
      campaignId ? `${c.name} added to this campaign's hotlist` : `${c.name} added to hotlist`,
    );
  };

  return (
    <div className="aspen-scope">
      <div className="flex gap-[10px] mb-[12px] flex-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search creators by name, niche, or keyword"
          className="flex-1 min-w-[260px] h-[52px] p-[0_18px] rounded-[14px] border-[1.5px] border-border bg-surface text-[15.5px] outline-none"
        />
        <button
          onClick={handleSearch}
          disabled={!ytReady || !query.trim() || loading}
          className="border-0 bg-accent text-cream text-[15px] font-bold p-[0_26px] rounded-[14px] cursor-pointer ah28 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>
      {/* Search only reaches YouTube today. The other three are named here as
          not connected rather than left implied, so nobody runs a query
          expecting Reddit or LinkedIn results and reads zero as no match. */}
      <div className="flex items-center gap-[8px] mb-[14px] flex-wrap">
        <span className="text-[11px] font-bold tracking-[0.12em] text-subtle">SEARCHING</span>
        <span className="text-[12px] font-bold p-[5px_10px] rounded-[9px] bg-dark text-cream">
          YouTube
        </span>
        {["Reddit", "X", "LinkedIn"].map((p) => (
          <span
            key={p}
            title="Not connected yet"
            className="text-[12px] font-bold p-[5px_10px] rounded-[9px] bg-sand text-subtle"
          >
            {p} · not connected
          </span>
        ))}
        <Link to="/app/platforms" className="text-[12.5px] font-bold text-accent no-underline">
          Connect platforms →
        </Link>
      </div>
      <div className="text-[13.5px] text-subtle mb-[22px]">
        {campName ? (
          <>
            Scored against <strong className="text-muted">{campName}</strong> — product, audience
            and brief all feed the fit estimate.
          </>
        ) : (
          <>
            No campaign selected — creators are added to your general list and no fit estimate is
            shown.
          </>
        )}
      </div>


      <DataGate
        connected={ytReady}
        loading={status.isLoading || loading}
        empty={searched && !searchError && results.length === 0}
        error={!!searchError}
        errorTitle="Search failed"
        errorHint={searchError ?? undefined}
        errorAction={
          <button
            onClick={handleSearch}
            className="border-0 bg-accent text-cream text-[13.5px] font-bold p-[10px_16px] rounded-[11px] cursor-pointer"
          >
            Try that search again
          </button>
        }
        label="Creator search runs through the YouTube connection"
        emptyTitle="Nothing matched that search"
        emptyHint="Try a broader phrase, or the words your buyers would use for the problem rather than your product name."
      >


        {results.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-[16px]">
            {results.map((c) => {
              const fit = quickFit(c);
              const hotlistId = saved[c.id];
              return (
                <div
                  key={c.id}
                  className="bg-surface border-[1.5px] border-border rounded-[20px] p-[20px] flex flex-col ah29"
                >
                  <div className="flex gap-[12px] items-center">
                    {c.thumbnail ? (
                      <img
                        src={c.thumbnail}
                        alt=""
                        className="w-[44px] h-[44px] rounded-[13px] shrink-0 object-cover"
                      />
                    ) : (
                      <div className="w-[44px] h-[44px] rounded-[13px] bg-youtube text-surface grid place-items-center font-extrabold text-[14px] shrink-0">
                        ▶
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-[15.5px] truncate">{c.name}</div>
                      <div className="flex gap-[6px] mt-[5px]">
                        <span className="text-[11px] font-bold p-[3px_8px] rounded-[7px] bg-sand text-muted">
                          {c.platform}
                        </span>
                        {fit != null ? (
                          <span
                            className="text-[11px] font-bold p-[3px_8px] rounded-[7px] bg-tint text-accent-ink"
                            title="Fast keyword fit estimate. Add to the campaign for the full score."
                          >
                            ~{fit}% fit
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <p className="text-[13.5px] text-muted leading-[1.5] m-[14px_0_18px] flex-1 line-clamp-3">
                    {c.description || "No description available."}
                  </p>
                  <div className="flex gap-[8px]">
                    {hotlistId ? (
                      <>
                        <span className="flex-1 text-center border-[1.5px] border-accent text-accent text-[13.5px] font-bold p-[10px_0] rounded-[11px]">
                          ★ In hotlist
                        </span>
                        <Link
                          to="/app/creators/$id"
                          params={{ id: hotlistId }}
                          className="flex-1 text-center border-[1.5px] border-border bg-transparent text-[13.5px] font-bold p-[10px_0] rounded-[11px] cursor-pointer ah31"
                        >
                          Profile →
                        </Link>
                      </>
                    ) : (
                      <button
                        onClick={() => addToHotlist(c)}
                        className="flex-1 border-0 bg-accent text-cream text-[13.5px] font-bold p-[11px_0] rounded-[11px] cursor-pointer ah30"
                      >
                        Add to hotlist
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface border-[1.5px] border-border rounded-[24px] p-[44px_32px] text-center max-w-[520px] mx-auto">
            <img
              src="/aspen/empty-discovery.webp"
              alt="A clay telescope on a plinth"
              className="w-[190px] block mx-auto"
              loading="lazy"
            />
            <div className="font-heading font-extrabold text-[22px] tracking-[-0.02em] mt-[6px]">
              Nothing to look at yet
            </div>
            <p className="text-[14.5px] text-muted leading-[1.6] m-[10px_auto_0] max-w-[340px]">
              Describe who you want to reach and Aspen searches YouTube for matching channels.
              Reddit, X and LinkedIn join as they connect.
            </p>

          </div>
        )}
      </DataGate>
    </div>
  );
}
