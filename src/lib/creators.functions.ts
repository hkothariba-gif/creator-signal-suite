import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  campaignText,
  contentRelevance,
  alignmentKeyword,
  channelStrength,
  commentsSignal,
  combineScores,
  type ChannelStats,
  type ScoreBreakdown,
} from "@/lib/scoring";

// Phase 3 scoring engine. Scores every creator on a campaign's hotlist 0..100
// from four factors and stores the result. External data (YouTube stats, LLM
// alignment) is fetched server side so keys never reach the browser. With no
// keys the score is still real, computed from the creator's stored text and the
// campaign brief. Reads and writes go through the caller's own client, so row
// level security keeps everything scoped to the owner.

const num = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? n : 0;
};

// Channel statistics plus recent upload engagement, when a YouTube key exists.
async function fetchYouTubeStats(channelId: string): Promise<ChannelStats | null> {
  const key = process.env.YOUTUBE_API_KEY || process.env.YOU_TUBE_API;
  if (!key) return null;
  try {
    const cr = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,contentDetails&id=${channelId}&key=${key}`,
    );
    if (!cr.ok) return null;
    const cj = await cr.json();
    const stat = cj.items?.[0]?.statistics ?? {};
    const uploads = cj.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    const subscribers = num(stat.subscriberCount);

    let avgViews: number | null = null;
    let avgComments: number | null = null;
    let avgLikes: number | null = null;
    if (uploads) {
      const pr = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploads}&maxResults=8&key=${key}`,
      );
      if (pr.ok) {
        const pj = await pr.json();
        const ids = (pj.items ?? [])
          .map((i: any) => i?.contentDetails?.videoId)
          .filter(Boolean)
          .slice(0, 8);
        if (ids.length) {
          const vr = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(",")}&key=${key}`,
          );
          if (vr.ok) {
            const vj = await vr.json();
            const vids = vj.items ?? [];
            if (vids.length) {
              avgViews = vids.reduce((a: number, v: any) => a + num(v.statistics?.viewCount), 0) / vids.length;
              avgComments = vids.reduce((a: number, v: any) => a + num(v.statistics?.commentCount), 0) / vids.length;
              avgLikes = vids.reduce((a: number, v: any) => a + num(v.statistics?.likeCount), 0) / vids.length;
            }
          }
        }
      }
    }
    return { subscribers, avgViews, avgComments, avgLikes };
  } catch {
    return null;
  }
}

// Ask the LLM for a 0..100 alignment rating. Returns null on any failure so the
// caller falls back to keyword alignment.
async function llmAlignment(creatorText: string, productText: string): Promise<number | null> {
  const key = process.env.LLM_API_KEY;
  if (!key) return null;
  const base = process.env.LLM_API_BASE ?? "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You rate how well a creator fits a product for an affiliate or influencer campaign. " +
              'Return strict JSON only: {"score": number}. Score 0 to 100 where 100 means an ideal ' +
              "audience and topic match and 0 means unrelated. Judge topical and audience fit, not popularity.",
          },
          { role: "user", content: `Creator:\n${creatorText}\n\nProduct and audience:\n${productText}` },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as { score?: unknown };
    const s = num(parsed.score);
    return Math.max(0, Math.min(100, Math.round(s)));
  } catch {
    return null;
  }
}

export type ScoredCreator = ScoreBreakdown & {
  id: string;
  name: string;
  reach: number | null;
};

export const scoreCampaignCreators = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { campaignId: string }) => data)
  .handler(async ({ data, context }): Promise<{ scored: number; results: ScoredCreator[] }> => {
    if (!data.campaignId) throw new Error("campaignId is required");

    const { data: camp, error: cErr } = await context.supabase
      .from("campaigns")
      .select("name,product_description,target_audience,search_criteria")
      .eq("id", data.campaignId)
      .maybeSingle();
    if (cErr) throw new Error(cErr.message);
    if (!camp) throw new Error("Campaign not found");
    const productText = campaignText(camp);

    const { data: rows, error: hErr } = await context.supabase
      .from("hotlist")
      .select("id,creator_name,platform,external_id,profile_data")
      .eq("campaign_id", data.campaignId);
    if (hErr) throw new Error(hErr.message);

    const results: ScoredCreator[] = [];
    for (const r of rows ?? []) {
      const pd = (r.profile_data ?? {}) as Record<string, unknown>;
      let stats = (pd.stats ?? null) as ChannelStats | null;
      if (
        !stats &&
        (r.platform ?? "").toLowerCase() === "youtube" &&
        r.external_id &&
        (process.env.YOUTUBE_API_KEY || process.env.YOU_TUBE_API)
      ) {
        stats = await fetchYouTubeStats(r.external_id);
      }

      const creatorText = [r.creator_name, pd.description].filter(Boolean).join(". ");
      const content = productText ? contentRelevance(creatorText, productText) : null;
      const channel = stats ? channelStrength(stats) : null;
      const comments = stats ? commentsSignal(stats) : null;

      let alignment: number | null = productText ? alignmentKeyword(creatorText, productText) : null;
      let method: "llm" | "keyword" = "keyword";
      if (productText) {
        const a = await llmAlignment(creatorText, productText);
        if (a != null) {
          alignment = a;
          method = "llm";
        }
      }

      const overall = combineScores({ content, channel, comments, alignment });
      const breakdown: ScoreBreakdown = {
        content,
        channel,
        comments,
        alignment,
        overall,
        method,
        scoredAt: new Date().toISOString(),
      };

      const nextProfile = { ...pd, ...(stats ? { stats } : {}), score_breakdown: breakdown };
      await context.supabase
        .from("hotlist")
        .update({ score: overall, profile_data: nextProfile })
        .eq("id", r.id);

      results.push({
        id: r.id,
        name: r.creator_name,
        reach: stats?.subscribers ?? null,
        ...breakdown,
      });
    }

    results.sort((a, b) => b.overall - a.overall);
    return { scored: results.length, results };
  });
