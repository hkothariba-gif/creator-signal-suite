# Aspen — Codex execution plan

Updated 2026-08-24. This turns `MASTER-BUILD-PLAN.md` into a build sequence. The master
plan owns product scope; this file owns order of operations, change boundaries and release
gates.

## Operating principles

1. Finish and merge Wave 0 before adding new product surfaces.
2. Preserve the existing Lovable/Git history. Use merge commits where branches diverge;
   never rebase or force-push published work.
3. Keep each change independently reviewable. Database changes land as numbered migrations
   with rollback notes; application work lands behind disabled or non-spending states.
4. Money and public actions are never silently automated. Ad pushes create paused campaigns.
5. Treat RLS, consent, attribution honesty and money arithmetic as product behavior, not
   cleanup work.
6. Work autonomously and keep user updates brief. Escalate only decisions that are
   mission-critical, materially change scope, require external authority or cannot be safely
   resolved from repository evidence.

## Stage A — consolidate and establish a baseline

Status: completed 2026-08-24.

- Use this repository as the only working copy.
- Preserve the master plan and missing Ads Engine spec here.
- Archive old phase handoffs and remove the duplicate `phase3-pending` and
  `phase4-pending` source trees.
- Record the starting checks: production build passes; typecheck passes; lint has a
  pre-existing backlog; no automated tests exist.
- B3 was completed and committed separately before consolidation.

Exit: one repository, one plan hierarchy, no duplicate source trees, and an auditable Git
diff separating consolidation from feature work.

## Stage B — finish Wave 0

### B3 · error and loading states

Completed in `56f60f3` and pushed to `origin/uiux-remediation`. Verification covered:

- Every live query has a distinct loading, empty and failure outcome.
- Failures name what failed and provide a retry.
- Discovery preserves the YouTube error instead of converting it to an empty result.
- Skeletons keep page shape stable while data loads.
- Typecheck and production build pass.

Before B4, merge `main` into `uiux-remediation` and resolve forward without rebasing.

### B4 · responsive behavior

Deliver in three review points:

1. Mobile sidebar drawer, keyboard/focus behavior and desktop parity.
2. Mobile-first card grids.
3. Wide data/table treatment and a 375 px route sweep.

Run typecheck and build after each point. Record any remaining overflow by route.

### B5 · accessibility and remaining findings

Deliver the five groups from the UI/UX plan as separate commits: forms/labels,
semantics/roles, shared modal behavior, focus/feedback, then DataGate/copy cleanup.

Before merging Wave 0, add a small test foundation rather than entering Wave 1 with no
safety net. Minimum coverage:

- Pure unit tests for attribution/money helpers as they are introduced.
- Component tests for DataGate's loading/empty/error states and the shared dialog.
- One authenticated route smoke test for the app shell.
- A changed-file lint check in CI while the historical whole-repo lint backlog is burned
  down separately.

Exit: B3–B5 merged to `main`; typecheck and build green; responsive and accessibility
acceptance recorded; a basic test command exists.

## Stage C — freeze Wave 1 contracts

No migration starts until these artifacts are reviewed together:

1. Translate the confirmed D4a contract into the L1–L4 fidelity ladder, customer-supplied
   cohort estimates and event-pipe metering without backend/provider-billing access.
2. Write the complete D1 action vocabulary with inputs, results and
   `silent` / `confirm` / `never-automatic` policy.
3. Write the D2 event contract, identity promotion rules, idempotency keys, data retention
   and deletion behavior.
4. Write the D3 attribution invariants: channel normalization, credit sums, conflict
   recording, maturity windows and per-funnel default models.
5. Write the org-scoping/RLS matrix for every new and affected table.
6. Reconcile `SPEC-spend-and-attribution.md` and `ADS-ENGINE-SPEC.md` with the master plan
   so their superseded exclusions cannot be implemented accidentally.

Exit: approved contracts and a schema map with ownership, keys, indexes, retention and RLS
for every table.

## Stage D — build Wave 1 in bounded PRs

The schema remains one coherent schema PR made of ordered migrations, as required by the
master plan. Runtime behavior follows in smaller PRs:

1. **W1-1 schema:** migrations 4a–4i, org-scoping rewrite, RLS policies, indexes, seed
   rows and migration verification.
2. **W1-2 event ingress:** browser pixel, server ingest, event validation, idempotency,
   consent hooks and observability.
3. **W1-3 identity:** visitor → person → account resolution and safe historical promotion.
4. **W1-4 attribution:** pluggable models, funnel-shape defaults, lag maturity and visible
   claim conflicts.
5. **W1-5 money:** daily channel facts, cost items, currency/minor-unit enforcement,
   fidelity ladder and fully-loaded CAC/LTV gross-profit calculations.
6. **W1-6 actions:** typed registry, confirmation policies and immutable
   `action_invocations` records.

Each PR must include tests for its invariants, realistic seeded fixtures, RLS checks for at
least owner/member/creator/outsider roles, and a written rollback or forward-fix plan.

Exit: Wave 1 data can be ingested, resolved, attributed and costed end to end without a new
dashboard.

## Stage E — Waves 2–7

Follow the dependency order in the master plan:

- Wave 2 makes the spine visible through the Growth Command Center, universal imports and
  recommend-only daily/monthly budget planning; it is design-partner checkpoint 1.
- Wave 3 adds Google and Meta through the shared adapter and remains approval-gated.
- Wave 4 adds the creator portal and is design-partner checkpoint 2.
- Wave 5 adds lifecycle on the same trigger/condition/wait/action engine.
- Wave 6 adds chat, Slack, approvals and the decision log over the D1 action layer.
- Wave 7 updates homepage positioning and can run alongside any build wave once copy is
  settled.

Do not let Wave 3 approval delays idle the project: portal and lifecycle design can proceed,
and Wave 4 implementation may move ahead if the adapter contracts are already stable.

## Parallel work and agent boundaries

Parallel agents are useful only when their write sets do not overlap. Good candidates are
read-only audits, specification reviews, isolated adapter research, test-fixture design and
separate screen work after shared contracts land. Keep a single owner for migrations,
generated database types, the app shell and shared action/identity primitives. Every agent
hands back a diff plus verification evidence; the primary builder integrates and reruns the
full checks.

## External work to start now

Run these outside the engineering critical path. `EXTERNAL-ACCESS-CHECKLIST.md` is the
authoritative list across paid, affiliate, creator and retention platforms:

- Google Ads developer token/basic-access process.
- Meta business verification and App Review preparation.
- LinkedIn Marketing Developer Platform application.
- Reddit Ads API access confirmation.
- Dedicated sending domain/provider and warmup plan.
- Qualified GDPR/CAN-SPAM/data-processing review before lifecycle work ships.

Requirements and approval timelines change, so re-check the official portals when each
application begins.

## Release gate

The end-of-Wave-7 release is ready only when:

- attribution credit is explainable and conflicts are visible;
- all money uses minor units plus currency and reports its fidelity rung;
- RLS/creator isolation and consent paths have passing tests;
- no integration can spend money without an explicit human action;
- sending-domain health, suppression and unsubscribe behavior are verified;
- build, typecheck, tests and the agreed lint gate are green;
- both design-partner checkpoints have been completed and their findings closed or
  consciously deferred.
