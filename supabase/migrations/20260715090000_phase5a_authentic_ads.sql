-- Phase 5A: Authentic Ads Engine.
-- Grounded ad generation: ads are built only from real language (audience
-- comments, creator transcripts, conversion-backed phrases) plus a campaign
-- "belief doc" — never from tone adjectives. Every generated ad stores its
-- provenance so the brand can see exactly which real quotes shaped it.
--
--   campaigns            + belief-doc columns (beliefs / proof / never-say)
--   ad_corpus            - the grounding material, per campaign, user-scoped
--   ads                  + campaign link and provenance
--
-- Text + CHECK instead of enums, per repo convention.

-- ── Campaign belief doc ──────────────────────────────────────────────────────
-- Replaces tone adjectives as the brand-voice input. Specific beliefs a rival
-- would object to, the decisions that prove them, and lines never to publish.

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS brand_beliefs TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS proof_points TEXT;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS never_say TEXT;

-- ── Grounding corpus ─────────────────────────────────────────────────────────
-- One row per verbatim item. kind:
--   comment           - real audience comment on a campaign creator's content
--   transcript        - excerpt of a creator's spoken words about the topic
--   conversion_phrase - creator/link language that actually converted (Phase 2)

CREATE TABLE IF NOT EXISTS public.ad_corpus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  hotlist_id UUID REFERENCES public.hotlist(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('comment', 'transcript', 'conversion_phrase')),
  source TEXT NOT NULL CHECK (source IN ('youtube', 'reddit', 'affiliate')),
  external_id TEXT NOT NULL,
  author TEXT,
  content TEXT NOT NULL,
  url TEXT,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, campaign_id, kind, external_id)
);

CREATE INDEX IF NOT EXISTS idx_ad_corpus_campaign ON public.ad_corpus (campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_corpus_user ON public.ad_corpus (user_id);

ALTER TABLE public.ad_corpus ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ad_corpus select" ON public.ad_corpus
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own ad_corpus insert" ON public.ad_corpus
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ad_corpus update" ON public.ad_corpus
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own ad_corpus delete" ON public.ad_corpus
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ── Ads: campaign link + provenance ─────────────────────────────────────────
-- provenance = { corpus: [{id, kind, quote}], gates: {swap, groundedness},
-- beliefs_used: bool }. Empty object means a Phase 1 (non-grounded) ad.

ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_ads_campaign ON public.ads (campaign_id);
