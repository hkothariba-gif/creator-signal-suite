// Affiliate/creator fit scoring. Pure functions, no secrets, safe to import in
// the browser or on the server. Every number is a real computation over the
// data actually available; nothing is fabricated. When a component has no data
// (for example channel stats before a platform key is set) it is left null and
// the overall score re-normalizes across the components that do have data, so a
// missing signal never silently counts as zero.

export type ChannelStats = {
  subscribers?: number | null;
  avgViews?: number | null;
  avgComments?: number | null;
  avgLikes?: number | null;
};

export type ScoreBreakdown = {
  content: number | null;
  channel: number | null;
  comments: number | null;
  alignment: number | null;
  overall: number;
  method: "llm" | "keyword";
  scoredAt: string;
};

// Alignment carries the most weight per the product decision, then content,
// then channel strength, then the comment signal.
export const WEIGHTS = { alignment: 0.4, content: 0.25, channel: 0.2, comments: 0.15 } as const;

const STOP = new Set([
  "the","a","an","and","or","but","for","to","of","in","on","at","by","with","from","as","is",
  "are","was","were","be","been","it","its","this","that","these","those","we","our","you","your",
  "they","their","i","my","he","she","his","her","them","us","not","no","so","do","does","have",
  "has","will","would","can","could","should","about","into","over","than","too","very","just",
  "more","most","some","any","all","new","other","such","up","out","who","what","when","where",
  "how","get","got","like","channel","video","videos","subscribe","official","content","com","www","http","https",
]);

function tokens(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

// Log scaled 0..100 where `full` maps to about 100. Used for follower and view
// counts so a mid tier creator is not dwarfed by an outlier.
function logScore(value: number, full: number): number {
  const v = Math.max(0, value);
  if (v <= 0) return 0;
  return clamp((Math.log10(1 + v) / Math.log10(1 + full)) * 100);
}

// Share of the campaign's meaningful terms that appear in the creator's text.
export function contentRelevance(creatorText: string, campaignText: string): number {
  const want = new Set(tokens(campaignText));
  if (want.size === 0) return 0;
  const have = new Set(tokens(creatorText));
  let hit = 0;
  for (const w of want) if (have.has(w)) hit += 1;
  return clamp((hit / want.size) * 100);
}

// Keyword alignment fallback for when the LLM key is absent: symmetric overlap
// (Jaccard) of the two vocabularies, lifted slightly so partial matches read.
export function alignmentKeyword(creatorText: string, campaignText: string): number {
  const a = new Set(tokens(creatorText));
  const b = new Set(tokens(campaignText));
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  const jaccard = union > 0 ? inter / union : 0;
  return clamp(Math.sqrt(jaccard) * 100);
}

// Channel strength from audience size and typical reach per post.
export function channelStrength(s: ChannelStats): number | null {
  const subs = s.subscribers ?? null;
  const views = s.avgViews ?? null;
  if (subs == null && views == null) return null;
  const parts: number[] = [];
  if (subs != null) parts.push(logScore(subs, 1_000_000));
  if (views != null) parts.push(logScore(views, 500_000));
  return clamp(parts.reduce((a, b) => a + b, 0) / parts.length);
}

// Comment signal from how much conversation the content generates: raw comment
// volume plus an engagement rate against views.
export function commentsSignal(s: ChannelStats): number | null {
  const comments = s.avgComments ?? null;
  const views = s.avgViews ?? null;
  const likes = s.avgLikes ?? null;
  if (comments == null && likes == null) return null;
  const volume = comments != null ? logScore(comments, 5_000) : 0;
  let rate = 0;
  if (views && views > 0) {
    const engaged = (comments ?? 0) + (likes ?? 0);
    rate = clamp((engaged / views) * 1000); // 10% engagement reads as 100
  }
  const parts = [volume, rate].filter((n) => n > 0);
  if (parts.length === 0) return volume;
  return clamp(parts.reduce((a, b) => a + b, 0) / parts.length);
}

// Combine available components with the fixed weights, re-normalizing across
// whichever ones have data so a missing signal is excluded rather than zeroed.
export function combineScores(parts: {
  content: number | null;
  channel: number | null;
  comments: number | null;
  alignment: number | null;
}): number {
  const entries: Array<[number, number]> = [];
  if (parts.alignment != null) entries.push([parts.alignment, WEIGHTS.alignment]);
  if (parts.content != null) entries.push([parts.content, WEIGHTS.content]);
  if (parts.channel != null) entries.push([parts.channel, WEIGHTS.channel]);
  if (parts.comments != null) entries.push([parts.comments, WEIGHTS.comments]);
  if (entries.length === 0) return 0;
  const wsum = entries.reduce((a, [, w]) => a + w, 0);
  const score = entries.reduce((a, [v, w]) => a + v * w, 0) / wsum;
  return clamp(score);
}

// Build the text a creator is scored against from a campaign.
export function campaignText(camp: {
  name?: string | null;
  product_description?: string | null;
  target_audience?: unknown;
  search_criteria?: unknown;
}): string {
  const bits: string[] = [];
  if (camp.name) bits.push(camp.name);
  if (camp.product_description) bits.push(camp.product_description);
  const ta = camp.target_audience as Record<string, unknown> | null;
  if (ta && typeof ta === "object") bits.push(Object.values(ta).filter((v) => typeof v === "string").join(" "));
  const sc = camp.search_criteria as { primaryQuery?: string; searchQueries?: string[] } | null;
  if (sc?.primaryQuery) bits.push(sc.primaryQuery);
  if (Array.isArray(sc?.searchQueries)) bits.push(sc!.searchQueries!.join(" "));
  return bits.join(". ");
}
