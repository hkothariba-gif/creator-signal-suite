-- W1-1 / 4b: channels, attribution models, credits, conflicts, and health.

CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  channel_group TEXT NOT NULL CHECK (channel_group IN ('paid', 'retention', 'affiliate', 'creator', 'organic', 'referral', 'direct', 'unattributed')),
  provider TEXT,
  platform TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, channel_key),
  UNIQUE (organization_id, id)
);

ALTER TABLE public.touchpoints
  ADD CONSTRAINT touchpoints_channel_org_fk
  FOREIGN KEY (organization_id, channel_id)
  REFERENCES public.channels (organization_id, id) ON DELETE RESTRICT;

CREATE TABLE public.attribution_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  model_key TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  display_name TEXT NOT NULL,
  algorithm TEXT NOT NULL CHECK (algorithm IN ('first_touch', 'last_touch', 'linear', 'position_based', 'time_decay', 'data_driven')),
  lookback_days INTEGER NOT NULL DEFAULT 30 CHECK (lookback_days BETWEEN 1 AND 730),
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, model_key, version),
  UNIQUE (organization_id, id)
);

CREATE TABLE public.model_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  journey_mode TEXT NOT NULL CHECK (journey_mode IN ('self_serve', 'sales_led', 'either')),
  attribution_model_id UUID NOT NULL,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  UNIQUE (organization_id, journey_mode, effective_from),
  CONSTRAINT model_defaults_model_org_fk FOREIGN KEY (organization_id, attribution_model_id)
    REFERENCES public.attribution_models (organization_id, id) ON DELETE RESTRICT
);

CREATE TABLE public.attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversion_id UUID NOT NULL,
  touchpoint_id UUID,
  channel_id UUID NOT NULL,
  attribution_model_id UUID NOT NULL,
  credit NUMERIC(9, 6) NOT NULL CHECK (credit >= 0 AND credit <= 1),
  attributed_value_minor BIGINT CHECK (attributed_value_minor IS NULL OR attributed_value_minor >= 0),
  currency TEXT CHECK (currency IS NULL OR currency ~ '^[A-Z]{3}$'),
  calculation_version TEXT NOT NULL,
  maturity_status TEXT NOT NULL CHECK (maturity_status IN ('immature', 'mature')),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, conversion_id, attribution_model_id, calculation_version, channel_id),
  CONSTRAINT attributions_conversion_org_fk FOREIGN KEY (organization_id, conversion_id)
    REFERENCES public.conversions (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT attributions_touchpoint_org_fk FOREIGN KEY (organization_id, touchpoint_id)
    REFERENCES public.touchpoints (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT attributions_channel_org_fk FOREIGN KEY (organization_id, channel_id)
    REFERENCES public.channels (organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT attributions_model_org_fk FOREIGN KEY (organization_id, attribution_model_id)
    REFERENCES public.attribution_models (organization_id, id) ON DELETE RESTRICT
);

CREATE TABLE public.claim_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversion_id UUID NOT NULL,
  first_touchpoint_id UUID,
  second_touchpoint_id UUID,
  conflict_type TEXT NOT NULL CHECK (conflict_type IN ('duplicate_claim', 'overlapping_window', 'identity_disagreement', 'provider_disagreement')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored')),
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT claim_conflicts_conversion_org_fk FOREIGN KEY (organization_id, conversion_id)
    REFERENCES public.conversions (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT claim_conflicts_first_touch_org_fk FOREIGN KEY (organization_id, first_touchpoint_id)
    REFERENCES public.touchpoints (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT claim_conflicts_second_touch_org_fk FOREIGN KEY (organization_id, second_touchpoint_id)
    REFERENCES public.touchpoints (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.tracking_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  run_key TEXT NOT NULL,
  check_key TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'failing', 'not_configured')),
  last_event_at TIMESTAMPTZ,
  last_checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  failure_count INTEGER NOT NULL DEFAULT 0 CHECK (failure_count >= 0),
  diagnostics JSONB NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (organization_id, run_key, check_key)
);

CREATE INDEX idx_channels_family_provider
  ON public.channels (organization_id, channel_group, provider, platform);
CREATE INDEX idx_attributions_conversion_model
  ON public.attributions (organization_id, conversion_id, attribution_model_id, calculation_version);
CREATE INDEX idx_attributions_channel_time
  ON public.attributions (organization_id, channel_id, calculated_at DESC);
CREATE INDEX idx_claim_conflicts_org_status
  ON public.claim_conflicts (organization_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_attribution_credit_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  target_org UUID := COALESCE(NEW.organization_id, OLD.organization_id);
  target_conversion UUID := COALESCE(NEW.conversion_id, OLD.conversion_id);
  target_model UUID := COALESCE(NEW.attribution_model_id, OLD.attribution_model_id);
  target_version TEXT := COALESCE(NEW.calculation_version, OLD.calculation_version);
  credit_total NUMERIC;
BEGIN
  SELECT COALESCE(sum(credit), 0)
  INTO credit_total
  FROM public.attributions
  WHERE organization_id = target_org
    AND conversion_id = target_conversion
    AND attribution_model_id = target_model
    AND calculation_version = target_version;

  -- A missing set is valid while a conversion is unattributed or being removed;
  -- once any credits exist for the version, the complete set must total one.
  IF credit_total <> 0 AND credit_total <> 1 THEN
    RAISE EXCEPTION 'Attribution credits must total 1; got %', credit_total;
  END IF;

  RETURN NULL;
END;
$$;

CREATE CONSTRAINT TRIGGER attribution_credit_total
  AFTER INSERT OR UPDATE OR DELETE ON public.attributions
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.enforce_attribution_credit_total();

CREATE OR REPLACE FUNCTION public.reject_attribution_model_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'attribution_models are immutable; create a new version instead';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_attribution_model_mutation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER attribution_models_are_immutable
  BEFORE UPDATE OR DELETE ON public.attribution_models
  FOR EACH ROW EXECUTE FUNCTION public.reject_attribution_model_mutation();

CREATE OR REPLACE FUNCTION public.seed_attribution_defaults(target_organization_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_touch_model UUID;
  linear_model UUID;
BEGIN
  INSERT INTO public.channels (organization_id, channel_key, display_name, channel_group)
  VALUES
    (target_organization_id, 'paid_search', 'Paid search', 'paid'),
    (target_organization_id, 'paid_social', 'Paid social', 'paid'),
    (target_organization_id, 'affiliate', 'Affiliate', 'affiliate'),
    (target_organization_id, 'creator', 'Creator', 'creator'),
    (target_organization_id, 'email', 'Email', 'retention'),
    (target_organization_id, 'lifecycle', 'Lifecycle', 'retention'),
    (target_organization_id, 'organic_search', 'Organic search', 'organic'),
    (target_organization_id, 'referral', 'Referral', 'referral'),
    (target_organization_id, 'direct', 'Direct', 'direct'),
    (target_organization_id, 'unattributed', 'Unattributed', 'unattributed')
  ON CONFLICT (organization_id, channel_key) DO NOTHING;

  INSERT INTO public.attribution_models (organization_id, model_key, version, display_name, algorithm, settings)
  VALUES
    (target_organization_id, 'first_touch', 1, 'First touch', 'first_touch', '{}'::jsonb),
    (target_organization_id, 'last_touch', 1, 'Last touch', 'last_touch', '{}'::jsonb),
    (target_organization_id, 'linear', 1, 'Linear', 'linear', '{}'::jsonb),
    (target_organization_id, 'position_based', 1, 'Position based', 'position_based', '{"first":0.4,"middle":0.2,"last":0.4}'::jsonb),
    (target_organization_id, 'time_decay', 1, 'Time decay', 'time_decay', '{}'::jsonb)
  ON CONFLICT (organization_id, model_key, version) DO NOTHING;

  SELECT id INTO last_touch_model FROM public.attribution_models
    WHERE organization_id = target_organization_id AND model_key = 'first_touch' AND version = 1;
  SELECT id INTO linear_model FROM public.attribution_models
    WHERE organization_id = target_organization_id AND model_key = 'position_based' AND version = 1;

  INSERT INTO public.model_defaults (organization_id, journey_mode, attribution_model_id, effective_from)
  VALUES
    (target_organization_id, 'self_serve', last_touch_model, CURRENT_DATE),
    (target_organization_id, 'sales_led', linear_model, CURRENT_DATE),
    (target_organization_id, 'either', linear_model, CURRENT_DATE)
  ON CONFLICT (organization_id, journey_mode, effective_from) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.seed_attribution_defaults(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.seed_attribution_defaults(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.seed_attribution_defaults_on_org_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.seed_attribution_defaults(NEW.id);
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.seed_attribution_defaults_on_org_create() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER seed_attribution_defaults_after_org_create
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.seed_attribution_defaults_on_org_create();

SELECT public.seed_attribution_defaults(id) FROM public.organizations;

DO $w1_1_rls$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['attributions', 'claim_conflicts', 'tracking_health'] LOOP
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

  GRANT UPDATE (status, resolution, resolved_by, resolved_at) ON public.claim_conflicts TO authenticated;
  CREATE POLICY org_editors_resolve_claim_conflicts ON public.claim_conflicts
    FOR UPDATE TO authenticated
    USING (public.can_edit_org(organization_id) AND status = 'open')
    WITH CHECK (
      public.can_edit_org(organization_id)
      AND status IN ('resolved', 'ignored')
      AND resolved_by = auth.uid()
      AND resolved_at IS NOT NULL
    );

  FOREACH table_name IN ARRAY ARRAY['channels', 'model_defaults'] LOOP
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

  ALTER TABLE public.attribution_models ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.attribution_models FORCE ROW LEVEL SECURITY;
  REVOKE ALL ON public.attribution_models FROM PUBLIC, anon, authenticated;
  GRANT SELECT, INSERT ON public.attribution_models TO authenticated;
  GRANT ALL ON public.attribution_models TO service_role;
  CREATE POLICY org_members_select_attribution_models ON public.attribution_models
    FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
  CREATE POLICY org_editors_insert_attribution_models ON public.attribution_models
    FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id));
END
$w1_1_rls$;
