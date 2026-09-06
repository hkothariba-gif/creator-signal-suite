-- W1-1 / 4c: normalized spend, cost, budget, recommendation, and revenue facts.

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS offer JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS operating_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (operating_status IN ('draft', 'active', 'paused', 'completed', 'archived'));

UPDATE public.campaigns
SET operating_status = CASE status
  WHEN 'active' THEN 'active'
  WHEN 'completed' THEN 'completed'
  ELSE 'draft'
END
WHERE operating_status = 'draft';

CREATE TABLE public.channel_daily (
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  channel_id UUID NOT NULL,
  source TEXT NOT NULL,
  spend_minor BIGINT CHECK (spend_minor IS NULL OR spend_minor >= 0),
  revenue_minor BIGINT CHECK (revenue_minor IS NULL OR revenue_minor >= 0),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  impressions BIGINT CHECK (impressions IS NULL OR impressions >= 0),
  clicks BIGINT CHECK (clicks IS NULL OR clicks >= 0),
  conversions INTEGER CHECK (conversions IS NULL OR conversions >= 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (organization_id, channel_id, metric_date, currency),
  CONSTRAINT channel_daily_channel_org_fk FOREIGN KEY (organization_id, channel_id)
    REFERENCES public.channels (organization_id, id) ON DELETE RESTRICT
);

CREATE TABLE public.cost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID,
  channel_id UUID,
  account_id UUID,
  incurred_on DATE NOT NULL,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('media', 'creator_fee', 'affiliate_commission', 'production', 'platform', 'agency', 'other')),
  description TEXT NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  fidelity_rung TEXT NOT NULL DEFAULT 'L1' CHECK (fidelity_rung IN ('L1', 'L2', 'L3', 'L4')),
  cost_basis TEXT NOT NULL DEFAULT 'known' CHECK (cost_basis IN ('known', 'blended', 'plan', 'cohort_estimate', 'metered')),
  source TEXT NOT NULL DEFAULT 'manual',
  external_ref TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, source, external_ref),
  CONSTRAINT cost_items_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT cost_items_channel_org_fk FOREIGN KEY (organization_id, channel_id)
    REFERENCES public.channels (organization_id, id) ON DELETE SET NULL,
  CONSTRAINT cost_items_account_org_fk FOREIGN KEY (organization_id, account_id)
    REFERENCES public.accounts (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.plan_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  recurring_amount_minor BIGINT CHECK (recurring_amount_minor IS NULL OR recurring_amount_minor >= 0),
  one_time_amount_minor BIGINT CHECK (one_time_amount_minor IS NULL OR one_time_amount_minor >= 0),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  fidelity_rung TEXT NOT NULL DEFAULT 'L3' CHECK (fidelity_rung IN ('L1', 'L2', 'L3', 'L4')),
  cost_basis TEXT NOT NULL DEFAULT 'plan' CHECK (cost_basis IN ('known', 'blended', 'plan', 'cohort_estimate', 'metered')),
  assumptions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (effective_to IS NULL OR effective_to >= effective_from),
  UNIQUE (organization_id, plan_key, effective_from)
);

CREATE TABLE public.budget_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id UUID,
  channel_id UUID,
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  amount_minor BIGINT NOT NULL CHECK (amount_minor >= 0),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'superseded', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  UNIQUE (organization_id, id),
  CONSTRAINT budget_plans_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE CASCADE,
  CONSTRAINT budget_plans_channel_org_fk FOREIGN KEY (organization_id, channel_id)
    REFERENCES public.channels (organization_id, id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uq_active_budget_plan_scope
  ON public.budget_plans (
    organization_id,
    COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(channel_id, '00000000-0000-0000-0000-000000000000'::uuid),
    cadence,
    period_start,
    currency
  ) WHERE status = 'active';

CREATE UNIQUE INDEX uq_budget_plan_scope_version
  ON public.budget_plans (
    organization_id,
    COALESCE(campaign_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(channel_id, '00000000-0000-0000-0000-000000000000'::uuid),
    cadence,
    period_start,
    currency,
    version
  );

CREATE TABLE public.budget_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  budget_plan_id UUID NOT NULL,
  recommended_amount_minor BIGINT NOT NULL CHECK (recommended_amount_minor >= 0),
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  rationale JSONB NOT NULL,
  confidence NUMERIC(5, 4) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'approved', 'rejected', 'applied', 'failed', 'expired')),
  calculation_version TEXT NOT NULL,
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  external_write_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT budget_recommendations_plan_org_fk FOREIGN KEY (organization_id, budget_plan_id)
    REFERENCES public.budget_plans (organization_id, id) ON DELETE CASCADE
);

CREATE TABLE public.revenue_recognition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  conversion_id UUID,
  recognition_start DATE NOT NULL,
  recognition_end DATE NOT NULL,
  recognized_on DATE NOT NULL,
  revenue_type TEXT NOT NULL CHECK (revenue_type IN ('new', 'recurring', 'expansion', 'refund', 'adjustment')),
  amount_minor BIGINT NOT NULL,
  currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
  source TEXT NOT NULL,
  external_ref TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, source, external_ref),
  UNIQUE (organization_id, conversion_id, recognition_start, recognition_end, revenue_type, currency),
  CHECK (recognition_end >= recognition_start),
  CONSTRAINT revenue_recognition_conversion_org_fk FOREIGN KEY (organization_id, conversion_id)
    REFERENCES public.conversions (organization_id, id) ON DELETE SET NULL
);

CREATE INDEX idx_channel_daily_org_date ON public.channel_daily (organization_id, metric_date DESC);
CREATE INDEX idx_cost_items_org_date ON public.cost_items (organization_id, incurred_on DESC, currency);
CREATE INDEX idx_cost_items_fidelity_basis ON public.cost_items (organization_id, fidelity_rung, cost_basis);
CREATE INDEX idx_budget_plans_org_period ON public.budget_plans (organization_id, period_start, period_end);
CREATE INDEX idx_budget_recommendations_org_status ON public.budget_recommendations (organization_id, status, created_at DESC);
CREATE INDEX idx_revenue_recognition_org_date ON public.revenue_recognition (organization_id, recognized_on DESC, currency);

DO $w1_1_rls$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['channel_daily', 'budget_recommendations'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', table_name);
    EXECUTE format('GRANT SELECT ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))', 'org_members_select_' || table_name, table_name);
  END LOOP;

  -- Recommendation decisions and provider writeback are registered actions;
  -- authenticated clients receive no direct UPDATE grant.

  FOREACH table_name IN ARRAY ARRAY['cost_items', 'plan_costs', 'revenue_recognition'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon', table_name);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_org_member(organization_id))', 'org_members_select_' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id) AND created_by = auth.uid())', 'org_editors_insert_' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (public.can_edit_org(organization_id)) WITH CHECK (public.can_edit_org(organization_id))', 'org_editors_update_' || table_name, table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (public.can_edit_org(organization_id))', 'org_editors_delete_' || table_name, table_name);
  END LOOP;

  ALTER TABLE public.budget_plans ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.budget_plans FORCE ROW LEVEL SECURITY;
  REVOKE ALL ON public.budget_plans FROM PUBLIC, anon, authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_plans TO authenticated;
  GRANT ALL ON public.budget_plans TO service_role;
  CREATE POLICY org_members_select_budget_plans ON public.budget_plans
    FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
  CREATE POLICY org_editors_insert_budget_plan_drafts ON public.budget_plans
    FOR INSERT TO authenticated
    WITH CHECK (public.can_edit_org(organization_id) AND created_by = auth.uid() AND status = 'draft');
  CREATE POLICY org_editors_update_budget_plan_drafts ON public.budget_plans
    FOR UPDATE TO authenticated
    USING (public.can_edit_org(organization_id) AND status = 'draft')
    WITH CHECK (public.can_edit_org(organization_id) AND status = 'draft');
  CREATE POLICY org_editors_delete_budget_plan_drafts ON public.budget_plans
    FOR DELETE TO authenticated USING (public.can_edit_org(organization_id) AND status = 'draft');
END
$w1_1_rls$;
