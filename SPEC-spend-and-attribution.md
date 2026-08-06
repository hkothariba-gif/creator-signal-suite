# Spec — unblock spend, return, and per-creator revenue

Three schema changes plus the code that reads them. Written against `main` at
`c6a1992`. Everything here is additive; no existing column changes type in place.

Goal: the campaign detail screen currently says "Spend not tracked yet",
"Not tracked", "Needs spend" and shows deal terms instead of per-creator
performance. After this, those read real numbers, and still degrade to honest
empty states when an org hasn't recorded anything.

Two rules for where numbers come from:

- **Budget is set by the brand.** A number a user types when they create or edit
  a campaign. Never derived.
- **Spend is actual performance.** Recorded per ad, per day, the same shape as
  `affiliate_daily`. Never derived from budget, never estimated from CPM.

---

## 1. Money conventions (read first)

`affiliate_daily.revenue_minor` is a `bigint` in **minor units** (cents), with a
`currency text NOT NULL DEFAULT 'USD'` alongside it. Every money column added
below follows the same convention: `*_minor bigint` + a sibling currency where
the row can differ.

Do not introduce `numeric` or `money` columns, and do not store dollars. The one
place formatting happens is the UI, on read.

`campaigns.budget` is currently free text (`"$24,000"`). It is **not** dropped —
it stays as a legacy display field until every row is migrated and the UI stops
reading it. New numeric column is `budget_minor`.

---

## 2. Migration

One file, `supabase/migrations/<timestamp>_spend_and_attribution.sql`. Use a real
timestamp ahead of `20260720120000`.

### 2a. Campaign budget, numeric

```sql
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS budget_minor bigint,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';

-- Backfill from the free-text column where it parses cleanly.
-- Strips currency symbols, thousands separators and whitespace; ignores
-- anything that isn't a plain amount (e.g. "TBD", "10-15k") and leaves it NULL.
UPDATE public.campaigns
SET budget_minor = (regexp_replace(budget, '[^0-9.]', '', 'g'))::numeric * 100
WHERE budget IS NOT NULL
  AND budget_minor IS NULL
  AND regexp_replace(budget, '[^0-9.]', '', 'g') ~ '^[0-9]+(\.[0-9]{1,2})?$';
```

`budget_minor` stays nullable — a campaign genuinely might not have a budget set,
and that must be distinguishable from a budget of zero.

### 2b. Per-ad daily spend

New table, deliberately mirroring `affiliate_daily` so the two can be joined by
day for a spend-vs-revenue chart.

```sql
CREATE TABLE IF NOT EXISTS public.ad_daily (
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ad_id uuid NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  day date NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  spend_minor bigint NOT NULL DEFAULT 0,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, ad_id, day, currency)
);

CREATE INDEX IF NOT EXISTS idx_ad_daily_org_day
  ON public.ad_daily (organization_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_ad_daily_ad
  ON public.ad_daily (ad_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_daily TO authenticated;
GRANT ALL ON public.ad_daily TO service_role;
ALTER TABLE public.ad_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members read ad spend" ON public.ad_daily
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org editors write ad spend" ON public.ad_daily
  FOR ALL TO authenticated
  USING (public.can_edit_org(organization_id))
  WITH CHECK (public.can_edit_org(organization_id));

CREATE TRIGGER ad_daily_updated BEFORE UPDATE ON public.ad_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

Why daily rather than a single `ads.spend_minor` scalar:

- The campaign detail screen already has a 12-week revenue chart. Spend on the
  same axis is the whole point of ROAS, and a scalar can't be plotted.
- Editors write it directly today (no ad platform is connected yet), and a
  platform sync later can upsert the same rows on the composite key without a
  second migration.

Note `authenticated` gets write access, not just `service_role` — manual entry
has to work before any connector exists.

### 2c. Attribute affiliate links to a hotlist creator

```sql
ALTER TABLE public.affiliate_links
  ADD COLUMN IF NOT EXISTS hotlist_id uuid
    REFERENCES public.hotlist(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_affiliate_links_hotlist
  ON public.affiliate_links (hotlist_id);
```

**Scoping caveat, do not skip.** `affiliate_links` is scoped by
`organization_id`; `hotlist` is scoped by `user_id` and has no
`organization_id` at all. So this FK crosses two different ownership models.
Consequences:

- Reads are safe. A member reads links through the org policy, and joins to
  `hotlist` are separately filtered by `hotlist`'s own owner policy — a creator
  belonging to another user returns no row rather than leaking.
- That means a link can point at a `hotlist` row the *reader* can't see. The UI
  must treat a missing joined creator as "unattributed", not as an error.
- Do **not** try to fix this by adding `organization_id` to `hotlist` in this
  migration. Moving `hotlist` and `campaigns` onto org scoping is a real
  migration with RLS rewrites across outreach, sequences and `ad_corpus`. Log it
  as separate work.

---

## 3. Derived numbers

Put these in one hook, `useCampaignPerformance(campaignId)`, next to the
existing campaign data hooks. Every one returns `null` (not `0`) when its inputs
are absent, so the UI can tell "nothing recorded" from "recorded as zero".

| Number | Source |
| --- | --- |
| Budget | `campaigns.budget_minor` |
| Spend | `sum(ad_daily.spend_minor)` for ads where `ads.campaign_id = $id` |
| Budget used % | `spend / budget`, only when both are non-null and budget > 0 |
| Revenue | `sum(affiliate_daily.revenue_minor)` for links where `affiliate_links.campaign_id = $id` (already implemented) |
| Conversions | `sum(affiliate_daily.conversions)`, same scope (already implemented) |
| Return (ROAS) | `revenue / spend`, only when spend > 0 |
| Per-ad spend | `sum(ad_daily.spend_minor)` grouped by `ad_id` |
| Per-ad CPA | ad spend ÷ conversions on that ad's campaign links; needs both non-zero |
| Per-creator clicks | `sum(affiliate_daily.clicks)` joined via `affiliate_links.hotlist_id` |
| Per-creator revenue | `sum(affiliate_daily.revenue_minor)`, same join |
| Spend vs revenue series | `ad_daily` and `affiliate_daily` grouped by `day`, outer-joined on day so a day with spend and no revenue still plots |

Guard rails:

- Divide-by-zero returns `null`, never `Infinity` or `NaN`.
- Mixed currencies in one campaign: sum per currency and, if more than one
  appears, show the count of currencies rather than a wrong total. Don't convert.
- All sums are bigint; do the arithmetic before converting to display units so
  cents don't round twice.

---

## 4. UI changes

Styling comes from `DESIGN-RULES.md`. Every screen below already exists — these
are replacements for the placeholder strings, not new layouts. Keep the
`.aspen-scope` wrapper.

### `/app/campaigns/$id` — header strip

Currently: `"Spend not tracked yet · budget $24,000"` over an empty track.

- Both present → `"<spend> of <budget> spent"` with the track filled to the
  percentage, orange `#F2542D`. Over 100% fills the whole track and the label
  turns `#F2542D`.
- Budget set, no spend → `"No spend recorded · budget <budget>"`, empty track.
- No budget → `"<spend> spent · no budget set"` with no track at all. Don't draw
  an unfilled bar with nothing to fill against.
- Neither → keep the current honest line.

### `/app/campaigns/$id` — proof band

- **Spend** tile: total, with `"across <n> ads"` beneath. No `ad_daily` rows →
  `"Not recorded"`.
- **Return** tile: `"<n>x"` to one decimal, `"<revenue> from <spend>"` beneath.
  Spend zero or absent → `"Needs spend"` (unchanged).
- Chart gains a second series for spend: revenue stays the filled orange area,
  spend is a `#8A8494` line on the same axis. Legend only appears when both
  series have data.

### `/app/campaigns/$id` — ads list

Each ad's line becomes `"<spend> spent · <cpa> per conversion"`. Ad has no
`ad_daily` rows → omit the line rather than printing zeros.

### `/app/campaigns/$id` — creators list

Rows currently show deal terms from `hotlist.cpm` plus stage. Add the two real
columns: clicks, and revenue right-aligned. A creator with no linked
`affiliate_links` row shows `"No link yet"` in place of both.

### Recording spend

There is no UI to enter spend, so shipping the migration alone leaves the
screens empty. Minimum viable affordance, on the campaign detail ads list:
per-ad, per-day amount entry writing one `ad_daily` row. **Do not design this
yourself** — flag it and it gets designed in the Aspen file first, same as the
last five screens.

### Budget entry

The campaign create/edit drawer's budget field becomes numeric — amount input
plus a currency select defaulting to USD, writing `budget_minor` and `currency`.
Keep reading legacy `budget` text for display only when `budget_minor` is null.

---

## 5. Out of scope

Named so they don't get quietly absorbed:

- **Offer field on `campaigns`.** Still missing; the brief's Offer row keeps
  saying so.
- **Distinct paused / archived states.** Pause and Archive still overload
  `campaigns.status`.
- **Moving `hotlist` / `campaigns` to org scoping.** See 2c.
- **Any ad platform connector.** Spend is manual entry for now.
- **Currency conversion.**

---

## 6. Verification

1. `npx supabase db push`, then regenerate `src/integrations/supabase/types.ts`
   and confirm `ad_daily`, `campaigns.budget_minor`, `affiliate_links.hotlist_id`
   all appear.
2. Confirm the backfill: rows with `budget = '$24,000'` get
   `budget_minor = 2400000`; a row with unparseable text stays null.
3. Typecheck and lint the touched files.
4. In the browser on the seeded test org, check the **empty** path first — every
   new number should read as an honest empty state, not `0`, `$0.00`, `NaN` or
   `Infinity`.
5. Then insert a handful of `ad_daily` rows and one `affiliate_links.hotlist_id`
   link by hand, reload, confirm the populated path, and delete them again.
6. Report which branches were verified by eye and which by construction.
