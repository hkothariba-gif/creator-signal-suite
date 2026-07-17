// Supabase Edge Function: collect-signals
// Polls live sources for every organization and stores raw signals with the
// service role. Intended to be invoked on a schedule (Supabase cron). Every
// fetcher returns an empty array on any failure or missing key, so nothing is
// fabricated. Access is gated by the service role key or a CRON_SECRET.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SourceName = "brand24" | "phyllo" | "youtube" | "x" | "reddit" | "trends";

type RawSignal = {
  source: SourceName;
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

type FetchStatus = { source: SourceName; ok: boolean; count: number; reason?: string };
type FetchResult = { signals: RawSignal[]; status: FetchStatus };

const num = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) ? n : 0;
};

async function httpFailReason(source: SourceName, stage: string, res: Response): Promise<string> {
  let body = "";
  try {
    body = await res.text();
  } catch {
    // ignore
  }
  console.error(`[${source}] request failed: ${res.status} ${res.statusText}`, body);
  return `${stage} http ${res.status} ${res.statusText}`;
}

function skip(source: SourceName, envVar: string): FetchResult {
  console.warn(`[${source}] skipped: ${envVar} not set`);
  return { signals: [], status: { source, ok: false, count: 0, reason: `skipped: ${envVar} not set` } };
}

function threw(source: SourceName, err: unknown): FetchResult {
  console.error(`[${source}] threw:`, err);
  const reason = err instanceof Error ? `exception: ${err.message}` : "exception";
  return { signals: [], status: { source, ok: false, count: 0, reason } };
}

function ok(source: SourceName, signals: RawSignal[]): FetchResult {
  return { signals, status: { source, ok: true, count: signals.length } };
}

function failed(source: SourceName, reason: string): FetchResult {
  return { signals: [], status: { source, ok: false, count: 0, reason } };
}

async function fetchYouTube(query: string): Promise<FetchResult> {
  const source: SourceName = "youtube";
  const key = Deno.env.get("YOUTUBE_API_KEY");
  if (!key) return skip(source, "YOUTUBE_API_KEY");
  try {
    const s = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&order=viewCount&maxResults=10&key=${key}`,
    );
    if (!s.ok) return failed(source, await httpFailReason(source, "search", s));
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
      } else {
        await httpFailReason(source, "videos", st);
      }
    }
    const signals = items
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
    return ok(source, signals);
  } catch (err) {
    return threw(source, err);
  }
}

async function fetchReddit(query: string): Promise<FetchResult> {
  const source: SourceName = "reddit";
  const id = Deno.env.get("REDDIT_CLIENT_ID");
  const secret = Deno.env.get("REDDIT_SECRET");
  if (!id) return skip(source, "REDDIT_CLIENT_ID");
  if (!secret) return skip(source, "REDDIT_SECRET");
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
    if (!tokRes.ok) return failed(source, await httpFailReason(source, "token", tokRes));
    const token = (await tokRes.json()).access_token;
    if (!token) {
      console.error(`[${source}] request failed: token response missing access_token`);
      return failed(source, "token missing access_token");
    }
    const res = await fetch(
      `https://oauth.reddit.com/search?q=${encodeURIComponent(query)}&sort=top&t=month&limit=15`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": "aspenreach/1.0" } },
    );
    if (!res.ok) return failed(source, await httpFailReason(source, "search", res));
    const json = await res.json();
    const signals = (json.data?.children ?? [])
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
    return ok(source, signals);
  } catch (err) {
    return threw(source, err);
  }
}

async function fetchX(query: string): Promise<FetchResult> {
  const source: SourceName = "x";
  const key = Deno.env.get("X_API_KEY");
  const secret = Deno.env.get("X_API_SECRET");
  if (!key) return skip(source, "X_API_KEY");
  if (!secret) return skip(source, "X_API_SECRET");
  try {
    const tokRes = await fetch("https://api.twitter.com/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${encodeURIComponent(key)}:${encodeURIComponent(secret)}`)}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: "grant_type=client_credentials",
    });
    if (!tokRes.ok) return failed(source, await httpFailReason(source, "token", tokRes));
    const bearer = (await tokRes.json()).access_token;
    if (!bearer) {
      console.error(`[${source}] request failed: token response missing access_token`);
      return failed(source, "token missing access_token");
    }
    const params = new URLSearchParams({
      query: `${query} -is:retweet lang:en`,
      max_results: "20",
      "tweet.fields": "public_metrics,author_id,created_at",
    });
    const res = await fetch(`https://api.twitter.com/2/tweets/search/recent?${params}`, {
      headers: { Authorization: `Bearer ${bearer}` },
    });
    if (!res.ok) return failed(source, await httpFailReason(source, "search", res));
    const json = await res.json();
    const signals = (json.data ?? []).map((t: any) => ({
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
    return ok(source, signals);
  } catch (err) {
    return threw(source, err);
  }
}

async function fetchBrand24(query: string): Promise<FetchResult> {
  const source: SourceName = "brand24";
  const key = Deno.env.get("BRAND24_API_KEY");
  if (!key) return skip(source, "BRAND24_API_KEY");
  try {
    const pr = await fetch("https://api.brand24.com/v2/projects", {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (!pr.ok) return failed(source, await httpFailReason(source, "projects", pr));
    const projects = await pr.json();
    const projectId = Array.isArray(projects) ? projects[0]?.id : undefined;
    if (projectId === undefined) {
      console.error(`[${source}] request failed: no project id in projects response`);
      return failed(source, "no project id");
    }
    const mr = await fetch(`https://api.brand24.com/v2/projects/${projectId}/mentions?limit=25`, {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
    });
    if (!mr.ok) return failed(source, await httpFailReason(source, "mentions", mr));
    const json = await mr.json();
    const sentimentOf = (v: unknown) => {
      const n = num(v);
      return n > 0 ? "positive" : n < 0 ? "negative" : "neutral";
    };
    const signals = (json.results ?? [])
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
    return ok(source, signals);
  } catch (err) {
    return threw(source, err);
  }
}

async function fetchPhyllo(query: string): Promise<FetchResult> {
  const source: SourceName = "phyllo";
  const id = Deno.env.get("PHYLLO_CLIENT_ID");
  const secret = Deno.env.get("PHYLLO_SECRET");
  if (!id) return skip(source, "PHYLLO_CLIENT_ID");
  if (!secret) return skip(source, "PHYLLO_SECRET");
  try {
    const res = await fetch("https://api.insights.getphyllo.com/v1/social/creators/contents/search", {
      method: "POST",
      headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: query, limit: 15 }),
    });
    if (!res.ok) return failed(source, await httpFailReason(source, "search", res));
    const json = await res.json();
    const signals = (json.data ?? [])
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
    return ok(source, signals);
  } catch (err) {
    return threw(source, err);
  }
}

async function fetchTrends(query: string): Promise<FetchResult> {
  const source: SourceName = "trends";
  const key = Deno.env.get("TRENDS_API_KEY");
  if (!key) return skip(source, "TRENDS_API_KEY");
  try {
    const res = await fetch(
      `https://serpapi.com/search.json?engine=google_trends&q=${encodeURIComponent(query)}&data_type=RELATED_QUERIES&api_key=${key}`,
    );
    if (!res.ok) return failed(source, await httpFailReason(source, "search", res));
    const json = await res.json();
    const rows = [...(json.related_queries?.rising ?? []), ...(json.related_queries?.top ?? [])];
    const signals = rows
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
    return ok(source, signals);
  } catch (err) {
    return threw(source, err);
  }
}

async function collectAll(query: string): Promise<{ signals: RawSignal[]; statuses: FetchStatus[] }> {
  const fetchers: Array<{ source: SourceName; run: () => Promise<FetchResult> }> = [
    { source: "youtube", run: () => fetchYouTube(query) },
    { source: "reddit", run: () => fetchReddit(query) },
    { source: "x", run: () => fetchX(query) },
    { source: "brand24", run: () => fetchBrand24(query) },
    { source: "phyllo", run: () => fetchPhyllo(query) },
    { source: "trends", run: () => fetchTrends(query) },
  ];
  const settled = await Promise.allSettled(fetchers.map((f) => f.run()));
  const signals: RawSignal[] = [];
  const statuses: FetchStatus[] = [];
  settled.forEach((r, i) => {
    const source = fetchers[i].source;
    if (r.status === "fulfilled") {
      signals.push(...r.value.signals);
      statuses.push(r.value.status);
    } else {
      console.error(`[${source}] threw:`, r.reason);
      const reason = r.reason instanceof Error ? `exception: ${r.reason.message}` : "exception";
      statuses.push({ source, ok: false, count: 0, reason });
    }
  });
  return { signals, statuses };
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
  // Aggregate per-source status across all orgs/topics: sum counts, keep the
  // first non-empty reason so callers see why a source produced zero rows.
  const summaryMap = new Map<SourceName, FetchStatus>();
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
      const { signals: raw, statuses } = await collectAll(topic);
      for (const st of statuses) {
        const prev = summaryMap.get(st.source);
        if (!prev) {
          summaryMap.set(st.source, { ...st });
        } else {
          prev.count += st.count;
          if (st.ok) prev.ok = true;
          if (!prev.reason && st.reason) prev.reason = st.reason;
        }
      }
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

  const sources = [...summaryMap.values()].map((s) =>
    s.reason && s.ok ? { source: s.source, ok: s.ok, count: s.count } : s,
  );

  return new Response(
    JSON.stringify({ ok: true, stored, organizations: Object.keys(perOrg).length, sources }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
});
