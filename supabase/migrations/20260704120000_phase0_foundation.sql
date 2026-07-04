-- Phase 0 foundation: organizations, members, roles, invitations, affiliates, projects.
-- Brands and affiliates are separate account types on profiles.account_type.
-- Reviewer is read only, enforced at the database through public.can_edit_org.

-- ── Profiles: account type and onboarding flag ───────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'brand'
    CHECK (account_type IN ('brand', 'affiliate'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT false;

-- ── Role enum ────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.org_role AS ENUM ('admin', 'editor', 'reviewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Organizations ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.org_role NOT NULL DEFAULT 'reviewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role public.org_role NOT NULL DEFAULT 'reviewer',
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '14 days'
);

CREATE TABLE IF NOT EXISTS public.affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.invitations (organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations (lower(email));
CREATE INDEX IF NOT EXISTS idx_projects_org ON public.projects (organization_id);

-- ── Helper functions (SECURITY DEFINER avoids RLS recursion) ─────────────────

CREATE OR REPLACE FUNCTION public.org_role(org UUID)
RETURNS public.org_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.organization_members
  WHERE organization_id = org AND user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_org_member(org UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.org_role(org) IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.is_org_admin(org UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.org_role(org) = 'admin';
$$;

-- The edit helper. Reviewer is read only because this returns false for it.
CREATE OR REPLACE FUNCTION public.can_edit_org(org UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.org_role(org) IN ('admin', 'editor');
$$;

REVOKE EXECUTE ON FUNCTION public.org_role(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_org_member(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_org_admin(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_edit_org(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.org_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_org(UUID) TO authenticated;

-- ── Creator becomes admin through a trigger ──────────────────────────────────

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

-- updated_at maintenance
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_affiliates_updated_at ON public.affiliates;
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON public.affiliates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Row level security ───────────────────────────────────────────────────────

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.organizations, public.organization_members, public.invitations,
  public.affiliates, public.projects TO service_role;

-- organizations
DROP POLICY IF EXISTS "Members view org" ON public.organizations;
CREATE POLICY "Members view org" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(id));
DROP POLICY IF EXISTS "Users create org" ON public.organizations;
CREATE POLICY "Users create org" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
DROP POLICY IF EXISTS "Editors update org" ON public.organizations;
CREATE POLICY "Editors update org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (public.can_edit_org(id)) WITH CHECK (public.can_edit_org(id));
DROP POLICY IF EXISTS "Admins delete org" ON public.organizations;
CREATE POLICY "Admins delete org" ON public.organizations
  FOR DELETE TO authenticated USING (public.is_org_admin(id));

-- organization_members
DROP POLICY IF EXISTS "Members view members" ON public.organization_members;
CREATE POLICY "Members view members" ON public.organization_members
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
DROP POLICY IF EXISTS "Admins add members" ON public.organization_members;
CREATE POLICY "Admins add members" ON public.organization_members
  FOR INSERT TO authenticated WITH CHECK (public.is_org_admin(organization_id));
DROP POLICY IF EXISTS "Admins update members" ON public.organization_members;
CREATE POLICY "Admins update members" ON public.organization_members
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));
DROP POLICY IF EXISTS "Admins remove members or self leave" ON public.organization_members;
CREATE POLICY "Admins remove members or self leave" ON public.organization_members
  FOR DELETE TO authenticated
  USING (public.is_org_admin(organization_id) OR user_id = auth.uid());

-- invitations (accepting runs through an Edge Function on the service role)
DROP POLICY IF EXISTS "Admins view invitations" ON public.invitations;
CREATE POLICY "Admins view invitations" ON public.invitations
  FOR SELECT TO authenticated USING (public.is_org_admin(organization_id));
DROP POLICY IF EXISTS "Admins create invitations" ON public.invitations;
CREATE POLICY "Admins create invitations" ON public.invitations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_org_admin(organization_id) AND invited_by = auth.uid());
DROP POLICY IF EXISTS "Admins update invitations" ON public.invitations;
CREATE POLICY "Admins update invitations" ON public.invitations
  FOR UPDATE TO authenticated
  USING (public.is_org_admin(organization_id))
  WITH CHECK (public.is_org_admin(organization_id));
DROP POLICY IF EXISTS "Admins delete invitations" ON public.invitations;
CREATE POLICY "Admins delete invitations" ON public.invitations
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));

-- affiliates (individual accounts, background for now)
DROP POLICY IF EXISTS "Affiliates view own row" ON public.affiliates;
CREATE POLICY "Affiliates view own row" ON public.affiliates
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Affiliates insert own row" ON public.affiliates;
CREATE POLICY "Affiliates insert own row" ON public.affiliates
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Affiliates update own row" ON public.affiliates;
CREATE POLICY "Affiliates update own row" ON public.affiliates
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Teammates can see each other's profile rows so member lists can render
-- names and emails. SECURITY DEFINER avoids RLS recursion.
CREATE OR REPLACE FUNCTION public.shares_org_with(target UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members a
    JOIN public.organization_members b ON a.organization_id = b.organization_id
    WHERE a.user_id = auth.uid() AND b.user_id = target
  );
$$;

REVOKE EXECUTE ON FUNCTION public.shares_org_with(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.shares_org_with(UUID) TO authenticated;

DROP POLICY IF EXISTS "Org members view teammate profiles" ON public.profiles;
CREATE POLICY "Org members view teammate profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.shares_org_with(id));

-- projects
DROP POLICY IF EXISTS "Members view projects" ON public.projects;
CREATE POLICY "Members view projects" ON public.projects
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
DROP POLICY IF EXISTS "Editors create projects" ON public.projects;
CREATE POLICY "Editors create projects" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_org(organization_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS "Editors update projects" ON public.projects;
CREATE POLICY "Editors update projects" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.can_edit_org(organization_id))
  WITH CHECK (public.can_edit_org(organization_id));
DROP POLICY IF EXISTS "Editors delete projects" ON public.projects;
CREATE POLICY "Editors delete projects" ON public.projects
  FOR DELETE TO authenticated USING (public.can_edit_org(organization_id));
