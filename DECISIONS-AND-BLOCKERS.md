# Aspen — decisions and blockers

Updated 2026-08-23. Record only decisions that materially affect scope, architecture,
sequencing, safety or external dependencies.

## Approved operating decisions

- **Repository-backed project management:** approved. Repository documents, not task memory,
  are authoritative.
- **Running control panel:** approved. `PROJECT-STATUS.md` is updated after every bounded
  delivery.
- **Autonomous execution:** Codex resolves routine implementation, testing and troubleshooting
  independently. User updates stay concise; Harish is asked only for mission-critical scope,
  external authority or genuinely blocking decisions.
- **Connector priority:** provisional Tier 1 approved:
  - Paid: Google Ads, Meta Ads, LinkedIn Ads; Reddit feasibility next.
  - Affiliate: PartnerStack, Rewardful; impact.com feasibility next.
  - Creator: universal CSV first, then GRIN; CreatorIQ/Aspire feasibility next.
  - Retention: HubSpot and Customer.io first, Klaviyo next, Braze later.
- **Scope additions:** approved — Growth Command Center, daily/monthly budget planning with
  Ads Engine recommendations, and existing-campaign import.
- **Previously rejected alternatives and parked/cut scope:** approved as documented in
  `MASTER-BUILD-PLAN.md` Part 9.

## D4a — cost-to-serve ladder (approved 2026-08-23)

### What it means

Aspen's fully loaded CAC should include not only ad spend and affiliate/creator payouts, but
also the cost of serving the customers each channel acquires. For an AI/SaaS product that can
include model tokens, infrastructure and account-level service costs.

Aspen will **not** access a customer's backend or build provider-billing integrations.
Instead it will report the best cost fidelity the customer can support:

1. **L1 — known costs only:** ad spend, creator payouts, affiliate commissions, and entered
   tooling/agency fees.
2. **L2 — blended cost:** customer enters last month's total AI/infrastructure bill; Aspen
   allocates it across active accounts.
3. **L3 — per-plan cost:** customer enters an estimated service cost for each plan tier;
   Aspen weights cost by the plan mix each channel acquired.
4. **L4 — metered events:** customer posts `cost_minor` or token usage through Aspen's normal
   event-ingest pipe, allowing account-level cost calculation.

Where a customer already has a token-usage or cost-metering system, they can share an export,
summary or supported feed from that system. Aspen uses existing-client cohorts — account
size, plan, usage profile and observed token cost — to estimate the monthly cost of serving a
new customer with similar characteristics. This is customer-supplied data, not Aspen access
to the customer's backend.

Estimated token cost is included in the recalculated CAC when the data is available. The UI
must distinguish **estimated**, **blended**, **per-plan** and **measured** cost; it must not
present a cohort estimate as metered fact.

Every CAC/return figure displays its fidelity rung and states what is missing. Aspen never
silently presents an incomplete cost as fully loaded.

### Decision

- [x] Build L1–L4 without accessing customer backends.
- [x] Do not build OpenAI, AWS or other provider-billing connectors.
- [x] Let customers use the highest level they can support.
- [x] Display the cost-fidelity level and what is missing on every CAC/return figure.
- [x] When customer-supplied usage data exists, estimate new-customer token/service cost by
      comparable account size, plan and usage, and include that estimate in recalculated CAC.
- [x] Keep estimates visibly distinct from measured cost events.

## Design-partner choices

This does not mean choosing between different product designs today. It means selecting the
companies and users who will privately test Aspen before the single public launch.

### Checkpoint 1 — end of Wave 2

Test the attribution, Growth Command Center, campaign imports, budget pacing, fully loaded
CAC and creator/affiliate performance with real B2B SaaS data.

Preferred partners:

- 3–5 B2B SaaS growth teams;
- a mix of self-serve and sales-led funnels;
- at least one PartnerStack or Rewardful user;
- at least one Google + Meta + LinkedIn advertiser;
- at least one HubSpot or Customer.io lifecycle user;
- willing to connect read-only data and review attribution conflicts.

### Checkpoint 2 — end of Wave 4

Test the creator operating system and portal with both sides of the workflow.

Preferred participants:

- 2–3 brands already running creator campaigns;
- 5–10 creators who can test invitations, briefs, uploads, review, rights and payments;
- ideally one brand migrating from GRIN or a structured spreadsheet workflow.

### Choices required from Harish

- [ ] Nominate candidate companies and contacts.
- [x] Initial design partners receive free private access.
- [ ] Decide what data they may connect and what feedback cadence they commit to.

## Unresolved product calls

The previous audit's product-call list is no longer generally unresolved. The master plan
Part 7 settled the major items: `AdsLibrary`, `AuthenticAdStudio`, campaign offer/status,
affiliate-link ownership, spend, org scoping, `/health`, and dark internal screens.

Current unresolved calls are:

1. **Connector order after Tier 1** — driven by design-partner usage and API feasibility.
2. **Import ownership modes:** default is read-only mirror; exact conditions for adopting an
   imported campaign for Aspen management must be specified before writeback ships.
3. **Budget automation ceiling:** current plan is recommendation + human confirmation; any
   future autonomous adjustment limits remain deliberately undecided.
4. **Public release timing:** master plan says one launch after Wave 7; controlled private
   design-partner checkpoints are approved, but a broader beta has not been approved.

None of these blocks current Wave 0 work or the Wave 1 contract freeze.
