-- Pin search_path on the remaining function missing it
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- Revoke direct EXECUTE on SECURITY DEFINER helpers from API roles.
-- These are only referenced inside RLS policies / triggers, where EXECUTE
-- is not required from the caller's role.
REVOKE EXECUTE ON FUNCTION public.shares_org_with(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.org_role(uuid)        FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid)   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(uuid)    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_edit_org(uuid)    FROM PUBLIC, anon, authenticated;