import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Organic contact discovery. YouTube will not hand us a creator's email, but
// the channel description is available through the Data API and usually lists a
// personal or company website plus social handles. We read that description,
// pull the links, then fetch the site and scan for a mailto: or a contact page.
// Everything found is written to creator_contacts with a confidence and source
// so the brand can see where each address came from. Runs server side so the
// YouTube key never reaches the browser. Paid enrichment (Apollo/Hunter) is a
// later, optional adapter that would slot in here behind its own key.

type Found = {
  channel: "email" | "x" | "reddit" | "linkedin" | "website";
  address: string;
  source: "youtube_description" | "website_crawl" | "hunter" | "apollo";
  confidence: number;
};

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const URL_RE = /https?:\/\/[^\s"'<>)]+/g;

function classifyLink(url: string): Found | null {
  const u = url.toLowerCase();
  if (u.includes("twitter.com/") || u.includes("x.com/")) {
    const handle = url.split(/[?#]/)[0].replace(/\/$/, "").split("/").pop();
    if (handle) return { channel: "x", address: handle, source: "youtube_description", confidence: 0.7 };
  }
  if (u.includes("reddit.com/user/") || u.includes("reddit.com/u/")) {
    const handle = url.split(/[?#]/)[0].replace(/\/$/, "").split("/").pop();
    if (handle) return { channel: "reddit", address: handle, source: "youtube_description", confidence: 0.7 };
  }
  if (u.includes("linkedin.com/in/") || u.includes("linkedin.com/company/")) {
    return { channel: "linkedin", address: url.split(/[?#]/)[0], source: "youtube_description", confidence: 0.7 };
  }
  return null;
}

// A link is a "personal site" candidate if it is not a known social/aggregator.
function isSiteCandidate(url: string): boolean {
  const u = url.toLowerCase();
  return !/(youtube\.com|youtu\.be|twitter\.com|x\.com|reddit\.com|linkedin\.com|instagram\.com|tiktok\.com|facebook\.com|patreon\.com|discord\.|linktr\.ee|beacons\.|t\.co)/.test(
    u,
  );
}

async function fetchYouTubeDescription(channelId: string, key: string): Promise<string | null> {
  try {
    const r = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,brandingSettings&id=${channelId}&key=${key}`,
    );
    if (!r.ok) return null;
    const j = await r.json();
    const item = j.items?.[0];
    const parts = [
      item?.snippet?.description,
      item?.brandingSettings?.channel?.description,
      item?.brandingSettings?.channel?.keywords,
    ].filter(Boolean);
    return parts.join("\n") || null;
  } catch {
    return null;
  }
}

// Fetch a site (and, cheaply, its /contact page) and scrape email addresses.
async function crawlForEmail(siteUrl: string): Promise<string[]> {
  const emails = new Set<string>();
  const targets = [siteUrl];
  try {
    const base = new URL(siteUrl);
    targets.push(new URL("/contact", base).toString());
    targets.push(new URL("/about", base).toString());
  } catch {
    /* ignore malformed */
  }
  for (const t of targets) {
    try {
      const r = await fetch(t, { headers: { "User-Agent": "AspenReach-Discovery/1.0" } });
      if (!r.ok) continue;
      const html = await r.text();
      const mailtos = html.match(/mailto:[^"'>\s]+/gi) ?? [];
      for (const m of mailtos) emails.add(m.replace(/^mailto:/i, "").split("?")[0].toLowerCase());
      for (const e of html.match(EMAIL_RE) ?? []) {
        if (!/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(e)) emails.add(e.toLowerCase());
      }
      if (emails.size) break; // stop at the first page that yields an address
    } catch {
      /* skip unreachable target */
    }
  }
  return Array.from(emails).slice(0, 3);
}

// Phase 4E paid enrichment (dormant until a key is set). Given a creator name
// and a site domain, ask Hunter then Apollo for a verified email. Both are
// optional adapters; organic discovery always runs first.
async function enrichViaProviders(name: string, domain: string): Promise<Found[]> {
  const out: Found[] = [];
  const hunterKey = process.env.HUNTER_API_KEY;
  const apolloKey = process.env.APOLLO_API_KEY;

  if (hunterKey) {
    try {
      const p = new URLSearchParams({ domain, full_name: name, api_key: hunterKey });
      const r = await fetch(`https://api.hunter.io/v2/email-finder?${p}`);
      if (r.ok) {
        const j = (await r.json()) as { data?: { email?: string; score?: number } };
        if (j.data?.email) {
          out.push({
            channel: "email",
            address: j.data.email.toLowerCase(),
            source: "hunter",
            confidence: Math.min(0.95, (j.data.score ?? 70) / 100),
          });
        }
      }
    } catch {
      /* enrichment is best-effort */
    }
  }

  if (!out.length && apolloKey) {
    try {
      const r = await fetch("https://api.apollo.io/api/v1/people/match", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Api-Key": apolloKey },
        body: JSON.stringify({ name, domain, reveal_personal_emails: true }),
      });
      if (r.ok) {
        const j = (await r.json()) as { person?: { email?: string } };
        if (j.person?.email) {
          out.push({
            channel: "email",
            address: j.person.email.toLowerCase(),
            source: "apollo",
            confidence: 0.85,
          });
        }
      }
    } catch {
      /* enrichment is best-effort */
    }
  }
  return out;
}

export const discoverCreatorContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { hotlistId: string }) => data)
  .handler(
    async ({ data, context }): Promise<{ found: number; needsYouTubeKey: boolean }> => {
      if (!data.hotlistId) throw new Error("hotlistId is required");

      const { data: row, error } = await context.supabase
        .from("hotlist")
        .select("id,platform,external_id,profile_data,creator_name")
        .eq("id", data.hotlistId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) throw new Error("Creator not found");

      const key = process.env.YOUTUBE_API_KEY || process.env.YOU_TUBE_API;
      const found: Found[] = [];

      // Start from any links already stored on the profile, then enrich from
      // the live YouTube description when we have a channel id + key.
      let description = "";
      const pd = (row.profile_data ?? {}) as Record<string, unknown>;
      if (typeof pd.description === "string") description += pd.description + "\n";

      const isYouTube = (row.platform ?? "").toLowerCase() === "youtube";
      if (isYouTube && row.external_id && key) {
        const d = await fetchYouTubeDescription(row.external_id, key);
        if (d) description += d;
      }

      const links = Array.from(new Set(description.match(URL_RE) ?? []));
      for (const link of links) {
        const cls = classifyLink(link);
        if (cls) found.push(cls);
      }
      for (const email of description.match(EMAIL_RE) ?? []) {
        found.push({ channel: "email", address: email.toLowerCase(), source: "youtube_description", confidence: 0.8 });
      }

      // Crawl the first personal-site candidate for an email.
      const site = links.find(isSiteCandidate);
      if (site) {
        found.push({ channel: "website", address: site, source: "youtube_description", confidence: 0.6 });
        const emails = await crawlForEmail(site);
        for (const e of emails) {
          found.push({ channel: "email", address: e, source: "website_crawl", confidence: 0.75 });
        }
      }

      // Paid enrichment fallback (4E): only when organic discovery produced no
      // email, a site domain exists to anchor the lookup, and a provider key
      // is configured. Dormant otherwise.
      const hasEmail = found.some((f) => f.channel === "email");
      if (!hasEmail && site && (process.env.HUNTER_API_KEY || process.env.APOLLO_API_KEY)) {
        try {
          const domain = new URL(site).hostname.replace(/^www\./, "");
          const name = (row.creator_name as string) ?? "";
          if (name && domain) found.push(...(await enrichViaProviders(name, domain)));
        } catch {
          /* malformed site URL */
        }
      }

      // Idempotent upsert of everything discovered.
      let inserted = 0;
      for (const f of found) {
        const { error: uErr } = await context.supabase.from("creator_contacts").upsert(
          {
            user_id: context.userId,
            hotlist_id: data.hotlistId,
            channel: f.channel,
            address: f.address,
            source: f.source,
            confidence: f.confidence,
            verified: false,
          },
          { onConflict: "user_id,hotlist_id,channel,address" },
        );
        if (!uErr) inserted += 1;
      }

      return { found: inserted, needsYouTubeKey: isYouTube && !key };
    },
  );
