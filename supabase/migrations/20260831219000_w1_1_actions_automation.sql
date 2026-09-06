-- W1-1 / 4h: append-only action ledger, automation rules, and approvals.

CREATE TABLE public.action_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invocation_key UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  event_type TEXT NOT NULL CHECK (event_type IN ('requested', 'policy_checked', 'approval_requested', 'approved', 'rejected', 'executing', 'succeeded', 'failed', 'cancelled')),
  action_type TEXT NOT NULL,
  action_version INTEGER NOT NULL DEFAULT 1 CHECK (action_version > 0),
  input_hash TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'automation', 'system', 'provider')),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  campaign_id UUID,
  request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  policy_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_summary TEXT,
  causation_id UUID,
  correlation_id UUID,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, invocation_key, sequence_number),
  UNIQUE (organization_id, idempotency_key, sequence_number),
  UNIQUE (organization_id, id),
  CONSTRAINT action_invocations_campaign_org_fk FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id) ON DELETE SET NULL
);

CREATE TABLE public.automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  condition_expression JSONB NOT NULL DEFAULT '{}'::jsonb,
  wait_seconds INTEGER NOT NULL DEFAULT 0 CHECK (wait_seconds >= 0),
  action_type TEXT NOT NULL,
  action_configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_policy TEXT NOT NULL DEFAULT 'always' CHECK (approval_policy IN ('always', 'threshold', 'never')),
  approval_threshold JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT DEFAULT auth.uid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  UNIQUE (organization_id, name, version)
);

CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invocation_key UUID NOT NULL,
  automation_rule_id UUID,
  action_type TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  requested_by_type TEXT NOT NULL CHECK (requested_by_type IN ('user', 'automation', 'system')),
  requested_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
  request_summary JSONB NOT NULL,
  decision_reason TEXT,
  decided_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  UNIQUE (organization_id, invocation_key),
  CONSTRAINT approvals_rule_org_fk FOREIGN KEY (organization_id, automation_rule_id)
    REFERENCES public.automation_rules (organization_id, id) ON DELETE SET NULL
);

CREATE INDEX idx_action_invocations_org_key ON public.action_invocations (organization_id, invocation_key, sequence_number);
CREATE INDEX idx_action_invocations_org_time ON public.action_invocations (organization_id, occurred_at DESC);
CREATE INDEX idx_automation_rules_org_status ON public.automation_rules (organization_id, status);
CREATE INDEX idx_automation_rules_trigger ON public.automation_rules (organization_id, status, trigger_type);
CREATE INDEX idx_approvals_org_status ON public.approvals (organization_id, status, requested_at DESC);
CREATE INDEX idx_approvals_assignee_status ON public.approvals (organization_id, assigned_to, status, expires_at);

CREATE VIEW public.action_invocations_redacted
WITH (security_barrier = true)
AS
SELECT organization_id, id, invocation_key, sequence_number, event_type, action_type,
  action_version, actor_type, actor_user_id, campaign_id, error_summary,
  causation_id, correlation_id, occurred_at
FROM public.action_invocations
WHERE public.is_org_member(organization_id);

REVOKE ALL ON public.action_invocations_redacted FROM PUBLIC, anon;
GRANT SELECT ON public.action_invocations_redacted TO authenticated;

CREATE OR REPLACE FUNCTION public.reject_action_invocation_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'action_invocations is append-only; append a new event instead';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_action_invocation_mutation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER action_invocations_are_append_only
  BEFORE UPDATE OR DELETE ON public.action_invocations
  FOR EACH ROW EXECUTE FUNCTION public.reject_action_invocation_mutation();

CREATE OR REPLACE FUNCTION public.decide_approval(
  target_approval_id UUID,
  expected_input_hash TEXT,
  decision TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS public.approvals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approval_row public.approvals;
BEGIN
  IF decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Approval decision must be approved or rejected';
  END IF;

  SELECT * INTO approval_row
  FROM public.approvals
  WHERE id = target_approval_id
  FOR UPDATE;

  IF NOT FOUND OR NOT public.is_org_member(approval_row.organization_id) THEN
    RAISE EXCEPTION 'Approval is not available';
  END IF;
  IF approval_row.status <> 'pending' THEN
    RAISE EXCEPTION 'Approval has already transitioned';
  END IF;
  IF approval_row.expires_at IS NOT NULL AND approval_row.expires_at <= now() THEN
    RAISE EXCEPTION 'Approval has expired';
  END IF;
  IF approval_row.input_hash <> expected_input_hash THEN
    RAISE EXCEPTION 'Approval input changed; request a new approval';
  END IF;
  IF NOT public.can_edit_org(approval_row.organization_id)
    AND approval_row.assigned_to IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Approval is not assigned to this actor';
  END IF;

  UPDATE public.approvals
  SET status = decision,
      decision_reason = reason,
      decided_by = auth.uid(),
      decided_at = now()
  WHERE id = target_approval_id
  RETURNING * INTO approval_row;

  RETURN approval_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.decide_approval(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decide_approval(UUID, TEXT, TEXT, TEXT) TO authenticated;

ALTER TABLE public.action_invocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_invocations FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.action_invocations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.action_invocations TO service_role;

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.automation_rules FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automation_rules TO authenticated;
GRANT ALL ON public.automation_rules TO service_role;
CREATE POLICY org_members_select_automation_rules ON public.automation_rules
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY org_editors_insert_automation_rules ON public.automation_rules
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_org(organization_id) AND created_by = auth.uid() AND status = 'draft');
CREATE POLICY org_editors_update_automation_rules ON public.automation_rules
  FOR UPDATE TO authenticated
  USING (public.can_edit_org(organization_id) AND status = 'draft')
  WITH CHECK (public.can_edit_org(organization_id) AND status = 'draft');
CREATE POLICY org_editors_delete_automation_rules ON public.automation_rules
  FOR DELETE TO authenticated USING (public.can_edit_org(organization_id) AND status = 'draft');

ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.approvals FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.approvals TO authenticated;
GRANT ALL ON public.approvals TO service_role;
CREATE POLICY org_members_select_approvals ON public.approvals
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
