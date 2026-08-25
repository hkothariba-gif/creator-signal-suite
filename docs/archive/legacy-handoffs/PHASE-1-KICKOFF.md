# AspenReach: build Phase 1, ad intelligence and ad creation

## State (do not re-verify, trust this)
- Repo: github.com/hkothariba-gif/creator-signal-suite (public). Phase 0 is merged into `main` (PR #1).
- Live Supabase project `hjxjukueextjejasaxql`: Phase 0 migration applied (organizations, organization_members with admin/editor/reviewer, invitations, affiliates, projects, profiles.account_type, profiles.onboarded). Edge functions `invite-member` and `accept-invite` deployed. `generate-search-criteria` also exists.
- Stack: TanStack Start, React 19, Tailwind v4, shadcn/ui, TanStack Query and Router, Supabase. Use npm (bun is unavailable in the sandbox).

## Conventions already in the codebase (reuse, do not reinvent)
- `src/lib/connectors.functions.ts`: `getConnectorStatus` server fn returns booleans only, never keys. Extend it for new connectors.
- `src/components/app/DataGate.tsx`: every data panel renders through `DataGate`. Exactly "Waiting for API connection" when the integration is not configured or account not connected; exactly "No data to display" when connected but empty. Decide from connector status, not array length.
- Absolute rule: no mock, seeded, or fabricated data anywhere.
- Copy rules: no hyphens or dashes of any kind in user facing copy, no filler words (genuine, meaningful, real), short direct sentences, no unbacked statistics, no definitive compliance claims.
- Secrets: server env or Supabase Edge Function secrets only. Never VITE_ prefixed, never in git, never in the browser bundle. `.env` is gitignored.
- Server auth middleware: `requireSupabaseAuth` in `src/integrations/supabase/auth-middleware.ts`. Service role client: `src/integrations/supabase/client.server.ts`.

## Working method
1. Clone `main` into /tmp in the sandbox, branch `phase-1-ad-intelligence`.
2. Build. Run `npm install`, `npx tsc --noEmit`, and `npx vite build` before committing (vite build also regenerates routeTree for new routes).
3. Write new tables as a migration in `supabase/migrations/` with RLS on (org scoped via `is_org_member` / `can_edit_org` helpers), update `src/integrations/supabase/types.ts` by hand, validate SQL with pglast.
4. At the end: user grants GitHub access through Chrome (mint a fine grained PAT scoped to the repo, Contents + Pull requests write; user completes sudo email verification and clicks Generate; read token from page, push, open PR via the browser compare page since api.github.com is blocked in the sandbox; then delete the token via the browser). Apply any new migration and edge functions to live Supabase through the user's logged in Chrome (SQL editor: inject via `window.monaco.editor.getEditors()[0].setValue(sql)` then Run; Edge functions: Deploy new function Via Editor, inject code base64 decoded through the same monaco trick, set name, Deploy).

## Phase 1 scope (one PR)
Pipeline: pull chatter and sentiment (Brand24, BRAND24_API_KEY), creator content performance (Phyllo, PHYLLO_CLIENT_ID + PHYLLO_SECRET), video stats and comments (YouTube Data API v3, YOUTUBE_API_KEY), posts and search (X API v2, X_API_KEY + X_API_SECRET), Reddit posts and comments (REDDIT_CLIENT_ID + REDDIT_SECRET), trends (TRENDS_API_KEY). Store raw signals in org scoped tables; poll via Supabase cron or edge functions.
Intelligence layer: extract and rank hooks, phrases, and themes from stored signals.
Generation: ad copy through LLM_API_KEY; ad imagery through IMAGE_API_KEY (fal.ai style API). Store generated ads per organization.
Editor: modify copy and imagery, save to push later, share with the team (org members see shared ads; reviewers read only through RLS).
Label mode one ads clearly as not informed by affiliate performance.
Every panel gates through DataGate on its true dependencies; with no keys configured the whole surface shows the waiting state and nothing is fabricated.
Asset storage: Supabase Storage.

## Acceptance
With keys present a brand can generate, edit, save, and share an ad with imagery. With keys absent every dependent panel shows the correct empty state. No mock data. tsc and vite build pass. RLS on all new tables.
