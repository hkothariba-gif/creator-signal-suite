import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

// Phase 2 affiliate tracking server functions. Reads rely on row level security
// through the caller's own Supabase client. Writes verify the caller can edit
// the organization, so reviewers cannot mutate. Event ingestion and daily
// rollups run on the service role in edge functions, never here.

type Provider = Database["public"]["Enums"]["affiliate_provider"];

async function assertCanEdit(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("can_edit_org", { org: organizationId });
  if (error || data !== true) throw new Error("Forbidden: editor access required");
}

// The first party redirect edge function serves this path and logs a click
// before forwarding to the destination.
function trackingUrl(slug: string): string {
  const base = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  return base ? `${base}/functions/v1/r/${slug}` : `/functions/v1/r/${slug}`;
}

const SLUG_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function makeSlug(len = 8): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += SLUG_ALPHABET[b % SLUG_ALPHABET.length];
  return out;
}

// ── Account connections ──────────────────────────────────────────────────────

export type AccountConnections = { sales: boolean; providers: Provider[] };

// Derives the account level sales connection from the organization's active
// affiliate connections. getConnectorStatus stays env only; this adds the org
// scoped view the affiliate dashboard gates on.
export const getAccountConnections = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { organizationId: string }) => data)
  .handler(async ({ data, context }): Promise<AccountConnections> => {
    if (!data.organizationId) throw new Error("organizationId is required");
    const { data: rows, error } = await context.supabase
      .from("affiliate_connections")
      .select("provider,status")
      .eq("organization_id", data.organizationId)
      .eq("status", "active");
    if (error) throw new Error(error.message);
    const providers = (rows ?? []).map((r) => r.provider as Provider);
    return { sales: providers.length > 0, providers };
  });

export const connectSalesProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { organizationId: string; provider: Provider; externalAccountId?: string }) => data,
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (!data.organizationId || !data.provider) {
      throw new Error("organizationId and provider are required");
    }
    await assertCanEdit(context.supabase, data.organizationId);
    const { error } = await context.supabase
      .from("affiliate_connections")
      .upsert(
        {
          organization_id: data.organizationId,
          provider: data.provider,
          external_account_id: data.externalAccountId ?? null,
          status: "active",
          connected_by: context.userId,
        },
        { onConflict: "organization_id,provider" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const disconnectSalesProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { organizationId: string; provider: Provider }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    if (!data.organizationId || !data.provider) {
      throw new Error("organizationId and provider are required");
    }
    await assertCanEdit(context.supabase, data.organizationId);
    const { error } = await context.supabase
      .from("affiliate_connections")
      .update({ status: "revoked" })
      .eq("organization_id", data.organizationId)
      .eq("provider", data.provider);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── Tracking links ───────────────────────────────────────────────────────────

export type AffiliateLink = {
  id: string;
  slug: string;
  label: string | null;
  destinationUrl: string;
  trackingUrl: string;
  affiliateId: string | null;
  campaignId: string | null;
  createdAt: string;
};

export const createAffiliateLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      organizationId: string;
      destinationUrl: string;
      label?: string;
      affiliateId?: string;
      campaignId?: string;
    }) => data,
  )
  .handler(async ({ data, context }): Promise<AffiliateLink> => {
    const dest = data.destinationUrl?.trim();
    if (!data.organizationId || !dest) {
      throw new Error("organizationId and destinationUrl are required");
    }
    try {
      const u = new URL(dest);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad protocol");
    } catch {
      throw new Error("destinationUrl must be a valid http or https URL");
    }
    await assertCanEdit(context.supabase, data.organizationId);

    // Retry on the rare slug collision the unique constraint would reject.
    let lastError = "could not create link";
    for (let attempt = 0; attempt < 5; attempt++) {
      const slug = makeSlug();
      const { data: row, error } = await context.supabase
        .from("affiliate_links")
        .insert({
          organization_id: data.organizationId,
          destination_url: dest,
          label: data.label?.trim() || null,
          affiliate_id: data.affiliateId ?? null,
          campaign_id: data.campaignId ?? null,
          slug,
          created_by: context.userId,
        })
        .select("id,slug,label,destination_url,affiliate_id,campaign_id,created_at")
        .single();
      if (!error && row) {
        return {
          id: row.id,
          slug: row.slug,
          label: row.label,
          destinationUrl: row.destination_url,
          trackingUrl: trackingUrl(row.slug),
          affiliateId: row.affiliate_id,
          campaignId: row.campaign_id,
          createdAt: row.created_at,
        };
      }
      lastError = error?.message ?? lastError;
      if (error && !/duplicate key|unique/i.test(error.message)) break;
    }
    throw new Error(lastError);
  });

export const listAffiliateLinks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { organizationId: string }) => data)
  .handler(async ({ data, context }): Promise<AffiliateLink[]> => {
    if (!data.organizationId) throw new Error("organizationId is required");
    const { data: rows, error } = await context.supabase
      .from("affiliate_links")
      .select("id,slug,label,destination_url,affiliate_id,campaign_id,created_at")
      .eq("organization_id", data.organizationId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      label: row.label,
      destinationUrl: row.destination_url,
      trackingUrl: trackingUrl(row.slug),
      affiliateId: row.affiliate_id,
      campaignId: row.campaign_id,
      createdAt: row.created_at,
    }));
  });

// ── Performance ──────────────────────────────────────────────────────────────

export type LinkPerformance = {
  linkId: string | null;
  label: string;
  slug: string | null;
  clicks: number;
  conversions: number;
  revenueMinor: number;
  conversionRate: number;
};

export type AffiliatePerformance = {
  currency: string;
  totals: { clicks: number; conversions: number; revenueMinor: number; conversionRate: number };
  byLink: LinkPerformance[];
  daily: { day: string; clicks: number; conversions: number; revenueMinor: number }[];
  hasData: boolean;
};

const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

// Reads the daily rollup under row level security, then shapes totals, a per
// link breakdown, and a daily series. Revenue is reported in the dominant
// currency; clicks and conversions sum across all currencies.
export const getAffiliatePerformance = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { organizationId: string }) => data)
  .handler(async ({ data, context }): Promise<AffiliatePerformance> => {
    if (!data.organizationId) throw new Error("organizationId is required");

    const { data: rows, error } = await context.supabase
      .from("affiliate_daily")
      .select("link_id,day,currency,clicks,conversions,revenue_minor")
      .eq("organization_id", data.organizationId);
    if (error) throw new Error(error.message);

    const { data: links } = await context.supabase
      .from("affiliate_links")
      .select("id,slug,label")
      .eq("organization_id", data.organizationId);
    const linkMap = new Map((links ?? []).map((l) => [l.id, l]));

    const daily = rows ?? [];
    // Dominant currency: the one carrying the most conversion revenue.
    const revByCurrency = new Map<string, number>();
    for (const r of daily) revByCurrency.set(r.currency, (revByCurrency.get(r.currency) ?? 0) + Number(r.revenue_minor));
    let currency = "USD";
    let top = -1;
    for (const [c, v] of revByCurrency) if (v > top) { top = v; currency = c; }

    let clicks = 0, conversions = 0, revenueMinor = 0;
    const perLink = new Map<string, LinkPerformance>();
    const perDay = new Map<string, { day: string; clicks: number; conversions: number; revenueMinor: number }>();

    for (const r of daily) {
      clicks += Number(r.clicks);
      conversions += Number(r.conversions);
      if (r.currency === currency) revenueMinor += Number(r.revenue_minor);

      const key = r.link_id ?? ZERO_UUID;
      const link = key !== ZERO_UUID ? linkMap.get(key) : undefined;
      const cur = perLink.get(key) ?? {
        linkId: key === ZERO_UUID ? null : key,
        label: link?.label ?? (key === ZERO_UUID ? "Unattributed" : "Link"),
        slug: link?.slug ?? null,
        clicks: 0,
        conversions: 0,
        revenueMinor: 0,
        conversionRate: 0,
      };
      cur.clicks += Number(r.clicks);
      cur.conversions += Number(r.conversions);
      if (r.currency === currency) cur.revenueMinor += Number(r.revenue_minor);
      perLink.set(key, cur);

      const d = perDay.get(r.day) ?? { day: r.day, clicks: 0, conversions: 0, revenueMinor: 0 };
      d.clicks += Number(r.clicks);
      d.conversions += Number(r.conversions);
      if (r.currency === currency) d.revenueMinor += Number(r.revenue_minor);
      perDay.set(r.day, d);
    }

    const byLink = [...perLink.values()]
      .map((l) => ({ ...l, conversionRate: l.clicks > 0 ? l.conversions / l.clicks : 0 }))
      .sort((a, b) => b.revenueMinor - a.revenueMinor || b.clicks - a.clicks);

    return {
      currency,
      totals: {
        clicks,
        conversions,
        revenueMinor,
        conversionRate: clicks > 0 ? conversions / clicks : 0,
      },
      byLink,
      daily: [...perDay.values()].sort((a, b) => a.day.localeCompare(b.day)),
      hasData: daily.length > 0,
    };
  });
