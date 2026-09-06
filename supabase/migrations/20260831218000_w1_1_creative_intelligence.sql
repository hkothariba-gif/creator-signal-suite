-- W1-1 / 4g: governed creative assets, tags, rights, and diversity snapshots.

CREATE TABLE public.brand_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID,
  creator_brand_link_id UUID,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'audio', 'copy', 'document', 'landing_page', 'other')),
  production_mode TEXT NOT NULL DEFAULT 'brand' CHECK (production_mode IN ('brand', 'creator_ugc', 'customer_ugc', 'agency', 'ai_assisted')),
  name TEXT NOT NULL,
  storage_path TEXT,
  external_url TEXT,
  checksum TEXT,
  rights_status TEXT NOT NULL DEFAULT 'unknown' CHECK (rights_status IN ('unknown', 'pending', 'cleared', 'restricted', 'expired')),
  rights_scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  rights_starts_at TIMESTAMPTZ,
  rights_expires_at TIMESTAMPTZ,
  talent_reference TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (storage_path IS NOT NULL OR external_url IS NOT NULL),
  CHECK (rights_expires_at IS NULL OR rights_starts_at IS NULL OR rights_expires_at >= rights_starts_at),
  UNIQUE (organization_id, checksum),
  UNIQUE (organization_id, id),
  CONSTRAINT brand_assets_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT brand_assets_creator_link_org_fk FOREIGN KEY (organization_id, creator_brand_link_id)
    REFERENCES public.creator_brand_links (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.creative_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  brand_asset_id UUID NOT NULL,
  tag_type TEXT NOT NULL CHECK (tag_type IN ('hook', 'format', 'theme', 'audience', 'emotion', 'talent', 'product', 'cta', 'risk', 'custom')),
  tag_value TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('ai', 'human', 'provider', 'import')),
  confidence NUMERIC(5, 4) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  model_version TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, brand_asset_id, tag_type, tag_value, source),
  CONSTRAINT creative_tags_asset_org_fk FOREIGN KEY (organization_id, brand_asset_id)
    REFERENCES public.brand_assets (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE public.diversity_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  dimension TEXT NOT NULL,
  distribution JSONB NOT NULL,
  sample_size INTEGER NOT NULL CHECK (sample_size >= 0),
  methodology_version TEXT NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  UNIQUE (organization_id, campaign_id, period_start, period_end, dimension, methodology_version),
  CONSTRAINT diversity_snapshots_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL
);

CREATE INDEX idx_brand_assets_org_rights ON public.brand_assets (organization_id, rights_status, rights_expires_at);
CREATE INDEX idx_creative_tags_asset ON public.creative_tags (organization_id, brand_asset_id, tag_type);
CREATE INDEX idx_diversity_snapshots_org_period ON public.diversity_snapshots (organization_id, period_end DESC);

DO $w1_1_rls$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['brand_assets', 'creative_tags'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))', 'org_members_select_' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id))', 'org_editors_insert_' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_edit_org(organization_id)) WITH CHECK (public.can_edit_org(organization_id))', 'org_editors_update_' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.can_edit_org(organization_id))', 'org_editors_delete_' || table_name, table_name);
  END LOOP;

  ALTER TABLE public.diversity_snapshots ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.diversity_snapshots FORCE ROW LEVEL SECURITY;
  REVOKE ALL ON public.diversity_snapshots FROM PUBLIC, anon, authenticated;
  GRANT SELECT ON public.diversity_snapshots TO authenticated;
  GRANT ALL ON public.diversity_snapshots TO service_role;
  CREATE POLICY org_members_select_diversity_snapshots ON public.diversity_snapshots
    FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
END
$w1_1_rls$;

