-- Phase 4 outreach.
-- Turns a hotlist creator into a tracked, multi-touch, multi-channel
-- conversation managed inside the app. Four tables, all row level secured to
-- the owning user to match the existing user_id scoped hotlist and campaigns
-- (a later cleanup may migrate these to organization scope alongside those).
--
--   creator_contacts    - discovered ways to reach a creator (email/x/reddit/...)
--   channel_connections - per user sending identity state (no secret material)
--   outreach_threads     - one conversation per creator per campaign per channel
--   outreach_messages    - the message ledger, outbound and inbound
--
-- Text + CHECK is used instead of Postgres enums on purpose: enums are painful
-- to extend and caused a partial-run conflict in Phase 2. Sending the first
-- message flips hotlist.stage to 'contacted' from application code, so no
-- change to hotlist is needed here.

-- Discovered contact points for a hotlist creator. Populated by the
-- discover-contacts edge function (organic: YouTube description + site crawl)
-- and by manual entry. Idempotent on (user, creator, channel, address).
CREATE TABLE IF NOT EXISTS public.creator_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotlist_id UUID NOT NULL REFERENCES public.hotlist(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'x', 'reddit', 'linkedin', 'website')),
  address TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('youtube_description', 'website_crawl', 'apollo', 'hunter', 'manual')),
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  verified BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, hotlist_id, channel, address)
);

CREATE INDEX IF NOT EXISTS idx_creator_contacts_user ON public.creator_contacts (user_id);
CREATE INDEX IF NOT EXISTS idx_creator_contacts_hotlist ON public.creator_contacts (hotlist_id);

DROP TRIGGER IF EXISTS update_creator_contacts_updated_at ON public.creator_contacts;
CREATE TRIGGER update_creator_contacts_updated_at BEFORE UPDATE ON public.creator_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per user sending identity. Presence of an active row flips the matching
-- connector on. No tokens or secrets live here; those stay in Edge Function
-- env / a secrets table, exactly like the Phase 2 provider pattern.
CREATE TABLE IF NOT EXISTS public.channel_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('resend', 'gmail', 'outlook', 'x', 'reddit')),
  from_address TEXT,
  external_account_id TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_channel_connections_user ON public.channel_connections (user_id);

DROP TRIGGER IF EXISTS update_channel_connections_updated_at ON public.channel_connections;
CREATE TRIGGER update_channel_connections_updated_at BEFORE UPDATE ON public.channel_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- One conversation per creator per campaign per channel.
CREATE TABLE IF NOT EXISTS public.outreach_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hotlist_id UUID NOT NULL REFERENCES public.hotlist(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'x', 'reddit', 'linkedin')),
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'replied', 'bounced', 'closed')),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, hotlist_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_outreach_threads_user ON public.outreach_threads (user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_threads_hotlist ON public.outreach_threads (hotlist_id);
CREATE INDEX IF NOT EXISTS idx_outreach_threads_campaign ON public.outreach_threads (campaign_id);

DROP TRIGGER IF EXISTS update_outreach_threads_updated_at ON public.outreach_threads;
CREATE TRIGGER update_outreach_threads_updated_at BEFORE UPDATE ON public.outreach_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- The message ledger. external_id is the provider's message id, used both for
-- idempotent delivery and for matching inbound replies back to a thread.
CREATE TABLE IF NOT EXISTS public.outreach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID NOT NULL REFERENCES public.outreach_threads(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'x', 'reddit', 'linkedin')),
  subject TEXT,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sent', 'delivered', 'failed', 'received')),
  external_id TEXT,
  error TEXT,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_outreach_messages_thread ON public.outreach_messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_user ON public.outreach_messages (user_id);
-- Idempotent inbound/outbound matching per channel when a provider id exists.
CREATE UNIQUE INDEX IF NOT EXISTS uq_outreach_messages_external
  ON public.outreach_messages (user_id, channel, external_id)
  WHERE external_id IS NOT NULL;

-- Row level security: owner-only, mirroring the hotlist/campaigns user_id model.
ALTER TABLE public.creator_contacts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_threads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_messages   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own creator_contacts select" ON public.creator_contacts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own creator_contacts insert" ON public.creator_contacts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own creator_contacts update" ON public.creator_contacts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own creator_contacts delete" ON public.creator_contacts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "own channel_connections select" ON public.channel_connections
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own channel_connections insert" ON public.channel_connections
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own channel_connections update" ON public.channel_connections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own channel_connections delete" ON public.channel_connections
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "own outreach_threads select" ON public.outreach_threads
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own outreach_threads insert" ON public.outreach_threads
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own outreach_threads update" ON public.outreach_threads
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own outreach_threads delete" ON public.outreach_threads
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "own outreach_messages select" ON public.outreach_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own outreach_messages insert" ON public.outreach_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own outreach_messages update" ON public.outreach_messages
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own outreach_messages delete" ON public.outreach_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
