
CREATE TYPE public.affiliate_provider AS ENUM ('stripe', 'shopify', 'paddle', 'lemonsqueezy', 'manual');

CREATE TABLE public.affiliate_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider public.affiliate_provider NOT NULL,
  external_account_id text,
  status text NOT NULL DEFAULT 'active',
  connected_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_connections TO authenticated;
GRANT ALL ON public.affiliate_connections TO service_role;
ALTER TABLE public.affiliate_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read connections" ON public.affiliate_connections FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org editors write connections" ON public.affiliate_connections FOR ALL TO authenticated USING (public.can_edit_org(organization_id)) WITH CHECK (public.can_edit_org(organization_id));
CREATE TRIGGER affiliate_connections_updated BEFORE UPDATE ON public.affiliate_connections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.affiliate_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  label text,
  destination_url text NOT NULL,
  affiliate_id uuid REFERENCES public.affiliates(id) ON DELETE SET NULL,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_links TO authenticated;
GRANT ALL ON public.affiliate_links TO service_role;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read links" ON public.affiliate_links FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "org editors write links" ON public.affiliate_links FOR ALL TO authenticated USING (public.can_edit_org(organization_id)) WITH CHECK (public.can_edit_org(organization_id));
CREATE TRIGGER affiliate_links_updated BEFORE UPDATE ON public.affiliate_links FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.affiliate_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  link_id uuid REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  day date NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  clicks bigint NOT NULL DEFAULT 0,
  conversions bigint NOT NULL DEFAULT 0,
  revenue_minor bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, link_id, day, currency)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_daily TO authenticated;
GRANT ALL ON public.affiliate_daily TO service_role;
ALTER TABLE public.affiliate_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members read daily" ON public.affiliate_daily FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE TRIGGER affiliate_daily_updated BEFORE UPDATE ON public.affiliate_daily FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
