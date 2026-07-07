// Server only. Fetches raw signals from live sources using keys held on the
// server. Every fetcher returns an empty array on any failure or missing key,
// so nothing is fabricated. Top level import is safe only from other .server.ts
// modules or from inside a server handler (dynamic import).

export type RawSignal = {
  source: "brand24" | "phyllo" | "youtube" | "x" | "reddit" | "trends";
  external_id: string;
  kind: "post" | "comment" | "video" | "mention" | "trend";
  topic: string | null;
  title: string | null;
  content: string | null;
  author: string | null;
  url: string | null;
  sentiment: "positive" | "neutral" | "negative" | null;
  metrics: Record<string, number>;
};

const num = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? n : 0;
};

// ── YouTube Data API v3 ──────────────────────────────────────────────────────

async function fetchYouTube(query: string): Promise<RawSignal[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  try {
    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&maxResults=10&key=${key}`,
    );
    if (!searchRes.ok) return [];
    const search = (await searchRes.json()) as {
      items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; description?: string; channelTitle?: string } }>;
    };
    const items = search.items ?? [];
    const ids = items.map((i) => i.id?.videoId).filter((v): v is string => Boolean(v));
    const statsById = new Map<string, Record<string, number>>();
    if (ids.length) {
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(",")}&key=${key}`,
      );
      if (statsRes.ok) {
        const stats = (await statsRes.json()) as {
          items?: Array<{ id?: string; statistics?: Record<string, string> }>;
        };
        for (const s of stats.items ?? []) {
          if (!s.id) continue;
          statsById.set(s.id, {
            views: num(s.statistics?.viewCount),
            likes: num(s.statistics?.likeCount),
            comments: num(s.statistics?.commentCount),
          });
        }
      }
    }
    return items
      .filter((i) => i.id?.videoId)
      .map((i) => ({
        source: "youtube" as const,
        external_id: i.id!.videoId!,
        kind: "video" as const,
        topic: query,
        title: i.snippet?.title ?? null,
        content: i.snippet?.description ?? null,
        author: i.snippet?.channelTitle ?? null,
        url: `https://www.youtube.com/watch?v=${i.id!.videoId}`,
        sentiment: null,
        metrics: statsById.get(i.id!.videoId!) ?? {},
      }));
  } catch {
    return [];
  }
}

// ── Reddit Data API ──────────────────────────────────────────────────────────

async function redditToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID;
  const secret = process.env.REDDIT_SECRET;
  if (!id || !secret) return null;
  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "aspenreach/1.0",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

async function fetchReddit(query: string): Promise<RawSignal[]> {
  const token = await redditToken();
  if (!token) return [];
  try {
    const res = await fetch(
      `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&sort=top&t=month&limit=15`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": "aspenreach/1.0" } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { children?: Array<{ data?: Record<string, unknown> }> };
    };
    return (json.data?.children ?? [])
      .map((c) => c.data)
      .filter((d): d is Record<string, unknown> => Boolean(d && d.id))
      .map((d) => ({
        source: "reddit" as const,
        external_id: String(d.id),
        kind: "post" as const,
        topic: query,
        title: typeof d.title === "string" ? d.title : null,
        content: typeof d.selftext === "string" ? d.selftext : null,
        author: typeof d.author === "string" ? d.author : null,
        url: typeof d.permalink === "string" ? `https://www.reddit.com${d.permalink}` : null,
        sentiment: null,
        metrics: {
          score: num(d.score),
          comments: num(d.num_comments),
          upvote_ratio: num(d.upvote_ratio),
        },
      }));
  } catch {
    return [];
  }
}

// ── X API v2 (app only bearer from consumer key and secret) ──────────────────

async function xBearer(): Promise<string | null> {
  const key = process.env.X_API_KEY;
  const secret = process.env.X_API_SECRET;
  if (!key || !secret) return null;
  try {
    const res = await fetch("https://api.twitter.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${encodeURIComponent(key)}:${encodeURIComponent(secret)}`)}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: "grant_type=client_credentials",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { access_token?: string };
    return json.access_token ?? null;
  } catch {
    return null;
  }
}

async function fetchX(query: string): Promise<RawSignal[]> {
  const bearer = await xBearer();
  if (!bearer) return [];
  try {
    const params = new URLSearchParams({
      query: `${query} -is:retweet lang:en`,
      max_results: "20",
      "tweet.fields": "public_metrics,author_id,created_at",
    });
    const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: Array<{ id: string; text: string; author_id?: string; public_metrics?: Record<string, number> }>;
    };
    return (json.data ?? []).map((t) => ({
      source: "x" as const,
      external_id: t.id,
      kind: "post" as const,
      topic: query,
      title: null,
      content: t.text ?? null,
      author: t.author_id ?? null,
      url: `https://x.com/i/web/status/${t.id}`,
      sentiment: null,
      metrics: {
        likes: num(t.public_metrics?.like_count),
        reposts: num(t.public_metrics?.retweet_count),
        replies: num(t.public_metrics?.reply_count),
        quotes: num(t.public_metrics?.quote_count),
      },
    }));
  } catch {
    return [];
  }
}

// ── Brand24 chatter and sentiment ────────────────────────────────────────────

async function fetchBrand24(query: string): Promise<RawSignal[]> {
  const key = process.env.BRAND24_API_KEY;
  if (!key) return [];
  try {
    const projectsRes = await fetch("https://api.brand24.com/v2/projects", {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (!projectsRes.ok) return [];
    const projects = (await projectsRes.json()) as Array<{ id?: number | string }>;
    const projectId = Array.isArray(projects) ? projects[0]?.id : undefined;
    if (projectId === undefined) return [];
    const mentionsRes = await fetch(
      `https://api.brand24.com/v2/projects/${projectId}/mentions?limit=25`,
      { headers: { Authorization: `Bearer ${key}`, Accept: "application/json" } },
    );
    if (!mentionsRes.ok) return [];
    const json = (await mentionsRes.json()) as {
      results?: Array<Record<string, unknown>>;
    };
    const sentimentOf = (v: unknown): RawSignal["sentiment"] => {
      const n = num(v);
      if (n > 0) return "positive";
      if (n < 0) return "negative";
      return "neutral";
    };
    return (json.results ?? [])
      .filter((m) => m.id !== undefined)
      .map((m) => ({
        source: "brand24" as const,
        external_id: String(m.id),
        kind: "mention" as const,
        topic: query,
        title: typeof m.title === "string" ? m.title : null,
        content: typeof m.snippet === "string" ? m.snippet : typeof m.content === "string" ? m.content : null,
        author: typeof m.author === "string" ? m.author : null,
        url: typeof m.url === "string" ? m.url : null,
        sentiment: sentimentOf(m.sentiment),
        metrics: { reach: num(m.reach), influence: num(m.influence_score) },
      }));
  } catch {
    return [];
  }
}

// ── Phyllo creator content performance ───────────────────────────────────────

async function fetchPhyllo(query: string): Promise<RawSignal[]> {
  const id = process.env.PHYLLO_CLIENT_ID;
  const secret = process.env.PHYLLO_SECRET;
  if (!id || !secret) return [];
  try {
    // Phyllo social listening: creator content search across connected sources.
    const res = await fetch("https://api.insights.getphyllo.com/v1/social/creators/contents/search", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ keyword: query, limit: 15 }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: Array<Record<string, unknown>> };
    return (json.data ?? [])
      .filter((d) => d.id !== undefined || d.external_id !== undefined)
      .map((d) => {
        const engagement = (d.engagement ?? {}) as Record<string, unknown>;
        return {
          source: "phyllo" as const,
          external_id: String(d.id ?? d.external_id),
          kind: "post" as const,
          topic: query,
          title: typeof d.title === "string" ? d.title : null,
          content: typeof d.description === "string" ? d.description : null,
          author: typeof d.creator_name === "string" ? d.creator_name : null,
          url: typeof d.url === "string" ? d.url : null,
          sentiment: null,
          metrics: {
            likes: num(engagement.like_count),
            views: num(engagement.view_count),
            comments: num(engagement.comment_count),
          },
        };
      });
  } catch {
    return [];
  }
}

// ── Trends ───────────────────────────────────────────────────────────────────

async function fetchTrends(query: string): Promise<RawSignal[]> {
  const key = process.env.TRENDS_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(query)}&data_type=RELATED_QUERIES&api_key=${key}`,
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      related_queries?: { rising?: Array<Record<string, unknown>>; top?: Array<Record<string, unknown>> };
    };
    const rows = [
      ...(json.related_queries?.rising ?? []),
      ...(json.related_queries?.top ?? []),
    ];
    return rows
      .filter((r) => typeof r.query === "string")
      .map((r, i) => ({
        source: "trends" as const,
        external_id: `${query}:${String(r.query)}`.slice(0, 200),
        kind: "trend" as const,
        topic: query,
        title: String(r.query),
        content: null,
        author: null,
        url: typeof r.link === "string" ? r.link : null,
        sentiment: null,
        metrics: { value: num(r.value) || (rows.length - i), extracted_value: num(r.extracted_value) },
      }));
  } catch {
    return [];
  }
}

// ── Aggregate ────────────────────────────────────────────────────────────────

export async function collectAllSignals(query: string): Promise<RawSignal[]> {
  const settled = await Promise.allSettled([
    fetchYouTube(query),
    fetchReddit(query),
    fetchX(query),
    fetchBrand24(query),
    fetchPhyllo(query),
    fetchTrends(query),
  ]);
  const out: RawSignal[] = [];
  for (const r of settled) if (r.status === "fulfilled") out.push(...r.value);
  return out;
}
