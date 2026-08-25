# Phase 2 — Affiliate Tracking (Implementation Plan)

_Plan only. No code has been written. Scope is inferred from the existing codebase (the `affiliates` table, the `/app/affiliate` route, and the `connectors.functions.ts` slots that already reserve `sales`, `stripe`, `paypal`, and `billing` for later phases) and follows the same architecture as Phase 1._

## Goal

Make affiliate performance real: capture clicks, conversions, and revenue per affiliate link, attribute them to organizations, surface them in the Affiliate dashboard, and feed that performance back into the Phase 1 ad-intelligence engine (the "Affiliate & influencer performance" signal input the landing page already advertises).

Payouts (Stripe/PayPal money movement) are explicitly **out of scope** here — that is Phase 4. Phase 2 stops at tracking and reporting.

## What already exists (reuse, do not reinvent)

- `affiliates` table — minimal today: `id`, `user_id`, `display_name`, timestamps.
- `hotlist` table — creators with `cpm`, `score`, `platform`, `campaign_id`.
- `src/routes/app.affiliate.tsx` — renders three metric cards (Total Revenue, Total Conversions, Total Clicks) and an "Affiliate Links" section, all wrapped in `DataGate` and gated on `status.account.sales`, which is currently hardcoded `false`.
- `connectors.functions.ts` — `account.sales` returns `false` with the comment "those tables arrive in later phases."
- Phase 1 patterns to mirror: `assertCanEdit` guard, `createServerFn` + `requireSupabaseAuth`, service-role writes via `supabaseAdmin` (dynamic import), RLS helpers `is_org_member` / `can_edit_org`, the `collect-signals` edge function shape, and the `DataGate` string contract ("Waiting for API connection" vs "No data to display").

## Data model (new migration, RLS on every table)

1. **`affiliate_connections`** — one row per org per provider. `id`, `organization_id`, `provider` (text: `impact` | `partnerstack` | `rakuten` | `cj` | `generic_postback`), `external_account_id`, `status` (`active` | `revoked`), `connected_by`, timestamps. This is what flips `account.sales` to true for an org. No secret material stored in the row — provider API keys stay in Edge Function env; only a non-secret account identifier lives here.
2. **`affiliate_links`** — `id`, `organization_id`, `affiliate_id` (fk `affiliates`), `campaign_id` (fk `campaigns`, nullable), `slug` (unique per org, used for first-party redirect), `destination_url`, `created_by`, timestamps.
3. **`affiliate_events`** — the raw click/conversion ledger. `id`, `organization_id`, `link_id` (fk), `provider`, `external_id`, `type` (`click` | `conversion`), `revenue_minor` (integer, minor units), `currency` (text, ISO 4217), `occurred_at`, `metadata` (jsonb). **Unique(`organization_id`, `provider`, `external_id`)** so ingestion is idempotent (mirrors the signals upsert-on-conflict pattern).
4. **`affiliate_daily`** _(optional rollup)_ — `organization_id`, `link_id`, `day`, `clicks`, `conversions`, `revenue_minor`, `currency`. Populated by a nightly job so the dashboard reads a small table instead of aggregating the full ledger. Can be deferred to a follow-up if we start with on-the-fly aggregation.

RLS: read = `is_org_member(organization_id)`; write = `can_edit_org(organization_id)` (reviewers read-only), exactly as Phase 1. Ingestion writes go through `supabaseAdmin` (service role) from the edge function, not the user client.

## Ingestion (two complementary paths)

- **First-party redirect + click capture** — a lightweight edge function `r` (or `track`) that serves `/<slug>`, logs a `click` event, then 302-redirects to `destination_url`. This gives us click data we own regardless of the network.
- **Server-to-server conversion postbacks** — an edge function `ingest-affiliate` that accepts network postbacks (Impact, PartnerStack, Rakuten, CJ all support S2S postbacks), verifies a shared `AFFILIATE_POSTBACK_SECRET`, and upserts `conversion` events idempotently by `external_id`.
- **Optional scheduled pull** — a `syncAffiliatePerformance` server fn that calls a provider's reporting API (key server-side) to backfill/reconcile, modeled on `collect-signals`. Provider-agnostic core with per-provider adapters.

## Server functions — `src/lib/affiliate.functions.ts`

- `createAffiliateLink` (assertCanEdit) — generates a unique `slug`, stores the link.
- `listAffiliateLinks` — RLS-scoped read.
- `getAffiliatePerformance` — RLS-scoped aggregate feeding the three metric cards and a per-link table (clicks, conversions, revenue, conversion rate). Returns `[]`/zeroes honestly when empty; never fabricates.
- `connectSalesProvider` / `disconnectSalesProvider` (assertCanEdit) — manage `affiliate_connections`.

## Connector status change

`account.sales` must become **org-derived**, not env-only. Since `getConnectorStatus` is currently env-only and has no org context, the plan is to add a small `getAccountConnections` server fn (auth'd, reads the caller's active `affiliate_connections`) and have the Affiliate route use that for the `sales` gate — leaving `getConnectorStatus` for env/key presence. This keeps the existing DataGate contract intact.

## Frontend — `src/routes/app.affiliate.tsx`

- Populate the three metric cards from `getAffiliatePerformance`.
- Add an **Affiliate Links** table: link/slug, clicks, conversions, revenue, conversion rate, with a "Create tracking link" action (editor-only).
- Add a **Connect sales** flow that calls `connectSalesProvider`.
- Keep every panel behind `DataGate`: "Waiting for API connection" until a sales provider is connected, "No data to display" once connected but before events arrive. No mock rows.

## Phase 1 feedback loop

- When `generateAdCopy` uses affiliate-derived themes, set `ads.informed_by_affiliate = true` (the column already exists).
- Extend `buildIntelligence` inputs to include top-performing affiliate angles so the engine can rank creative that actually converted — realizing the "Affiliate & influencer performance" input card on the landing page.

## Build / verify / deploy (per conventions)

New migration in `supabase/migrations/` with RLS on; update `types.ts` by hand; validate with `pglast`. Then `npm install`, `npx tsc --noEmit`, `npx vite build` (regenerates `routeTree.gen.ts` for any new route). Deploy: migration via the Supabase SQL editor, edge functions via the editor, branch + PR via the browser. New Edge Function secrets this phase would need: `AFFILIATE_POSTBACK_SECRET` and any per-provider API keys (e.g. `IMPACT_API_KEY`).

## Decisions I need from you before building

1. **Provider strategy** — start provider-agnostic (generic S2S postback + first-party redirect), or target a specific network first (Impact / PartnerStack / Rakuten / CJ / Amazon Associates)? Recommendation: provider-agnostic core, one adapter first.
2. **Tracking links** — do we own the redirect (first-party click capture via an edge function) or rely solely on the network's tracking? Recommendation: own the redirect.
3. **Rollup table now or later** — build `affiliate_daily` up front, or start with on-the-fly aggregation and add the rollup when volume warrants?
4. **Attribution** — click→conversion attribution window and dedup rules (last-click, N-day window?).

## Rough sequencing

1. Migration + `types.ts` + RLS (tables 1–3, rollup optional).
2. `affiliate.functions.ts` + `getAccountConnections`; wire `account.sales` gate.
3. Edge functions: first-party redirect, then `ingest-affiliate` postback.
4. Affiliate route UI (metrics, links table, connect flow).
5. Phase 1 feedback loop (`informed_by_affiliate`, intelligence inputs).
6. Build, verify, deploy, PR.
