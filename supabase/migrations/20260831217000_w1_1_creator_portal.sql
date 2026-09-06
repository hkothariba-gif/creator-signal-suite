-- W1-1 / 4f: creator collaboration portal, deliverables, terms, and payouts.

CREATE TABLE public.creator_brand_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  creator_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotlist_id UUID,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'paused', 'revoked')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, creator_user_id),
  UNIQUE (organization_id, id),
  CONSTRAINT creator_brand_links_hotlist_org_fk FOREIGN KEY (organization_id, hotlist_id)
    REFERENCES public.hotlist (organization_id, id) ON DELETE SET NULL
);

CREATE OR REPLACE FUNCTION public.has_creator_brand_access(target_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creator_brand_links
    WHERE organization_id = target_organization_id
      AND creator_user_id = auth.uid()
      AND status = 'active'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_creator_brand_access(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_creator_brand_access(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.is_creator_link_participant(
  target_organization_id UUID,
  target_creator_brand_link_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.creator_brand_links
    WHERE organization_id = target_organization_id
      AND id = target_creator_brand_link_id
      AND creator_user_id = auth.uid()
      AND status = 'active'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_creator_link_participant(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_creator_link_participant(UUID, UUID) TO authenticated;

CREATE TABLE public.deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  creator_brand_link_id UUID NOT NULL,
  campaign_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  deliverable_type TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'in_progress', 'submitted', 'changes_requested', 'approved', 'published', 'cancelled')),
  submission_url TEXT,
  submission_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  CONSTRAINT deliverables_link_org_fk FOREIGN KEY (organization_id, creator_brand_link_id)
    REFERENCES public.creator_brand_links (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT deliverables_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.review_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  deliverable_id UUID NOT NULL,
  actor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('submitted', 'commented', 'changes_requested', 'approved', 'published')),
  comment TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT review_events_deliverable_org_fk FOREIGN KEY (organization_id, deliverable_id)
    REFERENCES public.deliverables (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  creator_brand_link_id UUID NOT NULL,
  campaign_id UUID,
  deliverable_id UUID,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  last_message_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  CONSTRAINT threads_link_org_fk FOREIGN KEY (organization_id, creator_brand_link_id)
    REFERENCES public.creator_brand_links (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT threads_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT threads_deliverable_org_fk FOREIGN KEY (organization_id, deliverable_id)
    REFERENCES public.deliverables (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.thread_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL,
  sender_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  body TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT thread_messages_thread_org_fk FOREIGN KEY (organization_id, thread_id)
    REFERENCES public.threads (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE public.deal_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  creator_brand_link_id UUID NOT NULL,
  campaign_id UUID,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'offered', 'accepted', 'declined', 'superseded')),
  compensation_type TEXT NOT NULL CHECK (compensation_type IN ('flat_fee', 'commission', 'hybrid', 'gifted', 'other')),
  flat_fee_minor BIGINT CHECK (flat_fee_minor IS NULL OR flat_fee_minor >= 0),
  commission_bps INTEGER CHECK (commission_bps IS NULL OR commission_bps BETWEEN 0 AND 10000),
  currency TEXT CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  offered_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, creator_brand_link_id, campaign_id, version),
  UNIQUE (organization_id, id),
  CONSTRAINT deal_terms_link_org_fk FOREIGN KEY (organization_id, creator_brand_link_id)
    REFERENCES public.creator_brand_links (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT deal_terms_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  creator_brand_link_id UUID NOT NULL,
  campaign_id UUID,
  deal_term_id UUID,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'paid', 'failed', 'cancelled')),
  provider TEXT,
  external_payout_id TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, external_payout_id),
  CONSTRAINT payouts_link_org_fk FOREIGN KEY (organization_id, creator_brand_link_id)
    REFERENCES public.creator_brand_links (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT payouts_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT payouts_deal_org_fk FOREIGN KEY (organization_id, deal_term_id)
    REFERENCES public.deal_terms (organization_id, id) ON DELETE SET NULL
);

CREATE INDEX idx_deliverables_link_status ON public.deliverables (organization_id, creator_brand_link_id, status);
CREATE INDEX idx_review_events_deliverable ON public.review_events (organization_id, deliverable_id, created_at);
CREATE INDEX idx_thread_messages_thread ON public.thread_messages (organization_id, thread_id, created_at);
CREATE INDEX idx_payouts_org_status ON public.payouts (organization_id, status, created_at DESC);

DO $w1_1_rls$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['creator_brand_links', 'deliverables', 'review_events', 'threads', 'thread_messages', 'deal_terms', 'payouts'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
  END LOOP;

  CREATE POLICY portal_participants_select_creator_brand_links ON public.creator_brand_links
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id) OR creator_user_id = auth.uid());
  CREATE POLICY portal_participants_select_deliverables ON public.deliverables
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id) OR public.is_creator_link_participant(organization_id, creator_brand_link_id));
  CREATE POLICY portal_participants_select_review_events ON public.review_events
    FOR SELECT TO authenticated
    USING (
      public.is_org_member(organization_id)
      OR EXISTS (
        SELECT 1 FROM public.deliverables deliverable
        WHERE deliverable.organization_id = review_events.organization_id
          AND deliverable.id = review_events.deliverable_id
          AND public.is_creator_link_participant(deliverable.organization_id, deliverable.creator_brand_link_id)
      )
    );
  CREATE POLICY portal_participants_select_threads ON public.threads
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id) OR public.is_creator_link_participant(organization_id, creator_brand_link_id));
  CREATE POLICY portal_participants_select_thread_messages ON public.thread_messages
    FOR SELECT TO authenticated
    USING (
      public.is_org_member(organization_id)
      OR EXISTS (
        SELECT 1 FROM public.threads portal_thread
        WHERE portal_thread.organization_id = thread_messages.organization_id
          AND portal_thread.id = thread_messages.thread_id
          AND public.is_creator_link_participant(portal_thread.organization_id, portal_thread.creator_brand_link_id)
      )
    );
  CREATE POLICY portal_participants_select_deal_terms ON public.deal_terms
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id) OR public.is_creator_link_participant(organization_id, creator_brand_link_id));
  CREATE POLICY portal_participants_select_payouts ON public.payouts
    FOR SELECT TO authenticated
    USING (public.is_org_member(organization_id) OR public.is_creator_link_participant(organization_id, creator_brand_link_id));

  GRANT INSERT, UPDATE, DELETE ON public.creator_brand_links, public.deliverables, public.threads, public.deal_terms TO authenticated;
  FOREACH table_name IN ARRAY ARRAY['creator_brand_links', 'deliverables', 'threads', 'deal_terms'] LOOP
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id))', 'org_editors_insert_' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_edit_org(organization_id)) WITH CHECK (public.can_edit_org(organization_id))', 'org_editors_update_' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.can_edit_org(organization_id))', 'org_editors_delete_' || table_name, table_name);
  END LOOP;

  GRANT INSERT ON public.review_events, public.thread_messages TO authenticated;
  CREATE POLICY portal_participants_insert_review_events ON public.review_events
    FOR INSERT TO authenticated
    WITH CHECK (
      actor_user_id = auth.uid()
      AND (
        public.can_edit_org(organization_id)
        OR EXISTS (
          SELECT 1 FROM public.deliverables deliverable
          WHERE deliverable.organization_id = review_events.organization_id
            AND deliverable.id = review_events.deliverable_id
            AND public.is_creator_link_participant(deliverable.organization_id, deliverable.creator_brand_link_id)
            AND review_events.event_type IN ('submitted', 'commented')
        )
      )
    );
  CREATE POLICY portal_participants_insert_thread_messages ON public.thread_messages
    FOR INSERT TO authenticated
    WITH CHECK (
      sender_user_id = auth.uid()
      AND (
        public.can_edit_org(organization_id)
        OR EXISTS (
          SELECT 1 FROM public.threads portal_thread
          WHERE portal_thread.organization_id = thread_messages.organization_id
            AND portal_thread.id = thread_messages.thread_id
            AND public.is_creator_link_participant(portal_thread.organization_id, portal_thread.creator_brand_link_id)
        )
      )
    );

  -- Creator submission and term-acceptance writes go through the Wave 1 portal
  -- service so only the intended columns can change. Direct table UPDATE stays
  -- reserved for organization editors; creators retain row-specific read and
  -- append-only message/review access.

  -- Payout approval and provider state changes are registered actions; clients
  -- receive no direct UPDATE grant on payout rows.
END
$w1_1_rls$;
