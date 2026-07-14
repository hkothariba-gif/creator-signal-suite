# Phase 4E — Delivery Notes (built 2026-07-14)

BYO inbox (Outlook + Gmail OAuth), Outlook reply capture, Reddit inbox polling,
multi-touch sequences with stop-on-reply, delivery metrics, and a dormant
Apollo/Hunter enrichment adapter.

## What was built

**New tables** (migration `20260714200000_phase4e_inbox_sequences.sql`):
`channel_tokens` + `oauth_states` (service-role only — RLS on, no policies),
`outreach_sequences`, `outreach_sequence_steps`, `sequence_enrollments`
(owner-scoped RLS). `types.ts` updated by hand.

**Server code**
- `src/lib/email-oauth.functions.ts` — `getEmailOAuthStatus`, `startEmailOAuth`, `disconnectEmailAccount`.
- `src/lib/email-providers.server.ts` — token refresh + `sendViaOutlook` (draft→send, captures `internetMessageId`/`conversationId`) + `sendViaGmail` (raw MIME).
- `src/lib/outreach.functions.ts` — email adapter now prefers the user's connected mailbox, falls back to Resend; stores send metadata; new `getOutreachMetrics`.
- `src/lib/sequences.functions.ts` — sequence CRUD, enroll/stop, enrollments list.
- `src/lib/contact-discovery.functions.ts` — Hunter → Apollo enrichment fallback when organic finds no email (dormant until `HUNTER_API_KEY`/`APOLLO_API_KEY` set).
- `src/lib/connectors.functions.ts` — new `enrichment` connector flag.

**Edge functions** (all deploy `--no-verify-jwt`)
- `oauth-email-callback` — token exchange, mailbox identity, stores tokens, upserts connection, redirects back to `/app/outreach`.
- `poll-email-replies` — Outlook inbox → threads via `conversation_id`, flips replied + hotlist stage. (Cron)
- `poll-reddit-inbox` — unread Reddit PMs → threads via creator contact handle; marks matched mail read. (Cron)
- `run-sequences` — due enrollments: stop-on-reply, send next step as the user (Outlook/Gmail/Resend), schedule following step. (Cron)

**UI**
- `src/components/app/OutreachPanels.tsx` — Email accounts card (connect/disconnect), Delivery metrics, Sequences builder + enrollments.
- `src/routes/app.outreach.tsx` — "Sending & automation" section + post-OAuth toasts.
- `src/components/app/OutreachComposer.tsx` — "Sending as …" identity line; enroll-in-sequence option.

## Deploy (in order)

1. **Local build check:** `npx tsc --noEmit && npx vite build`, then commit + `git push` from Terminal (pull/merge first if main diverged).
2. **Migration:** paste the contents of `supabase/migrations/20260714200000_phase4e_inbox_sequences.sql` into the SQL editor and run.
3. **Edge functions:**
   ```
   npx supabase functions deploy oauth-email-callback --no-verify-jwt --project-ref hjxjukueextjejasaxql
   npx supabase functions deploy poll-email-replies --no-verify-jwt --project-ref hjxjukueextjejasaxql
   npx supabase functions deploy poll-reddit-inbox --no-verify-jwt --project-ref hjxjukueextjejasaxql
   npx supabase functions deploy run-sequences --no-verify-jwt --project-ref hjxjukueextjejasaxql
   ```
4. **Secrets** (one line each, values from the app registrations below):
   ```
   npx supabase secrets set MS_CLIENT_ID=... MS_CLIENT_SECRET=... APP_BASE_URL=https://<your-app-domain> --project-ref hjxjukueextjejasaxql
   npx supabase secrets set GMAIL_CLIENT_ID=... GMAIL_CLIENT_SECRET=... --project-ref hjxjukueextjejasaxql
   ```
   Also set `MS_CLIENT_ID`/`MS_CLIENT_SECRET`/`GMAIL_CLIENT_ID`/`GMAIL_CLIENT_SECRET`/`APP_BASE_URL` in the app host's env (server functions read `process.env`). Optional later: `HUNTER_API_KEY` or `APOLLO_API_KEY`.
5. **Cron** (SQL editor; needs the `pg_cron` + `pg_net` extensions enabled under Database → Extensions). Replace `<SECRET>` with the value of `OUTREACH_INBOUND_SECRET`:
   ```sql
   select cron.schedule('poll-email-replies', '*/10 * * * *', $$
     select net.http_post(
       url := 'https://hjxjukueextjejasaxql.supabase.co/functions/v1/poll-email-replies',
       headers := jsonb_build_object('x-inbound-secret', '<SECRET>'));
   $$);
   select cron.schedule('poll-reddit-inbox', '*/15 * * * *', $$
     select net.http_post(
       url := 'https://hjxjukueextjejasaxql.supabase.co/functions/v1/poll-reddit-inbox',
       headers := jsonb_build_object('x-inbound-secret', '<SECRET>'));
   $$);
   select cron.schedule('run-sequences', '*/15 * * * *', $$
     select net.http_post(
       url := 'https://hjxjukueextjejasaxql.supabase.co/functions/v1/run-sequences',
       headers := jsonb_build_object('x-inbound-secret', '<SECRET>'));
   $$);
   ```

## OAuth app setup

**Outlook (Azure, free):** portal.azure.com → Microsoft Entra ID → App registrations → New.
Supported account types: *Accounts in any organizational directory and personal Microsoft accounts*.
Redirect URI (type **Web**): `https://hjxjukueextjejasaxql.supabase.co/functions/v1/oauth-email-callback`.
Then: Certificates & secrets → New client secret (this is `MS_CLIENT_SECRET`; the Application (client) ID is `MS_CLIENT_ID`). API permissions → Microsoft Graph → Delegated → `Mail.Send`, `Mail.Read`, `User.Read`, `offline_access`. No admin consent needed for personal accounts.

**Gmail (Google Cloud, free):** console.cloud.google.com → new project → APIs & Services → enable **Gmail API** → OAuth consent screen (External; add yourself as a test user — Testing mode is fine until public launch) → Credentials → OAuth client ID (type **Web application**) with the same redirect URI as above. Scope used: `gmail.send` only (send-only avoids the restricted-scope CASA audit; production/public use will need Google app verification — a launch-hardening item).

## Test plan

1. Outreach page → Email accounts → Connect Outlook → approve → lands back with "Outlook connected" and your address shown.
2. Composer from a creator profile → "Sending as you@… (Outlook)" → send → mail arrives from your real address and appears in your Outlook Sent folder.
3. Reply to that mail from another account → within 10 min the thread flips to "replied" and the creator moves to *negotiating*.
4. Create a 2-step sequence → enroll a creator (your own email as address) → step 1 arrives on the next runner tick; reply and confirm step 2 never sends (`stopped_replied`).
5. Delivery metrics panel shows the sends/replies; failed sends surface with errors on the message.

## Known limits

- Gmail reply capture intentionally out (CASA audit) — replies live in the user's Gmail inbox; stages advance manually or via a later phase.
- Outlook reply matching uses `conversationId`, so replies to mail sent *before* 4E (via Resend) still only arrive through the existing `ingest-outreach-reply` webhook.
- Sequences are email-only in v1. X inbound DMs still not captured (Account Activity API is gated/paid).
- Reddit polling uses the platform token — replies to any user's outreach are matched by creator handle.
