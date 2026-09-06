-- W1-1 / 4a preflight: inventory legacy owner-scoped rows before org backfill.
--
-- This migration is intentionally non-destructive. A later migration refuses
-- to continue while an owner maps to zero or multiple organizations, so Aspen
-- never guesses which customer owns a business row.

CREATE TABLE IF NOT EXISTS public.ownership_backfill_quarantine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_table TEXT NOT NULL,
  entity_id UUID NOT NULL,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  organization_count INTEGER NOT NULL CHECK (organization_count >= 0),
  reason TEXT NOT NULL CHECK (reason IN ('no_organization', 'multiple_organizations', 'parent_organization_mismatch')),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  UNIQUE (entity_table, entity_id)
);

ALTER TABLE public.ownership_backfill_quarantine ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ownership_backfill_quarantine FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.ownership_backfill_quarantine FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.ownership_backfill_quarantine TO service_role;

CREATE OR REPLACE FUNCTION public.resolve_single_org_for_user(subject_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (array_agg(organization_id))[1]
  FROM public.organization_members
  WHERE user_id = subject_user_id
  HAVING count(*) = 1;
$$;

REVOKE EXECUTE ON FUNCTION public.resolve_single_org_for_user(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_single_org_for_user(UUID) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS idx_ownership_quarantine_unresolved
  ON public.ownership_backfill_quarantine (entity_table, owner_user_id)
  WHERE resolved_at IS NULL;

DO $w1_1_preflight$
DECLARE
  target_table TEXT;
  relationship_spec TEXT;
  child_table TEXT;
  child_foreign_key TEXT;
  parent_table TEXT;
  membership_expression TEXT := '(SELECT count(*) FROM public.organization_members om WHERE om.user_id = row_data.user_id)';
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'campaigns',
    'hotlist',
    'ad_corpus',
    'brand_docs',
    'creator_contacts',
    'channel_connections',
    'outreach_threads',
    'outreach_messages',
    'outreach_sequences',
    'outreach_sequence_steps',
    'sequence_enrollments'
  ] LOOP
    IF to_regclass(format('public.%I', target_table)) IS NULL THEN
      RAISE EXCEPTION 'W1-1 expected legacy table public.% to exist', target_table;
    END IF;

    EXECUTE format($sql$
      INSERT INTO public.ownership_backfill_quarantine (
        entity_table,
        entity_id,
        owner_user_id,
        organization_count,
        reason
      )
      SELECT
        %L,
        row_data.id,
        row_data.user_id,
        %s,
        CASE WHEN %s = 0 THEN 'no_organization' ELSE 'multiple_organizations' END
      FROM public.%I row_data
      WHERE %s <> 1
      ON CONFLICT (entity_table, entity_id) DO UPDATE SET
        owner_user_id = EXCLUDED.owner_user_id,
        organization_count = EXCLUDED.organization_count,
        reason = EXCLUDED.reason,
        discovered_at = now(),
        resolved_at = NULL,
        resolution_note = NULL
    $sql$, target_table, membership_expression, membership_expression, target_table, membership_expression);

    EXECUTE format($sql$
      UPDATE public.ownership_backfill_quarantine quarantine
      SET resolved_at = now(),
          resolution_note = 'Owner now maps to exactly one organization'
      FROM public.%I row_data
      WHERE quarantine.entity_table = %L
        AND quarantine.entity_id = row_data.id
        AND quarantine.resolved_at IS NULL
        AND (SELECT count(*) FROM public.organization_members om WHERE om.user_id = row_data.user_id) = 1
    $sql$, target_table, target_table);
  END LOOP;

  -- A child and parent can each map unambiguously yet map to different orgs.
  -- Inventory that cross-tenant relationship before composite FKs are added.
  FOREACH relationship_spec IN ARRAY ARRAY[
    'hotlist,campaign_id,campaigns',
    'ad_corpus,campaign_id,campaigns',
    'ad_corpus,hotlist_id,hotlist',
    'brand_docs,campaign_id,campaigns',
    'creator_contacts,hotlist_id,hotlist',
    'outreach_threads,campaign_id,campaigns',
    'outreach_threads,hotlist_id,hotlist',
    'outreach_messages,thread_id,outreach_threads',
    'outreach_sequences,campaign_id,campaigns',
    'outreach_sequence_steps,sequence_id,outreach_sequences',
    'sequence_enrollments,sequence_id,outreach_sequences',
    'sequence_enrollments,hotlist_id,hotlist',
    'sequence_enrollments,thread_id,outreach_threads'
  ] LOOP
    child_table := split_part(relationship_spec, ',', 1);
    child_foreign_key := split_part(relationship_spec, ',', 2);
    parent_table := split_part(relationship_spec, ',', 3);

    EXECUTE format($sql$
      INSERT INTO public.ownership_backfill_quarantine (
        entity_table, entity_id, owner_user_id, organization_count, reason
      )
      SELECT %L, child_row.id, child_row.user_id, 1, 'parent_organization_mismatch'
      FROM public.%I child_row
      JOIN public.%I parent_row ON parent_row.id = child_row.%I
      WHERE public.resolve_single_org_for_user(child_row.user_id)
        IS DISTINCT FROM public.resolve_single_org_for_user(parent_row.user_id)
      ON CONFLICT (entity_table, entity_id) DO UPDATE SET
        owner_user_id = EXCLUDED.owner_user_id,
        organization_count = EXCLUDED.organization_count,
        reason = EXCLUDED.reason,
        discovered_at = now(),
        resolved_at = NULL,
        resolution_note = NULL
    $sql$, child_table, child_table, parent_table, child_foreign_key);
  END LOOP;

  INSERT INTO public.ownership_backfill_quarantine (
    entity_table, entity_id, owner_user_id, organization_count, reason
  )
  SELECT 'affiliate_links', link.id, link.created_by, 1, 'parent_organization_mismatch'
  FROM public.affiliate_links link
  JOIN public.hotlist hotlist_row ON hotlist_row.id = link.hotlist_id
  WHERE link.organization_id IS DISTINCT FROM public.resolve_single_org_for_user(hotlist_row.user_id)
  ON CONFLICT (entity_table, entity_id) DO UPDATE SET
    owner_user_id = EXCLUDED.owner_user_id,
    organization_count = EXCLUDED.organization_count,
    reason = EXCLUDED.reason,
    discovered_at = now(),
    resolved_at = NULL,
    resolution_note = NULL;

  UPDATE public.ownership_backfill_quarantine quarantine
  SET resolved_at = now(), resolution_note = 'Parent now belongs to the same organization'
  WHERE quarantine.entity_table = 'affiliate_links'
    AND quarantine.resolved_at IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.affiliate_links link
      JOIN public.hotlist hotlist_row ON hotlist_row.id = link.hotlist_id
      WHERE link.id = quarantine.entity_id
        AND link.organization_id IS DISTINCT FROM public.resolve_single_org_for_user(hotlist_row.user_id)
    );

  INSERT INTO public.ownership_backfill_quarantine (
    entity_table, entity_id, owner_user_id, organization_count, reason
  )
  SELECT 'ad_daily', daily.ad_id, ad.created_by, 1, 'parent_organization_mismatch'
  FROM public.ad_daily daily
  JOIN public.ads ad ON ad.id = daily.ad_id
  WHERE daily.organization_id IS DISTINCT FROM ad.organization_id
  ON CONFLICT (entity_table, entity_id) DO UPDATE SET
    owner_user_id = EXCLUDED.owner_user_id,
    organization_count = EXCLUDED.organization_count,
    reason = EXCLUDED.reason,
    discovered_at = now(),
    resolved_at = NULL,
    resolution_note = NULL;

  UPDATE public.ownership_backfill_quarantine quarantine
  SET resolved_at = now(), resolution_note = 'Parent now belongs to the same organization'
  WHERE quarantine.entity_table = 'ad_daily'
    AND quarantine.resolved_at IS NULL
    AND NOT EXISTS (
      SELECT 1
      FROM public.ad_daily daily
      JOIN public.ads ad ON ad.id = daily.ad_id
      WHERE daily.ad_id = quarantine.entity_id
        AND daily.organization_id IS DISTINCT FROM ad.organization_id
    );
END
$w1_1_preflight$;
