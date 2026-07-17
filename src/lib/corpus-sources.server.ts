// Server only. Phase 5A grounding-corpus fetchers: real audience comments and
// creator spoken content for the campaign's hotlist creators. Every fetcher
// returns [] on any failure or missing key — nothing is fabricated. The
// campaign's own website copy is deliberately NOT a source (it is likely
// already AI-averaged; grounding must come from primary audience language).

export type CorpusItem = {
  kind: "comment" | "transcript" | "conversion_phrase";
  source: "youtube" | "reddit" | "affiliate";
  external_id: string;
  author: string | null;
  content: string;
  url: string | null;
  metrics: Record<string, number>;
};

// ── YouTube: top comments on a creator's recent videos ───────────────────────

export async function fetchYouTubeComments(
  channelId: string,
  maxVideos = 3,
): Promise<CorpusItem[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || !channelId) return [];
  const out: CorpusItem[] = [];
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&type=video&order=date&maxResults=${maxVideos}&key=${key}`,
    );
    if (!searchRes.ok) return [];
    const search = (await searchRes.json()) as {
      items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string } }>;
    };
    for (const item of search.items ?? []) {
      const videoId = item.id?.videoId;
      if (!videoId) continue;
      const cRes = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&order=relevance&maxResults=15&textFormat=plainText&key=${key}`,
      );
      if (!cRes.ok) continue; // comments can be disabled per video
      const threads = (await cRes.json()) as {
        items?: Array<{
          id?: string;
          snippet?: {
            topLevelComment?: {
              snippet?: { textOriginal?: string; authorDisplayName?: string; likeCount?: number };
            };
          };
        }>;
      };
      for (const t of threads.items ?? []) {
        const c = t.snippet?.topLevelComment?.snippet;
        const text = (c?.textOriginal ?? "").trim();
        if (!t.id || !text || text.length < 12) continue;
        out.push({
          kind: "comment",
          source: "youtube",
          external_id: t.id,
          author: c?.authorDisplayName ?? null,
          content: text.slice(0, 1000),
          url: `https://www.youtube.com/watch?v=${videoId}`,
          metrics: { likes: Number(c?.likeCount ?? 0) },
        });
      }
    }
  } catch {
    /* return what we have */
  }
  return out;
}

// ── YouTube: spoken-content excerpts via the public timedtext endpoint ────────
// The official captions API only serves videos the caller owns, so this uses
// the unofficial timedtext route. It frequently returns nothing (ASR-only
// videos, regional differences) — that is fine, it is strictly best-effort and
// the corpus still works from comments alone.

export async function fetchYouTubeTranscriptExcerpts(
  channelId: string,
  keywords: string[],
  maxVideos = 2,
): Promise<CorpusItem[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key || !channelId) return [];
  const out: CorpusItem[] = [];
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&type=video&order=date&maxResults=${maxVideos}&key=${key}`,
    );
    if (!searchRes.ok) return [];
    const search = (await searchRes.json()) as {
      items?: Array<{ id?: { videoId?: string }; snippet?: { channelTitle?: string } }>;
    };
    for (const item of search.items ?? []) {
      const videoId = item.id?.videoId;
      if (!videoId) continue;
      const ttRes = await fetch(
        `https://video.google.com/timedtext?lang=en&v=${encodeURIComponent(videoId)}`,
      );
      if (!ttRes.ok) continue;
      const xml = await ttRes.text();
      if (!xml || !xml.includes("<text")) continue;
      const lines = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)]
        .map((m) =>
          m[1]
            .replace(/&amp;/g, "&")
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter(Boolean);
      if (!lines.length) continue;
      const full = lines.join(" ");
      // Excerpt around keyword hits; fall back to the opening of the video.
      const lower = full.toLowerCase();
      const spots: number[] = [];
      for (const kw of keywords.slice(0, 6)) {
        const i = lower.indexOf(kw.toLowerCase());
        if (i >= 0) spots.push(i);
      }
      if (!spots.length) spots.push(0);
      let n = 0;
      for (const at of spots.slice(0, 2)) {
        const excerpt = full.slice(Math.max(0, at - 60), at + 340).trim();
        if (excerpt.length < 60) continue;
        out.push({
          kind: "transcript",
          source: "youtube",
          external_id: `${videoId}:t${n++}`,
          author: item.snippet?.channelTitle ?? null,
          content: excerpt,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          metrics: {},
        });
      }
    }
  } catch {
    /* best effort */
  }
  return out;
}

// ── Reddit: real comments mentioning the product/topic ───────────────────────

async function redditToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_SECRET;
  if (!id || !secret) return null;
  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "AspenReach/1.0",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { access_token?: string };
    return j.access_token ?? null;
  } catch {
    return null;
  }
}

export async function fetchRedditComments(query: string): Promise<CorpusItem[]> {
  const token = await redditToken();
  if (!token || !query.trim()) return [];
  try {
    const res = await fetch(
      `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&type=comment&sort=top&t=year&limit=25`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": "AspenReach/1.0" } },
    );
    if (!res.ok) return [];
    const j = (await res.json()) as {
      data?: {
        children?: Array<{
          kind: string;
          data?: { id?: string; author?: string; body?: string; permalink?: string; ups?: number };
        }>;
      };
    };
    return (j.data?.children ?? [])
      .filter((c) => c.kind === "t1" && c.data?.id && (c.data?.body ?? "").trim().length >= 20)
      .map((c) => ({
        kind: "comment" as const,
        source: "reddit" as const,
        external_id: c.data!.id!,
        author: c.data?.author ?? null,
        content: (c.data!.body ?? "").slice(0, 1000),
        url: c.data?.permalink ? `https://www.reddit.com${c.data.permalink}` : null,
        metrics: { ups: Number(c.data?.ups ?? 0) },
      }));
  } catch {
    return [];
  }
}
