-- Ads Center v3-4: brand doc ingestion.
--   brand-docs storage bucket (private; object paths start with the owner's
--   auth.uid(), matching the audience-sheets convention)
--   brand_docs table: one row per uploaded document, user-scoped like ad_corpus
--   ad_corpus.kind gains 'brand_doc' and ad_corpus.source gains 'document' so
--   verbatim excerpts extracted from brand material can join the grounding
--   corpus without touching the engine's comment/transcript sources.

-- ── Widen corpus constraints ─────────────────────────────────────────────────

ALTER TABLE public.ad_corpus DROP CONSTRAINT IF EXISTS ad_corpus_kind_check;
ALTER TABLE public.ad_corpus ADD CONSTRAINT ad_corpus_kind_check
  CHECK (kind IN ('comment', 'transcript', 'conversion_phrase', 'brand_doc'));

ALTER TABLE public.ad_corpus DROP CONSTRAINT IF EXISTS ad_corpus_source_check;
ALTER TABLE public.ad_corpus ADD CONSTRAINT ad_corpus_source_check
  CHECK (source IN ('youtube', 'reddit', 'affiliate', 'document'));

-- ── Uploaded documents ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.brand_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processed', 'failed')),
  excerpt_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_brand_docs_campaign ON public.brand_docs (campaign_id);
CREATE INDEX IF NOT EXISTS idx_brand_docs_user ON public.brand_docs (user_id);

ALTER TABLE public.brand_docs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own brand_docs select" ON public.brand_docs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own brand_docs insert" ON public.brand_docs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own brand_docs update" ON public.brand_docs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own brand_docs delete" ON public.brand_docs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── Storage bucket ───────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-docs', 'brand-docs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Own brand docs read" ON storage.objects;
CREATE POLICY "Own brand docs read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'brand-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Own brand docs write" ON storage.objects;
CREATE POLICY "Own brand docs write" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'brand-docs' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Own brand docs delete" ON storage.objects;
CREATE POLICY "Own brand docs delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'brand-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
