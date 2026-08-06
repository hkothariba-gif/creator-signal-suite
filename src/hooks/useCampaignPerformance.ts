import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/* Every derived number for one campaign, in one place.
   Per SPEC-spend-and-attribution.md §3.

   Two rules the whole file is built around:

   - Absent is not zero. Every figure is `null` when its inputs are missing, so
     the UI can say "not recorded" instead of printing 0, $0.00 or 0.0x. Only a
     genuinely recorded zero comes back as 0.
   - Money stays in minor units (cents) as bigint-backed numbers until the UI
     formats it. Arithmetic happens before any conversion to display units so
     cents never round twice.

   Divide-by-zero returns null rather than Infinity or NaN. Mixed currencies in
   one campaign are never summed together — the total goes null and the caller
   is told how many currencies it saw. */

export type MoneyTotal = {
  /** Sum in minor units, or null when nothing was recorded or currencies are mixed. */
  minor: number | null;
  /** The single currency the sum is in, or null when mixed / nothing recorded. */
  currency: string | null;
  /** How many distinct currencies appeared. >1 means `minor` is deliberately null. */
  currencyCount: number;
};

export type CampaignPerformance = {
  budget: MoneyTotal;
  spend: MoneyTotal;
  revenue: MoneyTotal;
  /** Conversions across this campaign's affiliate links. Null when no rows. */
  conversions: number | null;
  /** spend / budget, 0–1+. Null unless both are known and budget > 0. */
  budgetUsed: number | null;
  /** revenue / spend. Null unless spend > 0 and revenue is known. */
  roas: number | null;
  /** How many ads have at least one ad_daily row. */
  adsWithSpend: number;
  /** ad_id → spend and cost per conversion, both minor units. */
  perAd: Record<string, { spendMinor: number; cpaMinor: number | null }>;
  /** hotlist_id → clicks and revenue for links attributed to that creator. */
  perCreator: Record<string, { clicks: number; revenueMinor: number }>;
  /** Day-by-day spend and revenue, outer-joined so a spend-only day still plots. */
  series: { day: string; spendMinor: number | null; revenueMinor: number | null }[];
};

// Sums minor-unit rows, keeping currencies apart. A single currency yields a
// real total; more than one yields null and a count, per the spec's "don't
// convert" rule.
function sumMoney(rows: { currency: string | null; minor: number | null }[]): MoneyTotal {
  if (rows.length === 0) return { minor: null, currency: null, currencyCount: 0 };
  const byCurrency = new Map<string, number>();
  for (const r of rows) {
    const c = r.currency ?? "USD";
    byCurrency.set(c, (byCurrency.get(c) ?? 0) + (r.minor ?? 0));
  }
  if (byCurrency.size === 1) {
    const [currency, minor] = [...byCurrency.entries()][0];
    return { minor, currency, currencyCount: 1 };
  }
  return { minor: null, currency: null, currencyCount: byCurrency.size };
}

const ratio = (num: number | null, den: number | null): number | null =>
  num == null || den == null || den <= 0 ? null : num / den;

export function useCampaignPerformance(campaignId: string, orgId: string | undefined) {
  return useQuery({
    queryKey: ["campaign-performance", campaignId, orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<CampaignPerformance> => {
      // Campaign budget is set by the brand, never derived from spend.
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("budget_minor,currency")
        .eq("id", campaignId)
        .maybeSingle();

      // Ads on this campaign, then their recorded daily spend.
      const { data: ads } = await supabase
        .from("ads")
        .select("id")
        .eq("organization_id", orgId!)
        .eq("campaign_id", campaignId);
      const adIds = (ads ?? []).map((a) => a.id);

      const { data: adDaily } = adIds.length
        ? await supabase
            .from("ad_daily")
            .select("ad_id,day,currency,spend_minor")
            .eq("organization_id", orgId!)
            .in("ad_id", adIds)
        : { data: [] as { ad_id: string; day: string; currency: string; spend_minor: number }[] };

      // Affiliate links on this campaign, then their recorded daily revenue.
      const { data: links } = await supabase
        .from("affiliate_links")
        .select("id,hotlist_id")
        .eq("organization_id", orgId!)
        .eq("campaign_id", campaignId);
      const linkIds = (links ?? []).map((l) => l.id);

      const { data: affDaily } = linkIds.length
        ? await supabase
            .from("affiliate_daily")
            .select("link_id,day,currency,clicks,conversions,revenue_minor")
            .eq("organization_id", orgId!)
            .in("link_id", linkIds)
        : {
            data: [] as {
              link_id: string;
              day: string;
              currency: string;
              clicks: number;
              conversions: number;
              revenue_minor: number;
            }[],
          };

      const spendRows = adDaily ?? [];
      const revenueRows = affDaily ?? [];

      const budget: MoneyTotal =
        campaign?.budget_minor == null
          ? { minor: null, currency: campaign?.currency ?? null, currencyCount: 0 }
          : {
              minor: campaign.budget_minor,
              currency: campaign.currency ?? "USD",
              currencyCount: 1,
            };

      const spend = sumMoney(
        spendRows.map((r) => ({ currency: r.currency, minor: r.spend_minor })),
      );
      const revenue = sumMoney(
        revenueRows.map((r) => ({ currency: r.currency, minor: r.revenue_minor })),
      );

      const conversions = revenueRows.length
        ? revenueRows.reduce((n, r) => n + (r.conversions ?? 0), 0)
        : null;

      // Per-ad spend, and CPA against the campaign's conversions. There is no
      // per-ad conversion source — attribution lands on links, not ads — so the
      // spec defines CPA as this ad's spend over the campaign's conversions.
      const perAdSpend = new Map<string, number>();
      for (const r of spendRows) {
        perAdSpend.set(r.ad_id, (perAdSpend.get(r.ad_id) ?? 0) + (r.spend_minor ?? 0));
      }
      const perAd: CampaignPerformance["perAd"] = {};
      for (const [adId, spendMinor] of perAdSpend) {
        perAd[adId] = { spendMinor, cpaMinor: ratio(spendMinor, conversions) };
      }

      // Per-creator clicks and revenue, joined through affiliate_links.hotlist_id.
      // A link with no hotlist_id is unattributed and simply contributes to
      // nobody; so is a link pointing at a hotlist row this reader cannot see.
      const hotlistByLink = new Map<string, string | null>(
        (links ?? []).map((l) => [l.id, l.hotlist_id]),
      );
      const perCreator: CampaignPerformance["perCreator"] = {};
      for (const r of revenueRows) {
        const hotlistId = hotlistByLink.get(r.link_id);
        if (!hotlistId) continue;
        const acc = perCreator[hotlistId] ?? { clicks: 0, revenueMinor: 0 };
        acc.clicks += r.clicks ?? 0;
        acc.revenueMinor += r.revenue_minor ?? 0;
        perCreator[hotlistId] = acc;
      }

      // Spend and revenue by day, outer-joined: a day with spend and no revenue
      // still appears, and vice versa.
      const days = new Map<string, { spendMinor: number | null; revenueMinor: number | null }>();
      for (const r of spendRows) {
        const d = days.get(r.day) ?? { spendMinor: null, revenueMinor: null };
        d.spendMinor = (d.spendMinor ?? 0) + (r.spend_minor ?? 0);
        days.set(r.day, d);
      }
      for (const r of revenueRows) {
        const d = days.get(r.day) ?? { spendMinor: null, revenueMinor: null };
        d.revenueMinor = (d.revenueMinor ?? 0) + (r.revenue_minor ?? 0);
        days.set(r.day, d);
      }
      const series = [...days.entries()]
        .map(([day, v]) => ({ day, ...v }))
        .sort((a, b) => a.day.localeCompare(b.day));

      return {
        budget,
        spend,
        revenue,
        conversions,
        // Only meaningful when both sides are a single, matching currency.
        budgetUsed:
          spend.currency && budget.currency && spend.currency === budget.currency
            ? ratio(spend.minor, budget.minor)
            : null,
        roas:
          revenue.currency && spend.currency && revenue.currency === spend.currency
            ? ratio(revenue.minor, spend.minor)
            : null,
        adsWithSpend: perAdSpend.size,
        perAd,
        perCreator,
        series,
      };
    },
  });
}

/** Minor units → a formatted string. The one place money becomes display text. */
export function formatMoney(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(2)} ${currency}`;
  }
}
