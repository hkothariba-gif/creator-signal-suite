-- Ads Center v3: widen ads constraints for the campaign-first workspace.
--   status gains approved/archived (library flow draft -> approved -> archived)
--   target_platform gains linkedin (Ads Engine v2 generates for it)
-- Also re-assert the org-helper grants Lovable's security pass revoked, so DB
-- state stays reproducible from migrations.

ALTER TABLE public.ads DROP CONSTRAINT IF EXISTS ads_status_check;
ALTER TABLE public.ads ADD CONSTRAINT ads_status_check
  CHECK (status IN ('draft', 'saved', 'approved', 'archived'));

ALTER TABLE public.ads DROP CONSTRAINT IF EXISTS ads_target_platform_check;
ALTER TABLE public.ads ADD CONSTRAINT ads_target_platform_check
  CHECK (target_platform IS NULL OR target_platform IN ('reddit', 'x', 'youtube', 'linkedin'));

GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_org(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.org_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_org_with(UUID) TO authenticated;
