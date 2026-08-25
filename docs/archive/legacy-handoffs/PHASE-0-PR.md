# Phase 0: foundation, real roles, team invites, no mock data

Branch: `phase-0-foundation` (two commits on top of `main`). Apply with:

```
git checkout -b phase-0-foundation main
git am phase-0-patches/*.patch
git push -u origin phase-0-foundation
```

## What changed

**Database (`supabase/migrations/20260704120000_phase0_foundation.sql`)**
- New tables: `organizations` (with `brand_profile` jsonb), `organization_members` (role enum admin, editor, reviewer), `invitations`, `affiliates`, `projects`.
- `profiles.account_type` (brand or affiliate) and `profiles.onboarded`.
- Creator of an organization becomes its admin through a database trigger.
- Row level security on every new table. Writes gate through the `can_edit_org` helper, so reviewer is read only at the database, not just in the interface.
- Teammates can read each other's profile rows for member lists.
- Migration validated with the Postgres parser (pglast / libpg_query).

**Secrets hygiene**
- `.env` untracked and ignored. No key is read in browser code; the connector status server function returns booleans only.

**Auth and roles**
- The hardcoded admin email gate in `useAuth` is gone. Role now hydrates from `organization_members`, organization and brand profile from `organizations`.
- Admin route reads the real role. Login routes on role and onboarded flag.

**Onboarding**
- Writes `profiles.onboarded` and `organizations.brand_profile` to Supabase. All localStorage persistence removed (step state, intent capture, profile, plan, API keys).

**Team management (Settings, Team tab)**
- Admin invites by email with a chosen role. `invite-member` edge function runs on the service role, emails through Resend when `EMAIL_API_KEY` is set, otherwise returns a shareable link.
- `accept-invite` edge function validates token, expiry, and email match, then adds the member. New route `/invite/$token`.
- Role changes and removals for admins; members can leave.

**No mock data (rule 4)**
- `src/lib/intelligence.ts` mock engine deleted.
- Every data panel renders through the `DataGate` component: live data, exactly "Waiting for API connection" when the integration is not configured or the account is not connected, or exactly "No data to display" when the pipe is open but empty. Choice is made from connector status, not array length.
- `getConnectorStatus` server function reports env var presence as booleans (never keys) for listening, creator performance, YouTube, X, Reddit, trends, LLM, image, email, ads middleware, Stripe, PayPal, identity, plus account level placeholders.
- All fabricated creators, stats, testimonials, revenue charts, activity feeds, usage meters, and waitlist counts removed from landing and app. Real Supabase queries drive campaign and hotlist counts.

**Copy**
- Slogan: "Run affiliate marketing programs to build better advertising and ads."
- Hero repositioned around affiliate data, social chatter, and content scanners building ads.
- Heatmap section covers YouTube, LinkedIn, and Reddit; each shows the waiting state until a source is connected.
- No hyphens, em dashes, or en dashes in user facing copy. No filler words. No unbacked statistics.

## How to test
1. Apply the migration: `supabase db push` (or paste the SQL into the dashboard SQL editor).
2. Deploy edge functions: `supabase functions deploy invite-member accept-invite` and set `EMAIL_API_KEY` (optional) and `APP_ORIGIN` as function secrets.
3. `npm install && npx tsc --noEmit && npm run build` (both pass on this branch).
4. Sign up, complete onboarding: an organization row appears and you are its admin.
5. Settings, Team: invite a second account as reviewer. Accept via the invite link. Confirm the reviewer sees data but every write (profile save, role change, project insert) fails at the database.
6. Confirm every data panel with no configured integration reads "Waiting for API connection", and empty Supabase backed lists read "No data to display".
7. Landing page: confirm slogan, heatmap tabs for YouTube, LinkedIn, Reddit, and no fabricated figures anywhere.

## Acceptance checklist (from the build brief)
- Reviewer cannot write: enforced by RLS through `can_edit_org`.
- Admin can invite and manage members: Team tab plus edge functions.
- No mock data remains anywhere: audited by grep for fake names, numbers, localStorage, and banned words; `intelligence.ts` mock removed.
- Slogan and copy updated.
