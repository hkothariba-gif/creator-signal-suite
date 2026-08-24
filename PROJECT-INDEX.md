# Aspen — project index

Updated 2026-08-24.

## Source of truth

- Local repository: `/Users/harishyama/Documents/GitHub/creator-signal-suite`
- GitHub remote: `hkothariba-gif/creator-signal-suite`
- Current working branch: `uiux-remediation`
- Lovable is connected to this repository. Never rewrite published history; merge rather
  than rebase, and do not force-push.

The app, database migrations, edge functions, product assets and active plans all live in
this repository. Desktop and Downloads exports are not working copies.

## Read in this order

1. `PROJECT-STATUS.md` — current objective, next work, blockers and what Harish must do.
2. `MASTER-BUILD-PLAN.md` — product scope, locked decisions and Waves 0–7.
3. `EXECUTION-PLAN.md` — the implementation sequence and quality gates for Codex.
4. `DECISIONS-AND-BLOCKERS.md` — material decisions and unresolved product calls.
5. `EXTERNAL-ACCESS-CHECKLIST.md` — API access, credentials setup and external materials.
6. `PRODUCT-FEATURE-LEDGER.md` — feature-level status once created.
7. `SPEC-spend-and-attribution.md` — money conventions and the original spend model.
8. `ADS-ENGINE-SPEC.md` — evidence ladder, tests, formats and adapter interface.
9. `DESIGN-RULES.md` — visual and interaction rules.
10. `aspen-handoff/UIUX-BATCH-PROMPTS.md` — the active Wave 0 B3–B5 acceptance criteria.

The documents in `docs/archive/legacy-handoffs/` are historical context only. They may
explain why existing code looks a certain way, but they do not override the master build
plan.

## Current state

- B2 and B3 are committed; B3 (`56f60f3`) is pushed to `origin/uiux-remediation`.
- Repository consolidation and the active plan hierarchy are handled as separate
  documentation-only checkpoints.
- The branch remains two commits behind `main`; merge `main` before B4 without rebasing.
- Production build passes.
- TypeScript typecheck passes.
- Repository-wide lint is not green. Removing the obsolete `phase3-pending` and
  `phase4-pending` snapshots eliminates a large duplicate source of errors, but the live
  code still has an existing formatting/type lint backlog.
- There is currently no automated test suite in the repository.

## Inputs still missing

- `TRANSCRIPT-BUILD-IDEAS.md`, or the raw podcast transcript for a fresh extraction.
- `NEXT-BUILD-PLAN.md`. Its durable decisions are represented in the master plan, but the
  original file was not found locally.
- The two Ads Engine companion HTML design exports. The written spec is self-contained until
  they are restored.
- Google and Meta craft guides before Wave 3 generation work.
- D4a is confirmed: no backend/provider-billing access; customer-supplied usage cohorts may
  estimate token/service cost, and every CAC figure displays its fidelity level.

## Repository hygiene rules

- Do not create `*-pending` copies of live source trees. Use Git branches and commits.
- Generated `.output`, `.wrangler`, local environment files and `.DS_Store` remain ignored.
- Keep active specifications at the repository root; move superseded handoffs to
  `docs/archive/legacy-handoffs/`.
- Do not modify or discard another session's uncommitted changes without reviewing them.
- Codex handles routine troubleshooting autonomously and reports concise outcomes. Ask Harish
  only for mission-critical product decisions, external authority or genuinely blocking input.
