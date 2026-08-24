# Aspen — decisions and blockers

Updated 2026-08-24. Record only decisions that materially affect scope, architecture,
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
- Organisation scoping/RLS is part of the Wave 1 contract and migration, not deferred
  cleanup. Creator-visible data must be walled by brand relationship.
- Native campaign adoption/writeback is an explicit audited state change. Current approved
  ceiling is recommendation plus human confirmation; no autonomous budget limit is approved.

## Approved connector priority

- **Paid:** Google Ads, Meta Ads and LinkedIn Ads; Reddit feasibility next. YouTube uses
  Google Ads. X remains discovery/export-only.
- **Affiliate:** PartnerStack and Rewardful; impact.com feasibility next.
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

| Decision | Default until decided | Needed by | Harish required |
| --- | --- | --- | --- |
| Imported campaign adoption conditions | Stay `read_only`; no provider writeback | Before `W3-CAM-001` writeback | Approve provider eligibility, ownership proof and rollback rules. |
| Autonomous budget ceiling | No autonomous adjustment | Any proposal beyond `W3-SAFE-001` | New explicit scope/safety approval. |
| Connector order after Tier 1 | Follow design-partner demand and usable access | Before later-adapter contracts | Nominate partners and validate platform usage. |
| Public launch authorization | One launch after Wave 7 gates | `W7-REL-001` | Approve after release evidence is presented. |
| Podcast second pass | Existing extraction/master scope stands | Optional | Re-upload transcript if wanted. |

## External blockers and owners

| Gate | Blocks | Current state | Harish action |
| --- | --- | --- | --- |
| Google Ads developer token/OAuth/basic access | Native Google import, reporting and writeback | not-started | Confirm manager account and request token. |
| Meta verification/app advanced access | Native Meta import, reporting and writeback | not-started | Begin business verification and create app. |
| LinkedIn Marketing approval | Native LinkedIn paid import/messaging | not-started | Submit application. |
| Reddit Ads API route | Reddit native adapter | not-started | Confirm access/partner route. |
| Representative CSV exports | Universal import mapping quality | not-started | Obtain paid/affiliate/creator/retention samples. |
| Google/Meta craft guides | Grounded generation for those platforms | not-started | Supply approved materials. |
| Sending domain/provider and DNS | Production lifecycle delivery | not-started | Choose provider/domain and retain DNS access. |
| Qualified GDPR/CAN-SPAM/DPA review | Identity/lifecycle release gates | not-started | Engage qualified reviewer. |
| Design partners/data permission | Wave 2 and Wave 4 checkpoints | not-started | Nominate companies/creators and agree cadence/permissions. |

None of these external items blocks B4/B5. Universal CSV/manual import can be built without
native provider approvals. Stage C contract writing can proceed after Wave 0, but Wave 1
implementation begins only after the contract set is reviewed together.
