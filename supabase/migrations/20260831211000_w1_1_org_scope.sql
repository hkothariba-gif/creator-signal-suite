-- W1-1 / organization ownership rewrite.
--
-- Keep legacy user_id columns during Wave 1 so the current application remains
-- operational. organization_id becomes the durable tenant boundary and every
-- policy below uses the existing organization role helpers.

DO $w1_1_guard$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.ownership_backfill_quarantine
    WHERE resolved_at IS NULL
  ) THEN
    RAISE EXCEPTION
      'W1-1 organization backfill stopped: resolve ownership_backfill_quarantine before retrying';
  END IF;
END
$w1_1_guard$;

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

CREATE OR REPLACE FUNCTION public.apply_legacy_org_ownership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := COALESCE(NEW.user_id, auth.uid());
  NEW.created_by := COALESCE(NEW.created_by, NEW.user_id, auth.uid());
  NEW.organization_id := COALESCE(
    NEW.organization_id,
    public.resolve_single_org_for_user(COALESCE(NEW.user_id, auth.uid()))
  );

  IF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'A single organization membership is required for this legacy write';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_legacy_org_ownership() FROM PUBLIC, anon, authenticated;

DO $w1_1_scope$
DECLARE
  target_table TEXT;
  policy_row RECORD;
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
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE',
      target_table
    );
    EXECUTE format(
      'ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT',
      target_table
    );
    EXECUTE format(
      'UPDATE public.%I SET organization_id = public.resolve_single_org_for_user(user_id) WHERE organization_id IS NULL',
      target_table
    );
    EXECUTE format(
      'UPDATE public.%I SET created_by = user_id WHERE created_by IS NULL',
      target_table
    );

    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN organization_id SET NOT NULL', target_table);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN created_by SET NOT NULL', target_table);
    EXECUTE format(
      'ALTER TABLE public.%I ALTER COLUMN organization_id SET DEFAULT public.resolve_single_org_for_user(auth.uid())',
      target_table
    );
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN created_by SET DEFAULT auth.uid()', target_table);

    EXECUTE format('CREATE UNIQUE INDEX IF NOT EXISTS %I ON public.%I (organization_id, id)',
      'uq_' || target_table || '_org_id', target_table);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (organization_id)',
      'idx_' || target_table || '_organization', target_table);

    EXECUTE format('DROP TRIGGER IF EXISTS w1_1_apply_org_ownership ON public.%I', target_table);
    EXECUTE format(
      'CREATE TRIGGER w1_1_apply_org_ownership BEFORE INSERT OR UPDATE OF user_id, organization_id, created_by ON public.%I FOR EACH ROW EXECUTE FUNCTION public.apply_legacy_org_ownership()',
      target_table
    );

    FOR policy_row IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = target_table
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_row.policyname, target_table);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', target_table);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', target_table);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', target_table);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))',
      'org_members_select_' || target_table, target_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id) AND created_by = auth.uid() AND user_id = auth.uid())',
      'org_editors_insert_' || target_table, target_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_edit_org(organization_id)) WITH CHECK (public.can_edit_org(organization_id))',
      'org_editors_update_' || target_table, target_table
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.can_edit_org(organization_id))',
      'org_editors_delete_' || target_table, target_table
    );
  END LOOP;
END
$w1_1_scope$;

-- Tenant-safe dependent links. Existing single-column FKs remain during the
-- compatibility window, while these composite constraints prevent a child row
-- from pointing at an object in another organization.
ALTER TABLE public.hotlist ADD CONSTRAINT hotlist_campaign_org_fk
  FOREIGN KEY (organization_id, campaign_id)
  REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL;
ALTER TABLE public.ad_corpus ADD CONSTRAINT ad_corpus_campaign_org_fk
  FOREIGN KEY (organization_id, campaign_id)
  REFERENCES public.campaigns (organization_id, id) ON DELETE CASCADE;
ALTER TABLE public.ad_corpus ADD CONSTRAINT ad_corpus_hotlist_org_fk
  FOREIGN KEY (organization_id, hotlist_id)
  REFERENCES public.hotlist (organization_id, id) ON DELETE SET NULL;
ALTER TABLE public.brand_docs ADD CONSTRAINT brand_docs_campaign_org_fk
  FOREIGN KEY (organization_id, campaign_id)
  REFERENCES public.campaigns (organization_id, id) ON DELETE CASCADE;
ALTER TABLE public.creator_contacts ADD CONSTRAINT creator_contacts_hotlist_org_fk
  FOREIGN KEY (organization_id, hotlist_id)
  REFERENCES public.hotlist (organization_id, id) ON DELETE CASCADE;
ALTER TABLE public.outreach_threads ADD CONSTRAINT outreach_threads_campaign_org_fk
  FOREIGN KEY (organization_id, campaign_id)
  REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL;
ALTER TABLE public.outreach_threads ADD CONSTRAINT outreach_threads_hotlist_org_fk
  FOREIGN KEY (organization_id, hotlist_id)
  REFERENCES public.hotlist (organization_id, id) ON DELETE CASCADE;
ALTER TABLE public.outreach_messages ADD CONSTRAINT outreach_messages_thread_org_fk
  FOREIGN KEY (organization_id, thread_id)
  REFERENCES public.outreach_threads (organization_id, id) ON DELETE CASCADE;
ALTER TABLE public.outreach_sequences ADD CONSTRAINT outreach_sequences_campaign_org_fk
  FOREIGN KEY (organization_id, campaign_id)
  REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL;
ALTER TABLE public.outreach_sequence_steps ADD CONSTRAINT outreach_steps_sequence_org_fk
  FOREIGN KEY (organization_id, sequence_id)
  REFERENCES public.outreach_sequences (organization_id, id) ON DELETE CASCADE;
ALTER TABLE public.sequence_enrollments ADD CONSTRAINT sequence_enrollments_sequence_org_fk
  FOREIGN KEY (organization_id, sequence_id)
  REFERENCES public.outreach_sequences (organization_id, id) ON DELETE CASCADE;
ALTER TABLE public.sequence_enrollments ADD CONSTRAINT sequence_enrollments_hotlist_org_fk
  FOREIGN KEY (organization_id, hotlist_id)
  REFERENCES public.hotlist (organization_id, id) ON DELETE CASCADE;
ALTER TABLE public.sequence_enrollments ADD CONSTRAINT sequence_enrollments_thread_org_fk
  FOREIGN KEY (organization_id, thread_id)
  REFERENCES public.outreach_threads (organization_id, id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_ads_org_id ON public.ads (organization_id, id);
ALTER TABLE public.ad_daily ADD CONSTRAINT ad_daily_ad_org_fk
  FOREIGN KEY (organization_id, ad_id)
  REFERENCES public.ads (organization_id, id) ON DELETE CASCADE;
ALTER TABLE public.affiliate_links ADD CONSTRAINT affiliate_links_hotlist_org_fk
  FOREIGN KEY (organization_id, hotlist_id)
  REFERENCES public.hotlist (organization_id, id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_campaigns_org_status_created
  ON public.campaigns (organization_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hotlist_org_campaign_stage
  ON public.hotlist (organization_id, campaign_id, stage);
CREATE UNIQUE INDEX IF NOT EXISTS uq_ad_corpus_org_source_external
  ON public.ad_corpus (organization_id, source, external_id);
CREATE INDEX IF NOT EXISTS idx_ad_corpus_org_campaign
  ON public.ad_corpus (organization_id, campaign_id, collected_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_threads_org_campaign
  ON public.outreach_threads (organization_id, campaign_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_org_thread
  ON public.outreach_messages (organization_id, thread_id, created_at);

-- Secret-bearing rows stay server-only. The nullable org reference is filled
-- only when the subject has one unambiguous membership; Wave 1 runtime will
-- require the explicit org credential for all new OAuth flows.
ALTER TABLE public.channel_tokens
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.oauth_states
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
UPDATE public.channel_tokens
  SET organization_id = public.resolve_single_org_for_user(user_id)
  WHERE organization_id IS NULL;
UPDATE public.oauth_states
  SET organization_id = public.resolve_single_org_for_user(user_id)
  WHERE organization_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_channel_tokens_org_user_provider
  ON public.channel_tokens (organization_id, user_id, provider);
CREATE INDEX IF NOT EXISTS idx_oauth_states_org_user
  ON public.oauth_states (organization_id, user_id);
ALTER TABLE public.channel_tokens FORCE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_states FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.channel_tokens, public.oauth_states FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.channel_tokens, public.oauth_states TO service_role;
