import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Phase 5A grounding corpus. Collects real language for a campaign — audience
// comments on its hotlist creators' content, creator spoken-word excerpts, and
// conversion-backed phrases from Phase 2 — into ad_corpus. The Authentic Ads
// engine generates ONLY from this material plus the campaign belief doc.
// Everything is DataGate-honest: missing keys mean fewer sources, never
// fabricated rows.

export type AdCorpusRow = {
  id: string;
  kind: "comment" | "transcript" | "conversion_phrase" | "brand_doc";
  source: "youtube" | "reddit" | "affiliate" | "document";
  author: string | null;
  content: string;
  url: string | null;
  metrics: Record<string, number>;
};

export type CollectCorpusResult = {
  inserted: number;
  byKind: Record<string, number>;
  needsYouTubeKey: boolean;
  needsRedditKey: boolean;
  creatorsScanned: number;
};

export const collectAdCorpus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { campaignId: string; organizationId?: string }) => data)
  .handler(async ({ data, context }): Promise<CollectCorpusResult> => {
    if (!data.campaignId) throw new Error("campaignId is required");

    const { data: campaign, error } = await context.supabase
      .from("campaigns")
      .select("id,name,product_description")
      .eq("id", data.campaignId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!campaign) throw new Error("Campaign not found");

    const { data: creators } = await context.supabase
      .from("hotlist")
      .select("id,creator_name,platform,external_id,score")
      .eq("campaign_id", data.campaignId)
      .order("score", { ascending: false, nullsFirst: false })
      .limit(10);

    const keywords = `${campaign.name} ${campaign.product_description ?? ""}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 8);

    const {
      fetchYouTubeComments,
      fetchYouTubeTranscriptExcerpts,
      fetchRedditComments,
    } = await import("@/lib/corpus-sources.server");

    type Item = import("@/lib/corpus-sources.server").CorpusItem & {
      hotlist_id?: string | null;
    };
    const items: Item[] = [];

    // Audience comments + spoken content per YouTube creator.
    const ytCreators = (creators ?? []).filter(
      (c) => (c.platform ?? "").toLowerCase() === "youtube" && c.external_id,
    );
    for (const c of ytCreators.slice(0, 5)) {
      const [comments, transcript] = await Promise.all([
        fetchYouTubeComments(c.external_id as string),
        fetchYouTubeTranscriptExcerpts(c.external_id as string, keywords),
      ]);
      for (const it of [...comments, ...transcript]) items.push({ ...it, hotlist_id: c.id });
    }

    // Reddit audience language about the product/topic.
    const redditQuery = [campaign.name, campaign.product_description?.split(/[.,]/)[0] ?? ""]
      .filter(Boolean)
      .join(" ")
      .slice(0, 120);
    for (const it of await fetchRedditComments(redditQuery)) items.push(it);

    // Conversion-backed phrases from Phase 2 (org-scoped tables).
    if (data.organizationId) {
      const [{ data: daily }, { data: links }] = await Promise.all([
        context.supabase
          .from("affiliate_daily")
          .select("link_id,conversions,revenue_minor")
          .eq("organization_id", data.organizationId),
        context.supabase
          .from("affiliate_links")
          .select("id,slug,label")
          .eq("organization_id", data.organizationId),
      ]);
      const labelOf = new Map((links ?? []).map((l) => [l.id, l.label || l.slug]));
      const perLink = new Map<string, { conversions: number; revenueMinor: number }>();
      for (const row of daily ?? []) {
        if (!row.link_id) continue;
        const acc = perLink.get(row.link_id) ?? { conversions: 0, revenueMinor: 0 };
        acc.conversions += Number(row.conversions);
        acc.revenueMinor += Number(row.revenue_minor);
        perLink.set(row.link_id, acc);
      }
      for (const [id, v] of perLink) {
        if (v.conversions <= 0) continue;
        const label = labelOf.get(id);
        if (!label) continue;
        items.push({
          kind: "conversion_phrase",
          source: "affiliate",
          external_id: id,
          author: null,
          content: label as string,
          url: null,
          metrics: { conversions: v.conversions, revenue_minor: v.revenueMinor },
        });
      }
    }

    // Idempotent upsert; RLS keeps everything owner-scoped.
    const byKind: Record<string, number> = {};
    let inserted = 0;
    for (const it of items) {
      const { error: uErr } = await context.supabase.from("ad_corpus").upsert(
        {
          user_id: context.userId,
          campaign_id: data.campaignId,
          hotlist_id: it.hotlist_id ?? null,
          kind: it.kind,
          source: it.source,
          external_id: it.external_id,
          author: it.author,
          content: it.content,
          url: it.url,
          metrics: it.metrics,
        },
        { onConflict: "user_id,campaign_id,kind,external_id" },
      );
      if (!uErr) {
        inserted += 1;
        byKind[it.kind] = (byKind[it.kind] ?? 0) + 1;
      }
    }

    return {
      inserted,
      byKind,
      needsYouTubeKey: !process.env.YOUTUBE_API_KEY,
      needsRedditKey: !(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_SECRET),
      creatorsScanned: ytCreators.length,
    };
  });

export const listAdCorpus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { campaignId: string }) => data)
  .handler(async ({ data, context }): Promise<AdCorpusRow[]> => {
    if (!data.campaignId) return [];
    const { data: rows, error } = await context.supabase
      .from("ad_corpus")
      .select("id,kind,source,author,content,url,metrics")
      .eq("campaign_id", data.campaignId)
      .order("collected_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);
    return (rows ?? []) as AdCorpusRow[];
  });
