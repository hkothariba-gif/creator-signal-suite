-- W1-1 / 4d: provider-neutral paid-media hierarchy and import control plane.
-- No tokens, refresh tokens, API keys, or client secrets belong in these rows.

CREATE TABLE public.ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (length(provider) > 0),
  external_account_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  currency TEXT CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  timezone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'inaccessible')),
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, external_account_id),
  UNIQUE (organization_id, id)
);

CREATE TABLE public.platform_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ad_account_id UUID NOT NULL,
  campaign_id UUID,
  provider TEXT NOT NULL,
  external_campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  objective TEXT,
  daily_budget_minor BIGINT CHECK (daily_budget_minor IS NULL OR daily_budget_minor >= 0),
  lifetime_budget_minor BIGINT CHECK (lifetime_budget_minor IS NULL OR lifetime_budget_minor >= 0),
  currency TEXT CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, external_campaign_id),
  UNIQUE (organization_id, id),
  CONSTRAINT platform_campaigns_account_org_fk FOREIGN KEY (organization_id, ad_account_id)
    REFERENCES public.ad_accounts (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT platform_campaigns_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.platform_ad_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform_campaign_id UUID NOT NULL,
  provider TEXT NOT NULL,
  external_ad_group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  bid_strategy TEXT,
  bid_minor BIGINT CHECK (bid_minor IS NULL OR bid_minor >= 0),
  targeting JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, external_ad_group_id),
  UNIQUE (organization_id, id),
  CONSTRAINT platform_ad_groups_campaign_org_fk FOREIGN KEY (organization_id, platform_campaign_id)
    REFERENCES public.platform_campaigns (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE public.asset_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform_campaign_id UUID NOT NULL,
  provider TEXT NOT NULL,
  external_asset_group_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, external_asset_group_id),
  UNIQUE (organization_id, id),
  CONSTRAINT asset_groups_campaign_org_fk FOREIGN KEY (organization_id, platform_campaign_id)
    REFERENCES public.platform_campaigns (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE public.platform_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform_campaign_id UUID NOT NULL,
  platform_ad_group_id UUID,
  asset_group_id UUID,
  provider TEXT NOT NULL,
  external_ad_id TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL,
  format TEXT,
  destination_url TEXT,
  creative_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, external_ad_id),
  UNIQUE (organization_id, id),
  CONSTRAINT platform_ads_campaign_org_fk FOREIGN KEY (organization_id, platform_campaign_id)
    REFERENCES public.platform_campaigns (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT platform_ads_ad_group_org_fk FOREIGN KEY (organization_id, platform_ad_group_id)
    REFERENCES public.platform_ad_groups (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT platform_ads_asset_group_org_fk FOREIGN KEY (organization_id, asset_group_id)
    REFERENCES public.asset_groups (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  platform_ad_group_id UUID NOT NULL,
  provider TEXT NOT NULL,
  external_keyword_id TEXT,
  keyword_text TEXT NOT NULL,
  match_type TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  bid_minor BIGINT CHECK (bid_minor IS NULL OR bid_minor >= 0),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, external_keyword_id),
  CONSTRAINT keywords_ad_group_org_fk FOREIGN KEY (organization_id, platform_ad_group_id)
    REFERENCES public.platform_ad_groups (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE public.audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ad_account_id UUID,
  provider TEXT NOT NULL,
  external_audience_id TEXT,
  name TEXT NOT NULL,
  audience_type TEXT,
  size_estimate BIGINT CHECK (size_estimate IS NULL OR size_estimate >= 0),
  definition JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disabled')),
  expires_at TIMESTAMPTZ,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, external_audience_id),
  CONSTRAINT audiences_account_org_fk FOREIGN KEY (organization_id, ad_account_id)
    REFERENCES public.ad_accounts (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  import_domain TEXT NOT NULL CHECK (import_domain IN ('paid', 'affiliate', 'creator', 'retention')),
  idempotency_key TEXT NOT NULL,
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'partial', 'failed', 'cancelled')),
  cursor JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_summary TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, idempotency_key)
);

CREATE TABLE public.platform_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  import_job_id UUID,
  provider TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  external_id TEXT,
  operation TEXT NOT NULL CHECK (operation IN ('discover', 'insert', 'update', 'skip', 'error')),
  status TEXT NOT NULL CHECK (status IN ('success', 'warning', 'failure')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT platform_sync_log_job_org_fk FOREIGN KEY (organization_id, import_job_id)
    REFERENCES public.import_jobs (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.external_campaign_refs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID,
  provider TEXT NOT NULL,
  import_domain TEXT NOT NULL CHECK (import_domain IN ('paid', 'affiliate', 'creator', 'retention')),
  external_account_id TEXT,
  external_campaign_id TEXT NOT NULL,
  external_name TEXT,
  ownership_mode TEXT NOT NULL DEFAULT 'read_only' CHECK (ownership_mode IN ('read_only', 'adopted')),
  adopted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  adopted_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, import_domain, external_campaign_id),
  CONSTRAINT external_campaign_refs_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL
);

CREATE INDEX idx_platform_campaigns_org_account ON public.platform_campaigns (organization_id, ad_account_id, status);
CREATE INDEX idx_platform_ad_groups_parent_status ON public.platform_ad_groups (organization_id, platform_campaign_id, status, last_synced_at DESC);
CREATE INDEX idx_asset_groups_parent_status ON public.asset_groups (organization_id, platform_campaign_id, status, last_synced_at DESC);
CREATE INDEX idx_platform_ads_org_campaign ON public.platform_ads (organization_id, platform_campaign_id, status);
CREATE INDEX idx_keywords_parent_status ON public.keywords (organization_id, platform_ad_group_id, status, last_synced_at DESC);
CREATE INDEX idx_audiences_org_status_expiry ON public.audiences (organization_id, status, expires_at);
CREATE INDEX idx_import_jobs_org_status ON public.import_jobs (organization_id, status, created_at DESC);
CREATE INDEX idx_platform_sync_log_job ON public.platform_sync_log (organization_id, import_job_id, occurred_at DESC);
CREATE INDEX idx_platform_sync_log_provider_time ON public.platform_sync_log (organization_id, provider, occurred_at DESC);

CREATE VIEW public.platform_sync_log_redacted
WITH (security_barrier = true)
AS
SELECT organization_id, id, import_job_id, provider, entity_type, external_id,
  operation, status, occurred_at
FROM public.platform_sync_log
WHERE public.is_org_member(organization_id);

REVOKE ALL ON public.platform_sync_log_redacted FROM PUBLIC, anon;
GRANT SELECT ON public.platform_sync_log_redacted TO authenticated;

DO $w1_1_rls$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'ad_accounts', 'platform_campaigns', 'platform_ad_groups', 'asset_groups',
    'platform_ads', 'keywords', 'audiences', 'external_campaign_refs'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))', 'org_members_select_' || table_name, table_name);
  END LOOP;

  ALTER TABLE public.platform_sync_log ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.platform_sync_log FORCE ROW LEVEL SECURITY;
  REVOKE ALL ON public.platform_sync_log FROM PUBLIC, anon, authenticated;
  GRANT ALL ON public.platform_sync_log TO service_role;

  -- Adoption is a registered confirmed action; authenticated clients receive
  -- no direct UPDATE grant on the external reference.

  ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.import_jobs FORCE ROW LEVEL SECURITY;
  REVOKE ALL ON public.import_jobs FROM PUBLIC, anon, authenticated;
  GRANT SELECT, INSERT ON public.import_jobs TO authenticated;
  GRANT ALL ON public.import_jobs TO service_role;
  CREATE POLICY org_members_select_import_jobs ON public.import_jobs
    FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
  CREATE POLICY org_editors_request_import_jobs ON public.import_jobs
    FOR INSERT TO authenticated
    WITH CHECK (public.can_edit_org(organization_id) AND requested_by = auth.uid() AND status = 'queued');
END
$w1_1_rls$;
