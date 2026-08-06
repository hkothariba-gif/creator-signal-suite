-- Spend, budget and per-creator attribution.
-- Per SPEC-spend-and-attribution.md. Everything here is additive: no existing
-- column changes type, and campaigns.budget (free text) is left in place as a
-- legacy display field until every row has budget_minor.
--
-- Money convention throughout: *_minor bigint in cents, with a sibling currency
-- column wherever rows can differ. Formatting happens in the UI on read.

-- ── 2a. Campaign budget, numeric ────────────────────────────────────────────

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

-- budget_minor stays nullable on purpose: "no budget set" has to stay
-- distinguishable from "budget of zero".

-- ── 2b. Per-ad daily spend ──────────────────────────────────────────────────
-- Mirrors public.affiliate_daily (composite key, no surrogate id) so the two
-- can be joined by day for a spend-vs-revenue chart. Daily rather than a single
-- ads.spend_minor scalar because a scalar cannot be plotted against the
-- existing 12-week revenue series, and because a platform sync later can upsert
-- these same rows on the composite key without a second migration.

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

-- `authenticated` gets write access, not just service_role: spend is entered by
-- hand until an ad platform connector exists.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_daily TO authenticated;
GRANT ALL ON public.ad_daily TO service_role;
ALTER TABLE public.ad_daily ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org members read ad spend" ON public.ad_daily;
CREATE POLICY "org members read ad spend" ON public.ad_daily
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

DROP POLICY IF EXISTS "org editors write ad spend" ON public.ad_daily;
CREATE POLICY "org editors write ad spend" ON public.ad_daily
  FOR ALL TO authenticated
  USING (public.can_edit_org(organization_id))
  WITH CHECK (public.can_edit_org(organization_id));

DROP TRIGGER IF EXISTS ad_daily_updated ON public.ad_daily;
CREATE TRIGGER ad_daily_updated BEFORE UPDATE ON public.ad_daily
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 2c. Attribute affiliate links to a hotlist creator ──────────────────────
-- Scoping caveat: affiliate_links is org-scoped, hotlist is user-scoped, so this
-- FK crosses two ownership models. Reads stay safe — a join is filtered by
-- hotlist's own owner policy, so another user's creator returns no row rather
-- than leaking — but a link can point at a hotlist row the reader cannot see.
-- The UI treats a missing joined creator as "unattributed", not an error.
-- Moving hotlist/campaigns onto org scoping is separate work; see the spec.

ALTER TABLE public.affiliate_links
  ADD COLUMN IF NOT EXISTS hotlist_id uuid
    REFERENCES public.hotlist(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_affiliate_links_hotlist
  ON public.affiliate_links (hotlist_id);
