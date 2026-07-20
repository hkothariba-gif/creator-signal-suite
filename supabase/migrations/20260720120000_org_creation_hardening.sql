-- Org creation hardening. Onboarding failed live with "new row violates
-- row-level security policy for table organizations" even though the policy
-- below has always permitted it, so the live database drifted from the
-- migrations (a security pass has altered grants out of band before, see
-- 20260719120000). This re-asserts the policy, the table and helper grants
-- that hydrate reads depend on, and the creator-becomes-admin trigger. Org
-- creation itself now also runs server side with the service role, so this is
-- defense in depth. Idempotent. Safe to re-run. No data changes.

DROP POLICY IF EXISTS "Users create org" ON public.organizations;
CREATE POLICY "Users create org" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;

GRANT EXECUTE ON FUNCTION public.org_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_org_with(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin')
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.handle_new_organization() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_organization_created ON public.organizations;
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_organization();
