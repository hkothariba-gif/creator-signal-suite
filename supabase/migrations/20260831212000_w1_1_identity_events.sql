-- W1-1 / 4a: identity, event, touchpoint, and conversion spine.

CREATE TABLE public.visitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  anonymous_id TEXT NOT NULL,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  traits JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, anonymous_id),
  UNIQUE (organization_id, id)
);

CREATE TABLE public.persons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id TEXT,
  primary_email TEXT,
  primary_account_id UUID,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, external_id),
  UNIQUE (organization_id, id)
);

CREATE UNIQUE INDEX uq_persons_org_email
  ON public.persons (organization_id, lower(primary_email))
  WHERE primary_email IS NOT NULL;

CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  external_id TEXT,
  name TEXT NOT NULL,
  domain TEXT,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, external_id),
  UNIQUE (organization_id, id)
);

ALTER TABLE public.persons
  ADD CONSTRAINT persons_primary_account_org_fk
  FOREIGN KEY (organization_id, primary_account_id)
  REFERENCES public.accounts (organization_id, id) ON DELETE SET NULL;

CREATE TABLE public.identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  identity_type TEXT NOT NULL CHECK (identity_type IN ('email', 'phone', 'cookie', 'device', 'platform', 'crm')),
  normalized_hash TEXT,
  external_id TEXT,
  visitor_id UUID,
  person_id UUID,
  verified_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, identity_type, normalized_hash),
  UNIQUE (organization_id, identity_type, external_id),
  UNIQUE (organization_id, id),
  CONSTRAINT identities_value_required CHECK (normalized_hash IS NOT NULL OR external_id IS NOT NULL),
  CONSTRAINT identities_subject_required CHECK (visitor_id IS NOT NULL OR person_id IS NOT NULL),
  CONSTRAINT identities_visitor_org_fk FOREIGN KEY (organization_id, visitor_id)
    REFERENCES public.visitors (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT identities_person_org_fk FOREIGN KEY (organization_id, person_id)
    REFERENCES public.persons (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE public.event_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('intent', 'sales', 'product', 'revenue', 'retention', 'custom')),
  conversion_kind TEXT CHECK (conversion_kind IN ('lead', 'activation', 'paid', 'expansion', 'retention')),
  journey_mode TEXT NOT NULL DEFAULT 'either' CHECK (journey_mode IN ('self_serve', 'sales_led', 'either')),
  default_attribution_model_key TEXT NOT NULL DEFAULT 'position_based',
  lookback_days INTEGER NOT NULL DEFAULT 60 CHECK (lookback_days BETWEEN 1 AND 730),
  maturity_days INTEGER NOT NULL DEFAULT 30 CHECK (maturity_days BETWEEN 0 AND 730),
  active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, event_key, version),
  UNIQUE (organization_id, id)
);

-- Partitioned by occurrence time for retention and ingestion maintenance.
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_definition_id UUID NOT NULL,
  event_key TEXT NOT NULL,
  visitor_id UUID,
  person_id UUID,
  account_id UUID,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (organization_id, occurred_at, id),
  CONSTRAINT events_definition_org_fk FOREIGN KEY (organization_id, event_definition_id)
    REFERENCES public.event_definitions (organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT events_visitor_org_fk FOREIGN KEY (organization_id, visitor_id)
    REFERENCES public.visitors (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT events_person_org_fk FOREIGN KEY (organization_id, person_id)
    REFERENCES public.persons (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT events_account_org_fk FOREIGN KEY (organization_id, account_id)
    REFERENCES public.accounts (organization_id, id) ON DELETE SET NULL
) PARTITION BY RANGE (occurred_at);

CREATE TABLE public.events_default PARTITION OF public.events DEFAULT;

-- PostgreSQL partition uniqueness must include the partition key. This compact
-- receipt ledger owns the provider idempotency contract across all partitions.
CREATE TABLE public.event_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_id UUID NOT NULL,
  event_occurred_at TIMESTAMPTZ NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, source, external_event_id),
  CONSTRAINT event_receipts_event_fk FOREIGN KEY (organization_id, event_occurred_at, event_id)
    REFERENCES public.events (organization_id, occurred_at, id) ON DELETE CASCADE
);

CREATE TABLE public.touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_id UUID NOT NULL,
  event_occurred_at TIMESTAMPTZ NOT NULL,
  channel_id UUID NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  person_id UUID,
  account_id UUID,
  campaign_id UUID,
  source TEXT NOT NULL,
  medium TEXT,
  channel TEXT NOT NULL,
  external_ref TEXT,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  CONSTRAINT touchpoints_event_org_fk FOREIGN KEY (organization_id, event_occurred_at, event_id)
    REFERENCES public.events (organization_id, occurred_at, id) ON DELETE CASCADE,
  CONSTRAINT touchpoints_person_org_fk FOREIGN KEY (organization_id, person_id)
    REFERENCES public.persons (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT touchpoints_account_org_fk FOREIGN KEY (organization_id, account_id)
    REFERENCES public.accounts (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT touchpoints_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  event_definition_id UUID NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  person_id UUID,
  account_id UUID,
  source TEXT NOT NULL,
  external_conversion_id TEXT NOT NULL,
  journey_mode TEXT NOT NULL CHECK (journey_mode IN ('self_serve', 'sales_led')),
  value_minor BIGINT CHECK (value_minor IS NULL OR value_minor >= 0),
  currency TEXT CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, event_definition_id, source, external_conversion_id),
  UNIQUE (organization_id, id),
  CONSTRAINT conversions_subject_required CHECK (person_id IS NOT NULL OR account_id IS NOT NULL),
  CONSTRAINT conversions_definition_org_fk FOREIGN KEY (organization_id, event_definition_id)
    REFERENCES public.event_definitions (organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT conversions_person_org_fk FOREIGN KEY (organization_id, person_id)
    REFERENCES public.persons (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT conversions_account_org_fk FOREIGN KEY (organization_id, account_id)
    REFERENCES public.accounts (organization_id, id) ON DELETE SET NULL
);

CREATE INDEX idx_visitors_org_last_seen ON public.visitors (organization_id, last_seen_at DESC);
CREATE INDEX idx_identities_org_visitor ON public.identities (organization_id, visitor_id);
CREATE INDEX idx_identities_org_person ON public.identities (organization_id, person_id);
CREATE INDEX idx_persons_org_updated ON public.persons (organization_id, updated_at DESC);
CREATE INDEX idx_accounts_org_domain ON public.accounts (organization_id, lower(domain)) WHERE domain IS NOT NULL;
CREATE INDEX idx_events_org_key_time ON public.events (organization_id, event_definition_id, occurred_at DESC);
CREATE INDEX idx_events_org_person_time ON public.events (organization_id, person_id, occurred_at DESC);
CREATE INDEX idx_touchpoints_org_person_time ON public.touchpoints (organization_id, person_id, occurred_at DESC);
CREATE INDEX idx_touchpoints_channel_time ON public.touchpoints (organization_id, channel_id, occurred_at DESC);
CREATE INDEX idx_conversions_org_time ON public.conversions (organization_id, occurred_at DESC);

CREATE VIEW public.visitors_redacted
WITH (security_barrier = true)
AS
SELECT organization_id, id, first_seen_at, last_seen_at, created_at, updated_at
FROM public.visitors
WHERE public.is_org_member(organization_id);

CREATE VIEW public.persons_redacted
WITH (security_barrier = true)
AS
SELECT organization_id, id, primary_account_id, created_at, updated_at
FROM public.persons
WHERE public.is_org_member(organization_id);

CREATE VIEW public.events_redacted
WITH (security_barrier = true)
AS
SELECT organization_id, id, occurred_at, received_at, event_definition_id, event_key,
  person_id, account_id
FROM public.events
WHERE public.is_org_member(organization_id);

REVOKE ALL ON public.visitors_redacted, public.persons_redacted, public.events_redacted
  FROM PUBLIC, anon;
GRANT SELECT ON public.visitors_redacted, public.persons_redacted, public.events_redacted
  TO authenticated;

CREATE OR REPLACE FUNCTION public.seed_default_event_definitions(target_organization_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.event_definitions (
    organization_id, event_key, version, display_name, category, conversion_kind,
    journey_mode, default_attribution_model_key, lookback_days, maturity_days
  ) VALUES
    (target_organization_id, 'plan_viewed', 1, 'Plan viewed', 'intent', 'lead', 'either', 'position_based', 60, 30),
    (target_organization_id, 'demo_requested', 1, 'Demo requested', 'sales', 'lead', 'sales_led', 'position_based', 120, 90),
    (target_organization_id, 'trial_started', 1, 'Trial started', 'product', 'activation', 'either', 'position_based', 60, 30),
    (target_organization_id, 'account_activated', 1, 'Account activated', 'product', 'activation', 'self_serve', 'first_touch', 30, 7),
    (target_organization_id, 'upgraded_paid', 1, 'Upgraded to paid', 'revenue', 'paid', 'self_serve', 'first_touch', 30, 7),
    (target_organization_id, 'subscription_started', 1, 'Subscription started', 'revenue', 'paid', 'either', 'position_based', 60, 30),
    (target_organization_id, 'seat_added', 1, 'Seat added', 'revenue', 'expansion', 'either', 'position_based', 60, 30)
  ON CONFLICT (organization_id, event_key, version) DO NOTHING;
$$;

REVOKE EXECUTE ON FUNCTION public.seed_default_event_definitions(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_default_event_definitions(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.seed_event_definitions_on_org_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_default_event_definitions(NEW.id);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.seed_event_definitions_on_org_create() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER seed_event_definitions_after_org_create
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.seed_event_definitions_on_org_create();

SELECT public.seed_default_event_definitions(id) FROM public.organizations;

DO $w1_1_rls$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['touchpoints', 'conversions'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))',
      'org_members_select_' || table_name, table_name
    );
  END LOOP;

  FOREACH table_name IN ARRAY ARRAY['visitors', 'persons', 'identities', 'events', 'events_default'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.can_edit_org(organization_id))', 'org_editors_select_' || table_name, table_name);
  END LOOP;

  ALTER TABLE public.event_receipts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.event_receipts FORCE ROW LEVEL SECURITY;
  REVOKE ALL ON public.event_receipts FROM PUBLIC, anon, authenticated;
  GRANT ALL ON public.event_receipts TO service_role;

  ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.accounts FORCE ROW LEVEL SECURITY;
  REVOKE ALL ON public.accounts FROM PUBLIC, anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
  GRANT ALL ON public.accounts TO service_role;
  CREATE POLICY org_members_select_accounts ON public.accounts
    FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
  CREATE POLICY org_editors_insert_accounts ON public.accounts
    FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id));
  CREATE POLICY org_editors_update_accounts ON public.accounts
    FOR UPDATE TO authenticated USING (public.can_edit_org(organization_id))
    WITH CHECK (public.can_edit_org(organization_id));
  CREATE POLICY org_editors_delete_accounts ON public.accounts
    FOR DELETE TO authenticated USING (public.can_edit_org(organization_id));

  GRANT INSERT, UPDATE, DELETE ON public.persons TO authenticated;
  CREATE POLICY org_editors_insert_persons ON public.persons
    FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id));
  CREATE POLICY org_editors_update_persons ON public.persons
    FOR UPDATE TO authenticated USING (public.can_edit_org(organization_id))
    WITH CHECK (public.can_edit_org(organization_id));
  CREATE POLICY org_editors_delete_persons ON public.persons
    FOR DELETE TO authenticated USING (public.can_edit_org(organization_id));

  ALTER TABLE public.event_definitions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.event_definitions FORCE ROW LEVEL SECURITY;
  REVOKE ALL ON public.event_definitions FROM PUBLIC, anon;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.event_definitions TO authenticated;
  GRANT ALL ON public.event_definitions TO service_role;

  CREATE POLICY org_members_select_event_definitions ON public.event_definitions
    FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
  CREATE POLICY org_editors_insert_event_definitions ON public.event_definitions
    FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id));
  CREATE POLICY org_editors_update_event_definitions ON public.event_definitions
    FOR UPDATE TO authenticated USING (public.can_edit_org(organization_id))
    WITH CHECK (public.can_edit_org(organization_id));
  CREATE POLICY org_editors_delete_event_definitions ON public.event_definitions
    FOR DELETE TO authenticated USING (public.can_edit_org(organization_id));
END
$w1_1_rls$;
