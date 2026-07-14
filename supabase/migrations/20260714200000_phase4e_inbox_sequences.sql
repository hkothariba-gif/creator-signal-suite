-- Phase 4E: bring-your-own inbox (Gmail/Outlook OAuth), multi-touch sequences,
-- and the supporting state for reply polling and enrichment.
--
--   channel_tokens          - OAuth token material. SERVICE ROLE ONLY: RLS is
--                             enabled with no policies, so no client can read
--                             or write it. Edge functions and server code use
--                             the service key. channel_connections stays the
--                             client-visible record (no secrets there).
--   oauth_states            - short-lived CSRF state for the OAuth redirect
--                             dance. Service role only, same pattern.
--   outreach_sequences      - a reusable multi-touch email sequence.
--   outreach_sequence_steps - the ordered steps (delay + subject + body).
--   sequence_enrollments    - one creator progressing through one sequence.
--
-- Text + CHECK instead of enums, per repo convention.

-- ── Token store (service role only) ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.channel_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

DROP TRIGGER IF EXISTS update_channel_tokens_updated_at ON public.channel_tokens;
CREATE TRIGGER update_channel_tokens_updated_at BEFORE UPDATE ON public.channel_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS on, no policies: only the service role can touch token material.
ALTER TABLE public.channel_tokens ENABLE ROW LEVEL SECURITY;

-- ── OAuth state (service role only, short-lived) ────────────────────────────

CREATE TABLE IF NOT EXISTS public.oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  redirect_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- ── Sequences ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.outreach_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_sequences_user ON public.outreach_sequences (user_id);

DROP TRIGGER IF EXISTS update_outreach_sequences_updated_at ON public.outreach_sequences;
CREATE TRIGGER update_outreach_sequences_updated_at BEFORE UPDATE ON public.outreach_sequences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Steps. delay_days is measured from the previous step's send (step 1 sends
-- immediately on enrollment). Email-only in v1, so subject + body suffice.
CREATE TABLE IF NOT EXISTS public.outreach_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.outreach_sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL CHECK (step_order >= 1),
  delay_days INTEGER NOT NULL DEFAULT 0 CHECK (delay_days >= 0),
  subject TEXT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, step_order)
);

CREATE INDEX IF NOT EXISTS idx_sequence_steps_sequence ON public.outreach_sequence_steps (sequence_id);

-- One creator moving through one sequence. current_step = the last step sent
-- (0 before the first send). Stop-on-reply is enforced by the runner.
CREATE TABLE IF NOT EXISTS public.sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES public.outreach_sequences(id) ON DELETE CASCADE,
  hotlist_id UUID NOT NULL REFERENCES public.hotlist(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.outreach_threads(id) ON DELETE SET NULL,
  to_address TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'stopped_replied', 'stopped_manual', 'failed')),
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (sequence_id, hotlist_id)
);

CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_user ON public.sequence_enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_sequence_enrollments_due
  ON public.sequence_enrollments (status, next_send_at);

DROP TRIGGER IF EXISTS update_sequence_enrollments_updated_at ON public.sequence_enrollments;
CREATE TRIGGER update_sequence_enrollments_updated_at BEFORE UPDATE ON public.sequence_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── Row level security (owner-only, mirroring Phase 4 tables) ───────────────

ALTER TABLE public.outreach_sequences      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_enrollments    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own outreach_sequences select" ON public.outreach_sequences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own outreach_sequences insert" ON public.outreach_sequences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own outreach_sequences update" ON public.outreach_sequences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own outreach_sequences delete" ON public.outreach_sequences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "own sequence_steps select" ON public.outreach_sequence_steps
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own sequence_steps insert" ON public.outreach_sequence_steps
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sequence_steps update" ON public.outreach_sequence_steps
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sequence_steps delete" ON public.outreach_sequence_steps
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "own sequence_enrollments select" ON public.sequence_enrollments
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own sequence_enrollments insert" ON public.sequence_enrollments
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sequence_enrollments update" ON public.sequence_enrollments
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own sequence_enrollments delete" ON public.sequence_enrollments
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
