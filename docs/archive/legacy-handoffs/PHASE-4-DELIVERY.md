# Phase 4 — Outreach: Delivery Notes

_Built 2026-07-14. Multi-channel outreach first release. Code is staged into the working tree and mirrored durably in `phase4-pending/`._

## What's built (this release)

- **Data model** — migration `supabase/migrations/20260714120000_phase4_outreach.sql`: `creator_contacts`, `channel_connections`, `outreach_threads`, `outreach_messages`, all RLS-scoped to the owner (matches the hotlist/campaigns `user_id` model). `types.ts` updated by hand with the 4 tables.
- **Organic contact discovery** — `src/lib/contact-discovery.functions.ts` (`discoverCreatorContacts`): reads the YouTube channel description → extracts website + X/Reddit/LinkedIn handles → crawls the site (+/contact,/about) for a `mailto:`/email → writes `creator_contacts`. No paid provider needed; degrades gracefully without the YouTube key.
- **Multi-channel send** — `src/lib/outreach.functions.ts` (`sendOutreachMessage`) with per-channel adapters: **email** via Resend from the brand's domain (CAN-SPAM footer auto-appended), **X DM** via API v2, **Reddit DM** via `/api/compose`, **LinkedIn assisted** (returns a prefilled compose deep-link the brand sends manually, still logged). Sending finds/creates a thread, logs the message, and advances the hotlist stage `saved → contacted`.
- **Composer** — `src/components/app/OutreachComposer.tsx`: discover contacts, pick a channel, pick/enter an address, write, send. Opened from the creator profile ("Contact Creator" now works) and from the inbox.
- **Unified inbox** — `src/routes/app.outreach.tsx` rewritten: campaign-scoped threads list + conversation view across all channels + reply composer.
- **Reply capture** — edge function `supabase/functions/ingest-outreach-reply/index.ts`: an inbound webhook (Resend inbound email today) matches a reply to its thread (by in-reply-to id or thread token), appends an inbound message, flips the thread to `replied`, and advances `contacted → negotiating`. Shared-secret gated.

## Deferred to a fast-follow (not in this cut)

Multi-touch **sequences** (templated steps with delays + stop-on-reply) and the **delivery-metrics** panel (send/open/reply counts); Reddit inbox polling and X Account-Activity inbound; paid enrichment (Apollo/Hunter). The scope doc's 4-6 covers these.

## Verify before pushing (do this first)

```
cd ~/Downloads/aspenreach-handoff/creator-signal-suite
rm -f .git/index.lock 2>/dev/null
npx tsc --noEmit && npx vite build
```

Hand-edited `types.ts` and new server functions are where type errors hide, so this local build is the real check. If it's green, we push. If not, paste the errors and they get fixed before anything touches `main`.

## To make it actually send (Supabase deploy + secrets)

1. Run the migration in the Supabase SQL editor (project `hjxjukueextjejasaxql`).
2. Deploy the edge function: `npx supabase functions deploy ingest-outreach-reply --no-verify-jwt --project-ref hjxjukueextjejasaxql`.
3. Set secrets (via `npx supabase secrets set` / dashboard): `EMAIL_API_KEY` (Resend) + `OUTREACH_FROM_ADDRESS` (a verified Resend domain address) + optional `OUTREACH_UNSUBSCRIBE_URL` / `OUTREACH_POSTAL_ADDRESS` (CAN-SPAM); `OUTREACH_INBOUND_SECRET` (for the reply webhook); and, per channel, `X_BEARER_TOKEN` (X DM), `REDDIT_ACCESS_TOKEN` (Reddit DM). `YOUTUBE_API_KEY` (already reserved) powers discovery.
3. Point Resend inbound (or your ESP) at `.../functions/v1/ingest-outreach-reply?secret=<OUTREACH_INBOUND_SECRET>`.

Each channel stays dormant behind its DataGate until its secret is set — email works first, the rest light up as keys are added. LinkedIn needs no key (manual-assisted).
