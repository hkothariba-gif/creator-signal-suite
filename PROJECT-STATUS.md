# Aspen — project status

Updated 2026-09-06. Operational control panel only. Scope lives in
`MASTER-BUILD-PLAN.md`, order in `EXECUTION-PLAN.md`, and feature evidence in
`PRODUCT-FEATURE-LEDGER.md`.

## NOW

- **`W1-1` complete and ready to commit on `codex/w1-1-schema`:** a trusted live-schema
  snapshot plus all eleven migrations replay from blank locally. The 55-table contract,
  five-role RLS matrix, quarantine drill and checked-in generated types pass.
- No live database has been changed. Provider calls and Wave 1 runtime/UI remain outside
  this schema-only delivery.

## NEXT

1. Review and commit `W1-1` without rewriting published history.
2. Push the feature branch and open the normal review path when requested.
3. Begin `W1-2` event ingress only after the W1-1 commit/review checkpoint.

## WAITING ON HARISH

- Start and date the access actions in `EXTERNAL-ACCESS-CHECKLIST.md`; never commit secrets.
- Nominate 5–10 B2B SaaS design partners and agree their data/feedback permissions.
- Obtain representative cross-channel and creator/payment exports for import design.
- Source Google and Meta ad-craft guides before Wave 3 generation work.
- Choose a lifecycle sending domain/provider and arrange qualified privacy/email review
  before Wave 5 release work.

## BLOCKED

- No current blocker prevents committing W1-1. Applying its migrations to live Supabase is
  a separate reviewed operation and must run the ownership preflight first.
- Native paid import/reporting/writeback is externally gated by Google, Meta, LinkedIn and
  Reddit access; universal CSV/manual import is not.
- Imported-campaign adoption rules must be approved before native writeback, not before
  read-only import.
- Native provider work remains gated, but it is outside `W1-1`.

## RECENTLY COMPLETED

- Captured the linked project's schema without data, replayed it with W1-1 from blank, reran
  all security/quarantine checks and checked in the authoritative generated TypeScript map.
- Replayed all eleven W1-1 migrations in Docker/Supabase, corrected the unsupported UUID
  aggregate, passed the five-role RLS matrix and cross-org/append-only/import-safety checks,
  and proved ambiguous ownership is quarantined and stops the rewrite.
- Drafted the full `W1-1` schema set: 55 new organisation-owned business tables, 11 legacy
  ownership targets, forced RLS, composite tenant keys, seeds, import read-only defaults,
  minor-unit money and an append-only action ledger.
- Added a non-destructive ownership quarantine and an executable final migration contract;
  ambiguous legacy ownership stops the migration instead of being guessed.
- Harish approved the complete Stage C action, event/identity, attribution, money/fidelity,
  organisation/RLS and schema package, including conversation and creative-generation scope.
- The plan now states unambiguously that Aspen's native affiliate program is the core
  product, with planned PartnerStack, Rewardful, impact.com and CJ Affiliate import adapters
  after universal CSV; none is a runtime dependency.
- Stage C now has one consolidated 4a–4i schema/contract review package, and both older
  implementation specs point to its controlling boundaries.
- The durable plan and feature ledger now explicitly cover a conversational campaign
  builder and a staged, evidence-grounded creative strategy/hook system.
- PR #9 merged the Wave 0 remediation history to `main` without squashing or rebasing.
- Follow-up `cc336f9` cleared the pull-request lint gate; both push and pull-request quality
  workflows passed.
- B6 established 3 automated test files/5 tests, changed-file lint CI, CSRF protection and
  a zero-vulnerability dependency audit.
- B4–B5 completed responsive containment, accessible navigation/forms/dialogs/focus and
  reliable loading, error and empty-state presentation across the authenticated app.
- The feature ledger reconciles the Growth Command Center, budget recommendations and
  cross-channel imports as mission-critical Wave 2 scope.

## HEALTH

- **Git:** working on `codex/w1-1-schema` from approved Stage C commit `504e501`; W1-1 is not
  committed or pushed yet. Never rebase or force-push Lovable history.
- **Typecheck/build:** passing; existing framework deprecation/chunk warnings remain.
- **Tests:** 3 files/5 tests passing for DataGate, shared dialog and authenticated app shell.
- **Schema:** trusted-baseline replay, 11 migrations, 55 new tables, 11 legacy ownership
  targets, five-role security, quarantine drill and generated types all pass.
- **Security:** CSRF startup warning resolved; `npm audit` reports zero vulnerabilities.
- **Lint:** changed-file CI gate is active; historical whole-repository backlog remains.
