-- Phase 1 ad intelligence and ad creation.
-- Raw signals from social, creator, and trend sources land in org scoped tables.
-- Generated ads live per organization. Row level security scopes everything to
-- the organization. Reviewers are read only because writes gate on can_edit_org.

-- ── Signal source enum ───────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE public.signal_source AS ENUM
    ('brand24', 'phyllo', 'youtube', 'x', 'reddit', 'trends');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Raw signals ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source public.signal_source NOT NULL,
  external_id TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'post'
    CHECK (kind IN ('post', 'comment', 'video', 'mention', 'trend')),
  topic TEXT,
  title TEXT,
  content TEXT,
  author TEXT,
  url TEXT,
  sentiment TEXT CHECK (sentiment IS NULL OR sentiment IN ('positive', 'neutral', 'negative')),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, source, external_id)
);

CREATE INDEX IF NOT EXISTS idx_signals_org ON public.signals (organization_id);
CREATE INDEX IF NOT EXISTS idx_signals_org_source ON public.signals (organization_id, source);
CREATE INDEX IF NOT EXISTS idx_signals_collected ON public.signals (organization_id, collected_at DESC);

-- ── Generated ads ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'Untitled ad',
  headline TEXT,
  body TEXT,
  cta TEXT,
  image_prompt TEXT,
  image_path TEXT,
  target_platform TEXT
    CHECK (target_platform IS NULL OR target_platform IN ('reddit', 'x', 'youtube')),
  -- Mode one ads are not informed by affiliate performance. That arrives in a
  -- later phase, so this stays false until affiliate signals feed generation.
  informed_by_affiliate BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'saved')),
  shared BOOLEAN NOT NULL DEFAULT false,
  insights JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ads_org ON public.ads (organization_id);
CREATE INDEX IF NOT EXISTS idx_ads_org_created ON public.ads (organization_id, created_at DESC);

DROP TRIGGER IF EXISTS update_ads_updated_at ON public.ads;
CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON public.ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Row level security ───────────────────────────────────────────────────────

ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.signals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ads TO authenticated;
GRANT ALL ON public.signals, public.ads TO service_role;

-- signals: members read, editors write. Collection normally runs on the service
-- role through an edge function or an on demand server call.
DROP POLICY IF EXISTS "Members view signals" ON public.signals;
CREATE POLICY "Members view signals" ON public.signals
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
DROP POLICY IF EXISTS "Editors insert signals" ON public.signals;
CREATE POLICY "Editors insert signals" ON public.signals
  FOR INSERT TO authenticated WITH CHECK (public.can_edit_org(organization_id));
DROP POLICY IF EXISTS "Editors delete signals" ON public.signals;
CREATE POLICY "Editors delete signals" ON public.signals
  FOR DELETE TO authenticated USING (public.can_edit_org(organization_id));

-- ads: shared ads are visible to the whole organization; unshared ads only to
-- their author. Reviewers never pass can_edit_org, so they cannot write.
DROP POLICY IF EXISTS "Members view shared or own ads" ON public.ads;
CREATE POLICY "Members view shared or own ads" ON public.ads
  FOR SELECT TO authenticated
  USING (public.is_org_member(organization_id) AND (shared OR created_by = auth.uid()));
DROP POLICY IF EXISTS "Editors create ads" ON public.ads;
CREATE POLICY "Editors create ads" ON public.ads
  FOR INSERT TO authenticated
  WITH CHECK (public.can_edit_org(organization_id) AND created_by = auth.uid());
DROP POLICY IF EXISTS "Editors update ads" ON public.ads;
CREATE POLICY "Editors update ads" ON public.ads
  FOR UPDATE TO authenticated
  USING (public.can_edit_org(organization_id))
  WITH CHECK (public.can_edit_org(organization_id));
DROP POLICY IF EXISTS "Editors delete ads" ON public.ads;
CREATE POLICY "Editors delete ads" ON public.ads
  FOR DELETE TO authenticated USING (public.can_edit_org(organization_id));

-- ── Asset storage ────────────────────────────────────────────────────────────
-- Private bucket for generated ad imagery. Object paths start with the owning
-- organization id, so access scopes to that organization.

INSERT INTO storage.buckets (id, name, public)
VALUES ('ad-images', 'ad-images', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Members read ad images" ON storage.objects;
CREATE POLICY "Members read ad images" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'ad-images'
    AND public.is_org_member((split_part(name, '/', 1))::uuid)
  );
DROP POLICY IF EXISTS "Editors write ad images" ON storage.objects;
CREATE POLICY "Editors write ad images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'ad-images'
    AND public.can_edit_org((split_part(name, '/', 1))::uuid)
  );
DROP POLICY IF EXISTS "Editors update ad images" ON storage.objects;
CREATE POLICY "Editors update ad images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'ad-images'
    AND public.can_edit_org((split_part(name, '/', 1))::uuid)
  );
DROP POLICY IF EXISTS "Editors delete ad images" ON storage.objects;
CREATE POLICY "Editors delete ad images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'ad-images'
    AND public.can_edit_org((split_part(name, '/', 1))::uuid)
  );
