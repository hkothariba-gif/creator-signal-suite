-- W1-1 / 4i: citations for generated work and executable schema assertions.

CREATE TABLE public.ai_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_area TEXT NOT NULL,
  engine TEXT NOT NULL,
  query_reference TEXT,
  output_type TEXT NOT NULL,
  output_reference TEXT NOT NULL,
  citation_order INTEGER NOT NULL DEFAULT 1 CHECK (citation_order > 0),
  source_type TEXT NOT NULL CHECK (source_type IN ('brand_document', 'brand_asset', 'web', 'provider', 'research', 'user_input', 'internal_data')),
  source_reference TEXT NOT NULL,
  source_title TEXT,
  source_url TEXT,
  source_excerpt TEXT,
  content_hash TEXT,
  retrieved_at TIMESTAMPTZ,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  model_provider TEXT,
  model_name TEXT,
  model_version TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, output_reference, citation_order)
);

CREATE INDEX idx_ai_citations_output
  ON public.ai_citations (organization_id, output_type, output_reference, citation_order);
CREATE INDEX idx_ai_citations_engine_observed
  ON public.ai_citations (organization_id, engine, observed_at DESC);

ALTER TABLE public.ai_citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_citations FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_citations FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ai_citations TO authenticated;
GRANT ALL ON public.ai_citations TO service_role;
CREATE POLICY org_members_select_ai_citations ON public.ai_citations
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));

-- W1-1 closes the historical gap between enabled and forced RLS. Secret tables
-- keep no authenticated policy; existing business tables retain their explicit
-- policies and become owner-bypass resistant.
DO $w1_1_force_existing_rls$
DECLARE
  relation_row RECORD;
BEGIN
  FOR relation_row IN
    SELECT relation.relname
    FROM pg_class relation
    JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relkind IN ('r', 'p')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', relation_row.relname);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', relation_row.relname);
  END LOOP;
END
$w1_1_force_existing_rls$;

-- Fail the migration if a W1-1 business table loses either its tenant key or
-- its RLS enforcement. These are executable acceptance checks, not comments.
DO $w1_1_contract$
DECLARE
  target_table TEXT;
  expected_tables TEXT[] := ARRAY[
    'campaigns', 'hotlist', 'ad_corpus', 'brand_docs', 'creator_contacts',
    'channel_connections', 'outreach_threads', 'outreach_messages',
    'outreach_sequences', 'outreach_sequence_steps', 'sequence_enrollments',
    'visitors', 'identities', 'persons', 'accounts', 'events', 'event_receipts',
    'event_definitions', 'touchpoints', 'conversions', 'channels',
    'attribution_models', 'model_defaults', 'attributions', 'claim_conflicts',
    'tracking_health', 'channel_daily', 'cost_items', 'plan_costs',
    'budget_plans', 'budget_recommendations', 'revenue_recognition',
    'ad_accounts', 'platform_campaigns', 'platform_ad_groups', 'asset_groups',
    'platform_ads', 'keywords', 'audiences', 'platform_sync_log', 'import_jobs',
    'external_campaign_refs', 'journeys', 'journey_steps', 'journey_runs',
    'messages', 'message_sends', 'sending_domains', 'esp_connections',
    'suppressions', 'consents', 'landing_pages', 'creator_brand_links',
    'deliverables', 'review_events', 'threads', 'thread_messages', 'deal_terms',
    'payouts', 'brand_assets', 'creative_tags', 'diversity_snapshots',
    'action_invocations', 'automation_rules', 'approvals', 'ai_citations'
  ];
BEGIN
  FOREACH target_table IN ARRAY expected_tables LOOP
    IF to_regclass(format('public.%I', target_table)) IS NULL THEN
      RAISE EXCEPTION 'W1-1 contract missing table public.%', target_table;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND information_schema.columns.table_name = target_table
        AND column_name = 'organization_id'
        AND is_nullable = 'NO'
    ) THEN
      RAISE EXCEPTION 'W1-1 contract requires non-null organization_id on public.%', target_table;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_class relation
      JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
      WHERE namespace.nspname = 'public'
        AND relation.relname = target_table
        AND relation.relrowsecurity
        AND relation.relforcerowsecurity
    ) THEN
      RAISE EXCEPTION 'W1-1 contract requires enabled and forced RLS on public.%', target_table;
    END IF;
  END LOOP;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
        'ad_accounts', 'platform_campaigns', 'platform_ad_groups', 'asset_groups',
        'platform_ads', 'keywords', 'audiences', 'platform_sync_log',
        'import_jobs', 'external_campaign_refs', 'esp_connections'
      )
      AND lower(column_name) ~ '(access_token|refresh_token|api_key|client_secret|private_key)'
  ) THEN
    RAISE EXCEPTION 'W1-1 provider tables must not contain secret material';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_class relation
    JOIN pg_namespace namespace ON namespace.oid = relation.relnamespace
    WHERE namespace.nspname = 'public'
      AND relation.relkind IN ('r', 'p')
      AND (NOT relation.relrowsecurity OR NOT relation.relforcerowsecurity)
  ) THEN
    RAISE EXCEPTION 'W1-1 requires enabled and forced RLS on every public business table';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organizations organization
    WHERE (SELECT count(*) FROM public.event_definitions definition
      WHERE definition.organization_id = organization.id) < 7
  ) THEN
    RAISE EXCEPTION 'W1-1 default event definitions are incomplete';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.organizations organization
    WHERE (SELECT count(*) FROM public.channels channel_row
      WHERE channel_row.organization_id = organization.id) < 10
  ) THEN
    RAISE EXCEPTION 'W1-1 default channel definitions are incomplete';
  END IF;
END
$w1_1_contract$;
