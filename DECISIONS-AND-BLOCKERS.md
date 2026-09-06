# Aspen — decisions and blockers

Updated 2026-09-06. Record only decisions that materially affect scope, architecture,
sequencing, safety or external authority. Feature delivery state belongs in
`PRODUCT-FEATURE-LEDGER.md`.

## Approved control system

- Repository documents, not task memory, are authoritative.
- Hierarchy is fixed: `MASTER-BUILD-PLAN.md` owns scope; `EXECUTION-PLAN.md` owns order and
  gates; `PRODUCT-FEATURE-LEDGER.md` owns stable feature IDs/evidence;
  `PROJECT-STATUS.md` owns current operations; this file owns material decisions/blockers;
  `EXTERNAL-ACCESS-CHECKLIST.md` owns access work.
- Update project status after every bounded delivery and update ledger rows without changing
  or recycling stable IDs.
- Codex handles routine implementation and verification autonomously. Harish is asked only
  for material scope, external authority, review gates or genuinely blocking inputs.
- Published Lovable-connected history is never rebased, amended or force-pushed.
- The complete Stage C contract package was approved by Harish on 2026-08-31; bounded Wave
  1 work may begin with `W1-1`, while provider and public-action gates remain unchanged.

## Approved mission-critical product pillars

1. **Unified Growth Command Center (`W2-CMD-001`).** One operating view covers paid,
   retention, affiliate and creator performance, spend, pacing and core metrics. Attribution
   conflicts and cost-fidelity omissions remain visible.
2. **Budget planning and controlled recommendations (`W2-BUD-001`, `W2-BUD-002`,
   `W3-SAFE-001`).** Users plan daily/monthly budgets. Aspen recommends with evidence and
   constraints. Wave 2 is recommend-only; later provider writeback requires an explicit
   human-confirmed action, creates campaigns paused and never spends automatically.
3. **Existing-campaign import (`W2-IMP-001`, `W2-IMP-002`, `W3-CAM-001`, `W4-IMP-001`,
   `W5-ESP-001`).** Universal CSV/manual mapping ships first across paid, affiliate, creator
   and retention. Native imports follow access. All imports default to read-only mirrors.

These are release scope, not optional extensions. They do not change the wave hierarchy:
the common channel, identity, attribution, money and action contracts still land first.

## Approved architecture and safety decisions

- **D1 action vocabulary:** one typed action set serves app, chat, Slack, portal,
  automation and the decision log. Money/public actions require confirmation.
- **D2 event/identity spine:** visitor → person → account, with conversions attaching at
  the level actually resolved and model defaults selected per funnel shape.
- **D3 channel model:** every source uses one channel model; attribution credit sums to one
  and overlapping platform claims create visible conflicts.
- **D4 money spine:** bigint minor units plus currency, actual spend at daily grain, no
  invented currency conversion, and honest null/zero handling.
- **D4a cost fidelity:** L1 known, L2 blended, L3 per-plan/cohort-estimated, L4 metered from
  customer-posted events. Aspen never accesses customer backends or provider billing APIs;
  every CAC/return shows fidelity and missing inputs.
- **D5 automation engine:** ads rules, lifecycle journeys and decision queues share
  trigger → condition → wait → action.
- **Conversational campaign orchestration:** a Wave 6 conversation compiles a versioned
  brief, plan and private drafts over D1. It may propose registered actions but cannot
  bypass confirmation. Provider push and campaign activation are separate actions; push
  remains paused and activation is never automatic.
- **Creative reasoning pipeline:** Ads Engine generation is a staged brief → evidence →
  strategy → angle/hook matrix → candidate → validation → quality-ranking workflow, not a
  generic one-call copy prompt. Grounding is a hard gate; rubric scores never pose as
  predicted performance, and only mature/minimum-sample outcomes may inform later work.
- Organisation scoping/RLS is part of the Wave 1 contract and migration, not deferred
  cleanup. Creator-visible data must be walled by brand relationship.
- **W1-1 migration safety:** ownership backfill is forward-only and preflighted. Any legacy
  owner mapped to zero or multiple organisations is retained in a service-only quarantine;
  the ownership migration stops rather than guessing, moving or deleting customer data.
- Generated Supabase types must come from an applied isolated schema. They are never
  hand-edited to simulate generation, and the live database is not a migration test target.
- **Historical migration drift:** the live/generated schema contains `campaigns` and
  `hotlist` without a checked-in creator migration, while a later affiliate migration
  repeats non-idempotent objects and an earlier hardening migration revokes a missing
  `rls_auto_enable()` function. The trusted live snapshot confirms those objects and replays
  cleanly with W1-1. Published files remain immutable; W1-1 deploys forward onto the live
  schema after its ownership preflight rather than rewriting historical migration records.
- Native campaign adoption/writeback is an explicit audited state change. Current approved
  ceiling is recommendation plus human confirmation; no autonomous budget limit is approved.

## Approved connector priority

- **Paid:** Google Ads, Meta Ads and LinkedIn Ads; Reddit feasibility next. YouTube uses
  Google Ads. X remains discovery/export-only.
- **Affiliate:** Aspen-native recruitment, links, attribution, commissions and payouts are
  the core product. Universal CSV/manual migration comes first. Direct import adapters for
  PartnerStack, Rewardful, impact.com and CJ Affiliate are planned, ordered by usable
  customer-authorized access and design-partner demand. None is an Aspen runtime dependency.
- **Creator:** universal CSV first, then GRIN; CreatorIQ/Aspire are demand-led feasibility.
- **Retention:** HubSpot and Customer.io first, Klaviyo next, Braze later.

Implementation order within these tiers follows usable access and design-partner evidence.
Requirements must be rechecked in official provider portals when applications begin.

## Approved scope boundaries

- **Cut:** Google Shopping, push notifications, X ads management, LinkedIn personal-DM
  automation and provider billing-API connectors.
- **Parked:** newsletters as a supply type, MMM/holdouts, TikTok/Instagram/Meta organic,
  paywall/trial UI, growth school and full AI-video origination.
- **LinkedIn route:** official paid Conversation/Sponsored Messaging plus a human-assisted
  queue only.
- **Release:** one public launch after Wave 7, with private design-partner checkpoints after
  Waves 2 and 4. Initial design partners receive free private access.

## Open decisions — timed, not current blockers

| Decision                              | Default until decided                          | Needed by                         | Harish required                                                   |
| ------------------------------------- | ---------------------------------------------- | --------------------------------- | ----------------------------------------------------------------- |
| Imported campaign adoption conditions | Stay `read_only`; no provider writeback        | Before `W3-CAM-001` writeback     | Approve provider eligibility, ownership proof and rollback rules. |
| Autonomous budget ceiling             | No autonomous adjustment                       | Any proposal beyond `W3-SAFE-001` | New explicit scope/safety approval.                               |
| Connector order after Tier 1          | Follow design-partner demand and usable access | Before later-adapter contracts    | Nominate partners and validate platform usage.                    |
| Public launch authorization           | One launch after Wave 7 gates                  | `W7-REL-001`                      | Approve after release evidence is presented.                      |
| Podcast second pass                   | Existing extraction/master scope stands        | Optional                          | Re-upload transcript if wanted.                                   |

## External blockers and owners

| Gate                                          | Blocks                                        | Current state | Harish action                                              |
| --------------------------------------------- | --------------------------------------------- | ------------- | ---------------------------------------------------------- |
| Google Ads developer token/OAuth/basic access | Native Google import, reporting and writeback | not-started   | Confirm manager account and request token.                 |
| Meta verification/app advanced access         | Native Meta import, reporting and writeback   | not-started   | Begin business verification and create app.                |
| LinkedIn Marketing approval                   | Native LinkedIn paid import/messaging         | not-started   | Submit application.                                        |
| Reddit Ads API route                          | Reddit native adapter                         | not-started   | Confirm access/partner route.                              |
| Representative CSV exports                    | Universal import mapping quality              | not-started   | Obtain paid/affiliate/creator/retention samples.           |
| Google/Meta craft guides                      | Grounded generation for those platforms       | not-started   | Supply approved materials.                                 |
| Sending domain/provider and DNS               | Production lifecycle delivery                 | not-started   | Choose provider/domain and retain DNS access.              |
| Qualified GDPR/CAN-SPAM/DPA review            | Identity/lifecycle release gates              | not-started   | Engage qualified reviewer.                                 |
| Design partners/data permission               | Wave 2 and Wave 4 checkpoints                 | not-started   | Nominate companies/creators and agree cadence/permissions. |

None of these external items blocks the current W1-1 schema review. Universal CSV/manual
import can be built without native provider approvals. Stage C is approved and Wave 1
implementation has begun; provider/runtime work remains sequenced after the schema gate.
