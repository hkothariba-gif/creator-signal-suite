// Supabase Edge Function: collect-signals
// Polls live sources for every organization and stores raw signals with the
// service role. Intended to be invoked on a schedule (Supabase cron). Every
// fetcher returns an empty array on any failure or missing key, so nothing is
// fabricated. Access is gated by the service role key or a CRON_SECRET.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type RawSignal = {
  source: "brand24" | "phyllo" | "youtube" | "x" | "reddit" | "trends";
  external_id: string;
  kind: string;
  topic: string | null;
  title: string | null;
  content: string | null;
  author: string | null;
  url: string | null;
  sentiment: string | null;
  metrics: Record<string, number>;
};

const num = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? n : 0;
};

function logFail(
  source: RawSignal["source"],
  stage: string,
  query: string,
  detail: unknown,
): void {
  const msg =
    detail instanceof Response
      ? `HTTP ${detail.status} ${detail.statusText}`
      : detail instanceof Error
      ? detail.message
      : typeof detail === "string"
      ? detail
      : JSON.stringify(detail);
  console.warn(`[collect-signals] ${source}:${stage} failed for "${query}": ${msg}`);
}

async function fetchYouTube(query: string): Promise<RawSignal[]> {
  const key = Deno.env.get("YOUTUBE_API_KEY");
  if (!key) return [];
  try {
    const s = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&maxResults=10&key=${key}`,
    );
    if (!s.ok) return [];
    const search = await s.json();
    const items = (search.items ?? []) as Array<Record<string, any>>;
    const ids = items.map((i) => i?.id?.videoId).filter(Boolean);
    const statsById = new Map<string, Record<string, number>>();
    if (ids.length) {
      const st = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(",")}&key=${key}`,
      );
      if (st.ok) {
        const stats = await st.json();
        for (const v of stats.items ?? []) {
          statsById.set(v.id, {
            views: num(v.statistics?.viewCount),
            likes: num(v.statistics?.likeCount),
            comments: num(v.statistics?.commentCount),
          });
        }
      }
    }
    return items
      .filter((i) => i?.id?.videoId)
      .map((i) => ({
        source: "youtube" as const,
        external_id: i.id.videoId,
        kind: "video",
        topic: query,
        title: i.snippet?.title ?? null,
        content: i.snippet?.description ?? null,
        author: i.snippet?.channelTitle ?? null,
        url: `https://www.youtube.com/watch?v=${i.id.videoId}`,
        sentiment: null,
        metrics: statsById.get(i.id.videoId) ?? {},
      }));
  } catch {
    return [];
  }
}

async function fetchReddit(query: string): Promise<RawSignal[]> {
  const id = Deno.env.get("REDDIT_CLIENT_ID");
  const secret = Deno.env.get("REDDIT_SECRET");
  if (!id || !secret) return [];
  try {
    const tokRes = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "aspenreach/1.0",
      },
      body: "grant_type=client_credentials",
    });
    if (!tokRes.ok) return [];
    const token = (await tokRes.json()).access_token;
    if (!token) return [];
    const res = await fetch(
      `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&sort=top&t=month&limit=15`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": "aspenreach/1.0" } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data?.children ?? [])
      .map((c: any) => c.data)
      .filter((d: any) => d && d.id)
      .map((d: any) => ({
        source: "reddit" as const,
        external_id: String(d.id),
        kind: "post",
        topic: query,
        title: d.title ?? null,
        content: d.selftext ?? null,
        author: d.author ?? null,
        url: d.permalink ? `https://www.reddit.com${d.permalink}` : null,
        sentiment: null,
        metrics: { score: num(d.score), comments: num(d.num_comments), upvote_ratio: num(d.upvote_ratio) },
      }));
  } catch {
    return [];
  }
}

async function fetchX(query: string): Promise<RawSignal[]> {
  const key = Deno.env.get("X_API_KEY");
  const secret = Deno.env.get("X_API_SECRET");
  if (!key || !secret) return [];
  try {
    const tokRes = await fetch("https://api.twitter.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${encodeURIComponent(key)}:${encodeURIComponent(secret)}`)}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: "grant_type=client_credentials",
    });
    if (!tokRes.ok) return [];
    const bearer = (await tokRes.json()).access_token;
    if (!bearer) return [];
    const params = new URLSearchParams({
      query: `${query} -is:retweet lang:en`,
      max_results: "20",
      "tweet.fields": "public_metrics,author_id,created_at",
    });
    const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? []).map((t: any) => ({
      source: "x" as const,
      external_id: t.id,
      kind: "post",
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

async function fetchBrand24(query: string): Promise<RawSignal[]> {
  const key = Deno.env.get("BRAND24_API_KEY");
  if (!key) return [];
  try {
    const pr = await fetch("https://api.brand24.com/v2/projects", {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (!pr.ok) return [];
    const projects = await pr.json();
    const projectId = Array.isArray(projects) ? projects[0]?.id : undefined;
    if (projectId === undefined) return [];
    const mr = await fetch(`https://api.brand24.com/v2/projects/${projectId}/mentions?limit=25`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (!mr.ok) return [];
    const json = await mr.json();
    const sentimentOf = (v: unknown) => {
      const n = num(v);
      return n > 0 ? "positive" : n < 0 ? "negative" : "neutral";
    };
    return (json.results ?? [])
      .filter((m: any) => m.id !== undefined)
      .map((m: any) => ({
        source: "brand24" as const,
        external_id: String(m.id),
        kind: "mention",
        topic: query,
        title: m.title ?? null,
        content: m.snippet ?? m.content ?? null,
        author: m.author ?? null,
        url: m.url ?? null,
        sentiment: sentimentOf(m.sentiment),
        metrics: { reach: num(m.reach), influence: num(m.influence_score) },
      }));
  } catch {
    return [];
  }
}

async function fetchPhyllo(query: string): Promise<RawSignal[]> {
  const id = Deno.env.get("PHYLLO_CLIENT_ID");
  const secret = Deno.env.get("PHYLLO_SECRET");
  if (!id || !secret) return [];
  try {
    const res = await fetch("https://api.insights.getphyllo.com/v1/social/creators/contents/search", {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: query, limit: 15 }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data ?? [])
      .filter((d: any) => d.id !== undefined || d.external_id !== undefined)
      .map((d: any) => ({
        source: "phyllo" as const,
        external_id: String(d.id ?? d.external_id),
        kind: "post",
        topic: query,
        title: d.title ?? null,
        content: d.description ?? null,
        author: d.creator_name ?? null,
        url: d.url ?? null,
        sentiment: null,
        metrics: {
          likes: num(d.engagement?.like_count),
          views: num(d.engagement?.view_count),
          comments: num(d.engagement?.comment_count),
        },
      }));
  } catch {
    return [];
  }
}

async function fetchTrends(query: string): Promise<RawSignal[]> {
  const key = Deno.env.get("TRENDS_API_KEY");
  if (!key) return [];
  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(query)}&data_type=RELATED_QUERIES&api_key=${key}`,
    );
    if (!res.ok) return [];
    const json = await res.json();
    const rows = [...(json.related_queries?.rising ?? []), ...(json.related_queries?.top ?? [])];
    return rows
      .filter((r: any) => typeof r.query === "string")
      .map((r: any, i: number) => ({
        source: "trends" as const,
        external_id: `${query}:${String(r.query)}`.slice(0, 200),
        kind: "trend",
        topic: query,
        title: String(r.query),
        content: null,
        author: null,
        url: r.link ?? null,
        sentiment: null,
        metrics: { value: num(r.value) || rows.length - i, extracted_value: num(r.extracted_value) },
      }));
  } catch {
    return [];
  }
}

async function collectAll(query: string): Promise<RawSignal[]> {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const cronSecret = Deno.env.get("CRON_SECRET");
  const auth = req.headers.get("authorization") ?? "";
  const cronHeader = req.headers.get("x-cron-secret") ?? "";
  const authorized =
    (serviceKey && auth === `Bearer ${serviceKey}`) ||
    (cronSecret && cronHeader === cronSecret);
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = Deno.env.get("SUPABASE_URL");
  if (!url || !serviceKey) {
    return new Response(JSON.stringify({ error: "Supabase not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(url, serviceKey);

  const { data: orgs, error } = await supabase.from("organizations").select("id, name, brand_profile");
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let stored = 0;
  const perOrg: Record<string, number> = {};
  for (const org of orgs ?? []) {
    // Topics come from what the organization already tracks. Distinct stored
    // topics first, then the brand category, then the organization name.
    const { data: topicRows } = await supabase
      .from("signals")
      .select("topic")
      .eq("organization_id", org.id)
      .not("topic", "is", null)
      .limit(100);
    const topics = new Set<string>();
    for (const r of topicRows ?? []) if (r.topic) topics.add(r.topic as string);
    if (topics.size === 0) {
      const category = (org.brand_profile as Record<string, unknown> | null)?.category;
      if (typeof category === "string" && category.trim()) topics.add(category.trim());
      else if (org.name) topics.add(org.name as string);
    }

    for (const topic of [...topics].slice(0, 5)) {
      const raw = await collectAll(topic);
      if (raw.length === 0) continue;
      const rows = raw.map((r) => ({ ...r, organization_id: org.id }));
      const { data: up } = await supabase
        .from("signals")
        .upsert(rows, { onConflict: "organization_id,source,external_id", ignoreDuplicates: false })
        .select("id");
      const n = up?.length ?? 0;
      stored += n;
      perOrg[org.id as string] = (perOrg[org.id as string] ?? 0) + n;
    }
  }

  return new Response(JSON.stringify({ ok: true, stored, organizations: Object.keys(perOrg).length }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
