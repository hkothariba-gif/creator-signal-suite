-- Phase 2 affiliate tracking.
-- First party click capture plus server to server conversion postbacks land in
-- an org scoped event ledger. A daily rollup powers the dashboard. Row level
-- security scopes reads to organization members. Ingestion and rollups run on
-- the service role through edge functions, so authenticated users never write
-- events directly. Reviewers are read only because writes gate on can_edit_org.

-- Enums

DO $$ BEGIN
  CREATE TYPE public.affiliate_provider AS ENUM
    ('impact', 'partnerstack', 'rakuten', 'cj', 'amazon', 'generic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.affiliate_event_type AS ENUM ('click', 'conversion');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sales provider connections. Presence flips the account level "sales"
-- connector to true for the organization. No secret material stored here.

CREATE TABLE IF NOT EXISTS public.affiliate_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider public.affiliate_provider NOT NULL,
  external_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  connected_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_aff_conn_org ON public.affiliate_connections (organization_id);

DROP TRIGGER IF EXISTS update_affiliate_connections_updated_at ON public.affiliate_connections;
CREATE TRIGGER update_affiliate_connections_updated_at BEFORE UPDATE ON public.affiliate_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Affiliate tracking links. A globally unique slug redirects first party
-- through the "r" edge function, which logs a click and forwards to
-- destination_url.

CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  affiliate_id UUID REFERENCES public.affiliates(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  slug TEXT NOT NULL UNIQUE,
  label TEXT,
  destination_url TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aff_links_org ON public.affiliate_links (organization_id);
CREATE INDEX IF NOT EXISTS idx_aff_links_slug ON public.affiliate_links (slug);

DROP TRIGGER IF EXISTS update_affiliate_links_updated_at ON public.affiliate_links;
CREATE TRIGGER update_affiliate_links_updated_at BEFORE UPDATE ON public.affiliate_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event ledger. Idempotent on (organization_id, provider, external_id) so
-- repeated postbacks and redirect retries never double count. Attribution is
-- last click within thirty days: a conversion carries the link_id the network
-- attributed it to, or the first party click_ref the redirect set.

CREATE TABLE IF NOT EXISTS public.affiliate_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  link_id UUID REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  provider public.affiliate_provider NOT NULL DEFAULT 'generic',
  type public.affiliate_event_type NOT NULL,
  external_id TEXT NOT NULL,
  click_ref TEXT,
  revenue_minor BIGINT NOT NULL DEFAULT 0 CHECK (revenue_minor >= 0),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (char_length(currency) = 3),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_aff_events_org ON public.affiliate_events (organization_id);
CREATE INDEX IF NOT EXISTS idx_aff_events_org_link ON public.affiliate_events (organization_id, link_id);
CREATE INDEX IF NOT EXISTS idx_aff_events_org_occurred ON public.affiliate_events (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_aff_events_click_ref ON public.affiliate_events (click_ref);

-- Daily rollup. One row per organization, link, day, currency. Recomputed from
-- the ledger by recompute_affiliate_daily after ingestion and on a schedule.

CREATE TABLE IF NOT EXISTS public.affiliate_daily (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  link_id UUID,
  day DATE NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  clicks BIGINT NOT NULL DEFAULT 0,
  conversions BIGINT NOT NULL DEFAULT 0,
  revenue_minor BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (organization_id, link_id, day, currency)
);

CREATE INDEX IF NOT EXISTS idx_aff_daily_org_day ON public.affiliate_daily (organization_id, day DESC);

-- Rollup function. Rebuilds every daily row for one organization from its
-- events. Security definer so the service role edge function and the daily cron
-- can call it without widening user grants. Unattributed events roll up under
-- the zero uuid bucket because the primary key columns are not nullable.

CREATE OR REPLACE FUNCTION public.recompute_affiliate_daily(p_org UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  DELETE FROM public.affiliate_daily WHERE organization_id = p_org;
  INSERT INTO public.affiliate_daily (organization_id, link_id, day, currency, clicks, conversions, revenue_minor)
  SELECT
    e.organization_id,
    COALESCE(e.link_id, '00000000-0000-0000-0000-000000000000'::uuid),
    (e.occurred_at AT TIME ZONE 'UTC')::date AS day,
    e.currency,
    COUNT(*) FILTER (WHERE e.type = 'click'),
    COUNT(*) FILTER (WHERE e.type = 'conversion'),
    COALESCE(SUM(e.revenue_minor) FILTER (WHERE e.type = 'conversion'), 0)
  FROM public.affiliate_events e
  WHERE e.organization_id = p_org
  GROUP BY e.organization_id, COALESCE(e.link_id, '00000000-0000-0000-0000-000000000000'::uuid),
           (e.occurred_at AT TIME ZONE 'UTC')::date, e.currency;
END;
$fn$;

REVOKE ALL ON FUNCTION public.recompute_affiliate_daily(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.recompute_affiliate_daily(UUID) TO service_role;

-- Row level security

ALTER TABLE public.affiliate_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_daily ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_links TO authenticated;
GRANT SELECT ON public.affiliate_events TO authenticated;
GRANT SELECT ON public.affiliate_daily TO authenticated;
GRANT ALL ON public.affiliate_connections, public.affiliate_links,
             public.affiliate_events, public.affiliate_daily TO service_role;

DROP POLICY IF EXISTS "Members view affiliate connections" ON public.affiliate_connections;
CREATE POLICY "Members view affiliate connections" ON public.affiliate_connections
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
DROP POLICY IF EXISTS "Editors insert affiliate connections" ON public.affiliate_connections;
CREATE POLICY "Editors insert affiliate connections" ON public.affiliate_connections
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_org(organization_id) AND connected_by = auth.uid());
DROP POLICY IF EXISTS "Editors update affiliate connections" ON public.affiliate_connections;
CREATE POLICY "Editors update affiliate connections" ON public.affiliate_connections
  FOR UPDATE TO authenticated
  USING (public.can_edit_org(organization_id))
  WITH CHECK (public.can_edit_org(organization_id));
DROP POLICY IF EXISTS "Editors delete affiliate connections" ON public.affiliate_connections;
CREATE POLICY "Editors delete affiliate connections" ON public.affiliate_connections
  FOR DELETE TO authenticated USING (public.can_edit_org(organization_id));

DROP POLICY IF EXISTS "Members view affiliate links" ON public.affiliate_links;
CREATE POLICY "Members view affiliate links" ON public.affiliate_links
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
DROP POLICY IF EXISTS "Editors insert affiliate links" ON public.affiliate_links;
CREATE POLICY "Editors insert affiliate links" ON public.affiliate_links
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_org(organization_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS "Editors update affiliate links" ON public.affiliate_links;
CREATE POLICY "Editors update affiliate links" ON public.affiliate_links
  FOR UPDATE TO authenticated
  USING (public.can_edit_org(organization_id))
  WITH CHECK (public.can_edit_org(organization_id));
DROP POLICY IF EXISTS "Editors delete affiliate links" ON public.affiliate_links;
CREATE POLICY "Editors delete affiliate links" ON public.affiliate_links
  FOR DELETE TO authenticated USING (public.can_edit_org(organization_id));

DROP POLICY IF EXISTS "Members view affiliate events" ON public.affiliate_events;
CREATE POLICY "Members view affiliate events" ON public.affiliate_events
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
DROP POLICY IF EXISTS "Members view affiliate daily" ON public.affiliate_daily;
CREATE POLICY "Members view affiliate daily" ON public.affiliate_daily
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
