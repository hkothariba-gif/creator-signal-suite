-- W1-1 / 4e: retention journeys, messaging, consent, and landing pages.

CREATE TABLE public.journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  description TEXT,
  trigger_event_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  entry_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  exit_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, name, version)
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'in_app', 'whatsapp')),
  subject_template TEXT,
  body_template TEXT NOT NULL,
  content_version INTEGER NOT NULL DEFAULT 1 CHECK (content_version > 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'archived')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, name, version)
);

CREATE TABLE public.journey_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL,
  message_id UUID,
  step_order INTEGER NOT NULL CHECK (step_order > 0),
  step_type TEXT NOT NULL CHECK (step_type IN ('send', 'wait', 'branch', 'goal', 'exit')),
  wait_seconds INTEGER CHECK (wait_seconds IS NULL OR wait_seconds >= 0),
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, journey_id, step_order),
  UNIQUE (organization_id, id),
  CONSTRAINT journey_steps_journey_org_fk FOREIGN KEY (organization_id, journey_id)
    REFERENCES public.journeys (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT journey_steps_message_org_fk FOREIGN KEY (organization_id, message_id)
    REFERENCES public.messages (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.journey_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  journey_id UUID NOT NULL,
  person_id UUID NOT NULL,
  current_step_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'exited', 'failed', 'suppressed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_action_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, id),
  CONSTRAINT journey_runs_journey_org_fk FOREIGN KEY (organization_id, journey_id)
    REFERENCES public.journeys (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT journey_runs_person_org_fk FOREIGN KEY (organization_id, person_id)
    REFERENCES public.persons (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT journey_runs_step_org_fk FOREIGN KEY (organization_id, current_step_id)
    REFERENCES public.journey_steps (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.sending_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failing', 'disabled')),
  dkim_status TEXT,
  spf_status TEXT,
  dmarc_status TEXT,
  last_checked_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, domain),
  UNIQUE (organization_id, id)
);

CREATE TABLE public.esp_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'failing')),
  capabilities JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider, external_account_id),
  UNIQUE (organization_id, id)
);

CREATE TABLE public.message_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL,
  journey_run_id UUID,
  person_id UUID NOT NULL,
  esp_connection_id UUID,
  channel TEXT NOT NULL,
  external_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'complained')),
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, channel, external_message_id),
  CONSTRAINT message_sends_message_org_fk FOREIGN KEY (organization_id, message_id)
    REFERENCES public.messages (organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT message_sends_run_org_fk FOREIGN KEY (organization_id, journey_run_id)
    REFERENCES public.journey_runs (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT message_sends_person_org_fk FOREIGN KEY (organization_id, person_id)
    REFERENCES public.persons (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT message_sends_esp_org_fk FOREIGN KEY (organization_id, esp_connection_id)
    REFERENCES public.esp_connections (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  destination_hash TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('unsubscribe', 'bounce', 'complaint', 'manual', 'legal')),
  source TEXT NOT NULL,
  suppressed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, channel, destination_hash)
);

CREATE TABLE public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  person_id UUID NOT NULL,
  purpose TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('granted', 'withdrawn', 'unknown')),
  legal_basis TEXT,
  source TEXT NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, person_id, purpose, channel),
  CONSTRAINT consents_person_org_fk FOREIGN KEY (organization_id, person_id)
    REFERENCES public.persons (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE public.landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID,
  slug TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  seo JSONB NOT NULL DEFAULT '{}'::jsonb,
  published_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug, version),
  CONSTRAINT landing_pages_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL
);

CREATE INDEX idx_journey_runs_due ON public.journey_runs (organization_id, status, next_action_at);
CREATE INDEX idx_message_sends_person_time ON public.message_sends (organization_id, person_id, queued_at DESC);
CREATE INDEX idx_suppressions_lookup ON public.suppressions (organization_id, channel, destination_hash);
CREATE UNIQUE INDEX uq_landing_pages_published_slug
  ON public.landing_pages (organization_id, slug) WHERE status = 'published';

DO $w1_1_rls$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['journeys', 'messages', 'landing_pages'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))', 'org_members_select_' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id) AND status = ''draft'')', 'org_editors_insert_draft_' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_edit_org(organization_id) AND status = ''draft'') WITH CHECK (public.can_edit_org(organization_id) AND status = ''draft'')', 'org_editors_update_draft_' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.can_edit_org(organization_id) AND status = ''draft'')', 'org_editors_delete_draft_' || table_name, table_name);
  END LOOP;

  ALTER TABLE public.journey_steps ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.journey_steps FORCE ROW LEVEL SECURITY;
  REVOKE ALL ON public.journey_steps FROM PUBLIC, anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.journey_steps TO authenticated;
  GRANT ALL ON public.journey_steps TO service_role;
  CREATE POLICY org_members_select_journey_steps ON public.journey_steps
    FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
  CREATE POLICY org_editors_insert_draft_journey_steps ON public.journey_steps
    FOR INSERT TO authenticated WITH CHECK (
      public.can_edit_org(organization_id)
      AND EXISTS (
        SELECT 1 FROM public.journeys journey
        WHERE journey.organization_id = journey_steps.organization_id
          AND journey.id = journey_steps.journey_id
          AND journey.status = 'draft'
      )
    );
  CREATE POLICY org_editors_update_draft_journey_steps ON public.journey_steps
    FOR UPDATE TO authenticated USING (
      public.can_edit_org(organization_id)
      AND EXISTS (
        SELECT 1 FROM public.journeys journey
        WHERE journey.organization_id = journey_steps.organization_id
          AND journey.id = journey_steps.journey_id
          AND journey.status = 'draft'
      )
    ) WITH CHECK (public.can_edit_org(organization_id));
  CREATE POLICY org_editors_delete_draft_journey_steps ON public.journey_steps
    FOR DELETE TO authenticated USING (
      public.can_edit_org(organization_id)
      AND EXISTS (
        SELECT 1 FROM public.journeys journey
        WHERE journey.organization_id = journey_steps.organization_id
          AND journey.id = journey_steps.journey_id
          AND journey.status = 'draft'
      )
    );

  ALTER TABLE public.sending_domains ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.sending_domains FORCE ROW LEVEL SECURITY;
  REVOKE ALL ON public.sending_domains FROM PUBLIC, anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.sending_domains TO authenticated;
  GRANT ALL ON public.sending_domains TO service_role;
  CREATE POLICY org_members_select_sending_domains ON public.sending_domains
    FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
  CREATE POLICY org_editors_insert_sending_domains ON public.sending_domains
    FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id) AND status = 'pending');
  CREATE POLICY org_editors_update_pending_sending_domains ON public.sending_domains
    FOR UPDATE TO authenticated
    USING (public.can_edit_org(organization_id) AND status = 'pending')
    WITH CHECK (public.can_edit_org(organization_id) AND status = 'pending');
  CREATE POLICY org_editors_delete_pending_sending_domains ON public.sending_domains
    FOR DELETE TO authenticated USING (public.can_edit_org(organization_id) AND status = 'pending');

  FOREACH table_name IN ARRAY ARRAY['journey_runs', 'message_sends', 'esp_connections', 'suppressions', 'consents'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))', 'org_members_select_' || table_name, table_name);
  END LOOP;
END
$w1_1_rls$;
