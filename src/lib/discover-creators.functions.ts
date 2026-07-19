import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Populates a campaign's hotlist with YouTube channels found via the
// campaign's stored search_criteria. Server side so the API key stays secret.

type SearchCriteria = {
  primaryQuery?: string;
  searchQueries?: string[];
  keywords?: string[];
};

export type SourceStatus = {
  source: string;
  ok: boolean;
  count: number;
  reason?: string;
};

async function searchChannels(
  query: string,
  key: string,
): Promise<{
  status: SourceStatus;
  items: Array<{ id: string; name: string; description: string; thumbnail?: string }>;
}> {
  const source = `youtube:${query}`;
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=10&key=${key}`;
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        status: { source, ok: false, count: 0, reason: `HTTP ${res.status}: ${body.slice(0, 160)}` },
        items: [],
      };
    }
    const json = (await res.json()) as {
      items?: Array<{
        id: { channelId: string };
        snippet: { channelTitle: string; description: string; thumbnails?: { default?: { url?: string } } };
      }>;
    };
    const items = (json.items ?? []).map((i) => ({
      id: i.id.channelId,
      name: i.snippet.channelTitle,
      description: i.snippet.description,
      thumbnail: i.snippet.thumbnails?.default?.url,
    }));
    return {
      status: { source, ok: true, count: items.length, reason: items.length === 0 ? "no results" : undefined },
      items,
    };
  } catch (err) {
    return {
      status: { source, ok: false, count: 0, reason: err instanceof Error ? err.message : "unknown error" },
      items: [],
    };
  }
}

export const findCreatorsForCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { campaignId: string }) => data)
  .handler(async ({ data, context }) => {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) throw new Error("YOUTUBE_API_KEY is not configured on the server");

    const { data: camp, error: cErr } = await context.supabase
      .from("campaigns")
      .select("id,name,product_description,search_criteria")
      .eq("id", data.campaignId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!camp) throw new Error("Campaign not found");

    const sc = (camp.search_criteria ?? {}) as SearchCriteria;
    const queries = Array.from(
      new Set(
        [sc.primaryQuery, ...(sc.searchQueries ?? []), ...(sc.keywords ?? []).slice(0, 3), camp.product_description]
          .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
          .map((q) => q.trim()),
      ),
    ).slice(0, 5);

    const sources: SourceStatus[] = [];

    if (queries.length === 0) {
      return {
        added: 0,
        skipped: 0,
        total: 0,
        sources: [{ source: "youtube", ok: false, count: 0, reason: "campaign has no search criteria yet" }],
        ranAt: new Date().toISOString(),
      };
    }

    const seen = new Map<string, { id: string; name: string; description: string; thumbnail?: string }>();
    for (const q of queries) {
      const { status, items } = await searchChannels(q, key);
      sources.push(status);
      for (const c of items) if (!seen.has(c.id)) seen.set(c.id, c);
    }

    const candidates = Array.from(seen.values());
    if (candidates.length === 0) {
      return { added: 0, skipped: 0, total: 0, sources, ranAt: new Date().toISOString() };
    }

    const { data: existing } = await context.supabase
      .from("hotlist")
      .select("external_id")
      .eq("user_id", context.userId)
      .in(
        "external_id",
        candidates.map((c) => c.id),
      );
    const existingIds = new Set((existing ?? []).map((e) => e.external_id));

    const toInsert = candidates
      .filter((c) => !existingIds.has(c.id))
      .map((c) => ({
        user_id: context.userId,
        creator_name: c.name,
        avatar_url: c.thumbnail ?? null,
        external_id: c.id,
        source: "youtube_api",
        platform: "YouTube",
        stage: "saved",
        campaign_id: camp.id,
        profile_data: { description: c.description, thumbnail: c.thumbnail },
      }));

    if (toInsert.length > 0) {
      const { error: iErr } = await context.supabase.from("hotlist").insert(toInsert);
      if (iErr) throw new Error(iErr.message);
    }

    return {
      added: toInsert.length,
      skipped: existingIds.size,
      total: candidates.length,
      sources,
      ranAt: new Date().toISOString(),
    };
  });
