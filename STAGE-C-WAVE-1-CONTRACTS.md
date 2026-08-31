# Aspen — Stage C Wave 1 contract review package

Status: **approved**

Prepared: 2026-08-31

Approved by Harish: 2026-08-31

Implementation gate: **open for bounded Wave 1 work beginning with `W1-1`**

This package freezes the contracts that Wave 1 must build against. It does not authorize a
database migration, model integration, campaign launch, provider writeback or other runtime
implementation. `MASTER-BUILD-PLAN.md` still owns scope, `EXECUTION-PLAN.md` owns order and
`PRODUCT-FEATURE-LEDGER.md` owns stable feature state.

The package also makes two already-compatible product directions explicit:

1. Aspen will offer a conversational campaign builder over the shared action vocabulary.
   Conversation may structure a brief, develop a plan and prepare private drafts. It cannot
   bypass confirmation for launch, spend, audience, payout or public communication.
2. The Ads Engine will use a multi-stage creative strategy pipeline, not a single generic
   prompt. Evidence, angle selection, hook diversity, format craft, claim controls,
   evaluation and provenance are separate, testable stages.

## Contract-wide rules

- Every business row is owned by exactly one `organization_id`; a nullable organisation is
  not a valid intermediate state.
- UUID primary keys are internal. External provider IDs are namespaced by organisation and
  provider and are never treated as globally unique.
- Time is stored as UTC `timestamptz`; provider timezones are metadata used for boundaries
  and display.
- Money is `bigint` minor units plus ISO-4217 currency. Aspen never invents exchange rates,
  derives spend from budget or turns missing money into zero.
- Append-only facts are corrected by superseding rows or explicit adjustment rows, never by
  erasing their history.
- Client input, imported text and retrieved documents are untrusted data. They never become
  system instructions or expand an action's permissions.
- Secrets, tokens and raw model chain-of-thought are never stored in product/audit payloads.
  Aspen stores evidence, structured decisions, validation results and concise explanations.
- Any consumer may strengthen an action policy from `silent` to `confirm` or
  `never-automatic`; no consumer may weaken it.

---

## C1 — D4/D4a money and cost-fidelity contract

### Source-of-truth rules

| Fact | Contract |
| --- | --- |
| Budget | A user-approved plan. It is never reported as actual spend. |
| Spend | An observed or explicitly entered daily channel/ad fact. Missing is `null`, not zero. |
| Revenue | A conversion/revenue fact with source, recognition window and currency. |
| Cost | A typed `cost_item`; creator payouts, affiliate commission, tooling, agency and service cost remain separate lines. |
| Return | Computed only from compatible currencies and supported inputs. Missing or zero denominators produce `null` plus a reason. |

### L1–L4 fidelity ladder

| Rung | Included cost-to-serve input | Basis | Required label |
| --- | --- | --- | --- |
| L1 — known | No service-cost input. Includes known paid spend, creator payouts, affiliate commission and entered tooling/agency cost. | observed or entered | `Known costs only`; list every omitted class. |
| L2 — blended | A customer-entered workspace total allocated across active accounts for a stated period. | entered estimate | `Blended service cost`; show period and allocation basis. |
| L3 — plan/cohort | Per-plan cost or a comparable customer-supplied cohort estimate, weighted by delivered plan/account mix. | entered or cohort-estimated | `Plan/cohort estimate`; never call it measured. |
| L4 — metered | Customer-posted `cost_minor` or usage that resolves to cost through the existing event pipe. | measured | `Metered from customer events`; retain event lineage. |

The aggregate fidelity is the weakest material rung needed by the figure. An L4 cost item
does not upgrade a total that still omits another material cost class. Each CAC/LTV-gross-
profit/return response carries `fidelity`, `included_cost_classes`, `missing_cost_classes`,
`basis`, `as_of` and `currency`.

Aspen never reads a customer's backend and never builds OpenAI, Anthropic, cloud or other
provider-billing connectors for this purpose. L3 exports/feeds and L4 customer events enter
through customer-authorized Aspen surfaces only.

---

## C2 — D1 action and conversational-campaign contract

### Invocation envelope

Every registered action accepts and returns a versioned schema. Each invocation records:

`id`, `organization_id`, `action_key`, `action_version`, `actor_type`, `actor_id`,
`source_surface`, `policy`, `status`, `idempotency_key`, redacted `input`, redacted `result`,
`evidence_refs`, `approval_id`, `supersedes_id`, `requested_at`, `confirmed_at`,
`executed_at`, `completed_at` and a typed `error_code` when applicable.

Valid actors are `user`, `chat`, `slack`, `portal`, `automation` and `service`. Valid
statuses are `proposed`, `awaiting_confirmation`, `approved`, `executing`, `succeeded`,
`failed`, `expired`, `cancelled` and `superseded`.

An approval binds the exact action version, canonical input hash, organisation, actor and
expiry. Editing the input invalidates the approval. Replaying the idempotency key returns
the original result and cannot repeat an external side effect.

### Canonical Wave 1 vocabulary

This registry is the minimum stable vocabulary. Later waves may add versioned actions but
must not invent surface-specific synonyms.

| Action key | Required input | Result | Base policy |
| --- | --- | --- | --- |
| `campaign.draft.create` | objective, offer, audience; optional channel/dates | private campaign draft | silent |
| `campaign.brief.update` | campaign, patch, brief version | updated private brief | silent |
| `campaign.plan.generate` | brief version, requested channels | strategy plan with gaps/evidence | silent |
| `creative.variants.generate` | brief, strategy, evidence bundle, platform/format | validated candidate set with provenance | silent |
| `creator.add` | creator reference, campaign, rationale | campaign/shortlist relationship | silent |
| `outreach.draft` | recipient, campaign, evidence, channel | unsent message draft | silent |
| `deliverable.approve` | deliverable, review version, rights check | review event and approved state | confirm |
| `tracking_link.mint` | destination, campaign/variant, channel | reusable attributed link | silent |
| `ad_test.push_paused` | test, provider account, canonical payload | external campaign created paused | confirm |
| `imported_campaign.adopt` | external ref, ownership proof, sync/rollback plan | managed external reference | never-automatic |
| `budget.change` | scope, old/new amount, currency, period, evidence | approved budget mutation | never-automatic |
| `campaign.activate` | provider campaign, readiness evidence, budget | external campaign activated | never-automatic |
| `campaign.pause` | provider campaign, reason, expected effect | external campaign paused | confirm |
| `journey.enter` | person/account, journey, consent basis | journey run | confirm |
| `message.send` | approved content version, recipient/audience, consent state | provider send receipt | confirm |
| `audience.sync` | consent-safe segment, destination, expiry | external audience reference | confirm |
| `payout.record` | payee, deal/deliverable, amount, currency, reference | immutable payout fact | never-automatic |
| `automation.rule.enable` | rule version, scope, allowed actions, limits | enabled rule | confirm |
| `approval.resolve` | approval, decision, input hash | immutable resolution | never-automatic |

`silent` means no additional confirmation is required after an authenticated user request;
it does not mean unlogged. `confirm` requires an exact confirmation card before execution.
`never-automatic` requires a currently authenticated authorised human and cannot be resolved
by chat, Slack bots, schedules or automation rules.

A single confirmation may authorize a bounded scheduled journey or audience send only when
the content version, audience query, consent condition, delivery cap and active date range
are included in the approved input hash. Individual deliveries still write child
invocations; changing any bound invalidates the approval.

### Conversational campaign builder

The conversational surface is a Wave 6 experience built over the Wave 1 registry. Stage C
freezes its behavior now so it cannot become an ungoverned second execution path.

The conversation compiles a versioned `CampaignBrief` containing objective, funnel event,
offer, audience, geography, channel/format, dates, budget/currency/period, approved evidence,
prohibited claims, brand voice, rights/consent constraints and success metric. Fields may be
unknown during exploration; every launch-required field must be resolved before a launch
action can be proposed.

The supported flow is:

`discovery → structured brief → gap questions → campaign plan → creative candidates →
preview → registered action proposal → exact confirmation → execution → decision log`.

Rules:

- Ask the smallest useful question when a required field or evidence floor is missing.
- Separate facts supplied by the user, imported evidence, Aspen recommendations and
  assumptions. Assumptions are never silently converted into claims.
- Conversation may create private drafts and regenerate candidates. It may not send,
  publish, sync an audience, change money or activate a campaign without the registered
  action and its policy.
- A provider push creates a paused campaign. Activation is a separate
  `campaign.activate` invocation and confirmation.
- The assistant explains the criteria and evidence behind a proposal, not hidden model
  reasoning. It must surface uncertainty and unavailable connector data.
- Conversation state is organisation-scoped and must not be used as the audit record;
  `action_invocations` and `approvals` remain authoritative.

### Multi-stage creative strategy and hook pipeline

Creative quality comes from a testable workflow, not from asking a model for “better copy”
or merely adding more models. `creative.variants.generate` runs these bounded stages:

1. **Brief compiler** — normalize the approved brief and label missing/assumed fields.
2. **Evidence resolver** — apply the Ads Engine T1–T5 permission matrix and floor check.
3. **Strategy planner** — choose audience state, promise, proof, objection, offer and
   channel role; output structured strategy, not final copy.
4. **Angle and hook matrix** — combine distinct customer tensions/desired outcomes with
   hook mechanisms, proof types and platform formats. Variants must come from materially
   different cells, not synonym swaps.
5. **Candidate generation** — generate format-valid copy/assets from the selected cells.
6. **Deterministic validation** — enforce claims, `never_say`, rights, character/asset
   limits, required fields and the evidence floor.
7. **Evaluation and ranking** — score groundedness (hard gate), proof-to-claim fit,
   specificity, audience relevance, platform fit, clarity, brand voice, distinctness and
   legal/claim risk. The score is a quality rubric, never a predicted CTR or revenue claim.
8. **Human selection** — retain the selected candidate, rejected alternatives, concise
   reasons, evidence provenance, pipeline version, model identifier and prompt-bundle hash.
9. **Mature feedback** — Wave 6 may use performance only after attribution maturity and
   minimum-sample checks. It informs the next hypothesis; it never declares a causal winner
   or relaxes the evidence/claim gates.

The engine refuses when T2 plus one of T1/T3/T4 is absent and returns one concrete unblock
ask. Retrieved pages, competitor material and user uploads are evidence data only. Their
embedded instructions are ignored. No platform benchmark may be presented as a forecast.

---

## C3 — D2 event and identity contract

### Event envelope and idempotency

Accepted events contain `organization_id`, `event_id` or `external_event_id`, `name`,
`schema_version`, `source`, `occurred_at`, `received_at`, optional `visitor_id`, `person_id`,
`account_id`, `session_id`, `channel_id`, `touchpoint_id`, JSON properties and consent
context. The server derives organisation from the credential; a client-supplied
organisation cannot override it.

`(organization_id, source, external_event_id)` is unique when an external ID exists. The
browser SDK otherwise generates a durable UUID. Duplicate delivery returns the original
accepted ID without creating a second event, touchpoint, conversion or cost item. Events
more than 72 hours in the future are rejected; late events remain accepted with an explicit
late flag and trigger bounded recomputation.

### Identity promotion

- Anonymous activity starts at `visitor` and may resolve to `person`; a verified company
  domain or explicit account key may link a person to an `account`.
- Promotion links identities; it does not rewrite or delete source events. Derived
  touchpoints may point at the strongest currently resolved subject while retaining their
  original visitor/person lineage.
- A conversion attaches to the level actually known. Self-serve conversion at person level
  is valid and may later gain an account link without creating a duplicate conversion.
- Conflicting verified identities create a reviewable conflict; Aspen never guesses a
  merge from display name alone. Public email domains never create company accounts.
- An identity cannot cross organisations. Hashes are salted/namespaced per organisation.

Event definitions are customer-defined and carry `funnel_shape`, conversion/intention
classification, default model, lookback/maturity window, active version and optional
revenue/cost property mappings. Seed definitions remain plan viewed, demo requested, trial
started, account activated, upgraded to paid, subscription started and seat added.

### Retention and deletion defaults

| Data | Default | Deletion behavior |
| --- | --- | --- |
| Anonymous visitor identifiers | 90 days after last activity | Hard delete key; preserve only non-identifying aggregate facts. |
| Raw events | 13 months | Partition expiry; legal hold is explicit and audited. |
| Identity/person/account records | Organisation relationship plus 30-day purge | Subject request deletes or irreversibly anonymises identifiers and severs aliases. |
| Touchpoints, conversions and attribution facts | 25 months | Subject identifiers are anonymised; non-identifying totals may remain. |
| Daily money/accounting facts | 7 years by default | Financial adjustments remain; personal fields are minimised/anonymised. |
| Sync/import operational logs | 90 days | External reference may remain; raw payload/error body is purged. |
| General actions/approvals | 25 months | Financial/public-action evidence follows the 7-year class; payloads stay redacted. |
| OAuth state/token material | State 15 minutes; token until revoked/expired | Immediate purge/revocation; never copied to logs. |

An organisation may configure shorter periods where product/legal obligations allow. These
defaults require qualified GDPR/DPA review before release.

---

## C4 — D3 channel and attribution invariants

### One channel model

Every touchpoint, daily fact, cost and attribution references `channel_id`. The normalized
families are `paid`, `creator`, `affiliate`, `retention`, `organic`, `referral`, `direct`
and visibly `unattributed`. Provider/platform/campaign/ad/creator/journey are dimensions,
not new attribution code paths. YouTube paid is provider Google with platform YouTube;
creator YouTube remains a creator/organic channel according to the tracked relationship.

Unknown UTM/provider values map to `unattributed` with their raw value retained for later
mapping. They never silently become direct.

### Credit, conflict and maturity rules

- For each `(conversion_id, attribution_model_id, calculation_version)`, credit is in
  `[0,1]` and sums to exactly `1.000000` after deterministic final-row rounding.
- A conversion with no eligible touchpoints receives full `unattributed` credit so missing
  tracking remains visible.
- Model inputs are immutable as-of snapshots. Recalculation creates a new calculation
  version and supersedes the prior result.
- A provider claim is stored separately from Aspen model credit. When multiple providers
  claim overlapping full credit, `claim_conflicts` records the claims and delta; Aspen does
  not average, hide or silently choose one.
- Results inside the conversion definition's maturity window are labelled `immature` and
  cannot drive automated learning or budget recommendations presented as settled.
- Revenue/cost is never added across currencies. A user-supplied conversion table creates
  an explicit converted fact with rate source and effective date; otherwise totals stay
  separated by currency.

Proposed defaults for approval:

| Funnel shape | Default model | Lookback | Maturity |
| --- | --- | --- | --- |
| `self_serve` | first-touch | 30 days | 7 days |
| `sales_led` | position-based account journey (40/20/40) | 120 days | 90 days |
| `either` | Aspen position-based | 60 days | 30 days |

Customer definitions may override the windows and default model prospectively. Historic
calculations retain the definition/model version used.

---

## C5 — organisation ownership and RLS contract

The existing roles remain `admin`, `editor` and `reviewer`. A creator is not an ordinary
organisation member: access exists only through an active `creator_brand_link` and the
specific campaign/deliverable/thread rows granted through it. An outsider has no access.

| Role | Read | Write/execute |
| --- | --- | --- |
| Admin | All organisation rows except service-only secrets | Membership, settings, connections and all editor actions |
| Editor | Organisation operating data | Create/update operating data and request registered actions |
| Reviewer | Non-secret organisation data and redacted audit evidence | No direct write; may resolve an approval only when explicitly assigned |
| Creator | Only linked brand/campaign/portal rows | Own submissions/messages and requested revisions only |
| Service | Only the function-specific tables/columns needed | Validated ingest, derived facts and provider calls; never a general client capability |
| Outsider/anonymous | No private rows | Tracking ingress only through scoped public endpoint; no table access |

Mandatory policy rules:

- RLS is enabled and forced on every public business table. All `SELECT`, `INSERT`,
  `UPDATE` and `DELETE` paths have explicit tests for admin, editor, reviewer, creator and
  outsider.
- `organization_id` is derived from membership/credential and included in foreign-key
  validation. A same-UUID object in another organisation is still denied.
- Tokens, provider secrets and OAuth state use RLS with no client policy; only bounded
  server functions may access them.
- Raw identity values are admin/editor only. Reviewer views use redacted database views;
  aggregated analytics remains readable.
- Derived facts are service-write and member-read. Corrections use append/supersede rules.
- `action_invocations` is append-only. Users cannot update/delete audit rows. Approvals may
  transition once through a security-definer function that rechecks actor, input hash and
  expiry.

### Existing ownership rewrite

`campaigns`, `hotlist`, `ad_corpus`, `creator_contacts`, `outreach_threads`,
`outreach_messages`, `outreach_sequences`, `outreach_sequence_steps` and
`sequence_enrollments` move from incoherent owner-only `user_id` scope to mandatory
`organization_id`. Legacy `user_id` becomes `created_by`/`owner_user_id` where provenance is
needed. Backfill must prove one organisation per row; ambiguous rows quarantine for review
instead of guessing. All dependent foreign keys and policies change in the same ordered
schema PR.

---

## C6 — schema map: ownership, keys, indexes, retention and RLS

The following map is the migration contract, not SQL. `org` means required
`organization_id`; `member R` means admin/editor/reviewer can read; `editor W` means
admin/editor can write; `service W` means clients cannot write derived rows.

| Tables | Ownership and keys | Required indexes/uniqueness | Retention | RLS/write contract |
| --- | --- | --- | --- | --- |
| `visitors` | org; UUID; durable anonymous key | unique org+anonymous key; org+last_seen | 90d inactive | admin/editor R; ingest service W |
| `identities` | org; UUID; visitor/person FK; typed hash/external ID | unique org+type+normalized hash; subject indexes | relationship +30d | admin/editor R; resolution service W |
| `persons` | org; UUID; optional primary account | org+created/updated; external person uniqueness | relationship +30d | admin/editor R; service/editor W |
| `accounts` | org; UUID; normalized domain/external key | unique org+external key; non-public domain index | relationship +30d | member R; service/editor W |
| `events` | org; UUID; month partition; subject/event-definition FKs | unique org+source+external ID; org+occurred; subject indexes | 13m | admin/editor R; ingest service W |
| `event_definitions` | org; UUID; versioned name/funnel/model/windows | unique org+name+version; active lookup | org lifetime | member R; editor W |
| `touchpoints` | org; UUID; event/channel/subject FKs | org+subject+occurred; channel+occurred | 25m | member R; service W |
| `conversions` | org; UUID; definition and person-or-account constraint | unique org+definition+source conversion ID; subject/time | 25m | member R; service W |
| `channels` | org; UUID; normalized family/provider dimensions | unique org+normalized key; family/provider | org lifetime | member R; editor W; seeded service values |
| `attribution_models` | org or system; UUID; immutable version | unique scope+name+version | org lifetime | member R; editor W for custom models |
| `model_defaults` | org; funnel shape; model/version FK | unique org+funnel shape+effective date | org lifetime | member R; editor W |
| `attributions` | org; conversion/model/calculation/channel key | unique calculation+channel; conversion/model; channel/time | 25m | member R; service W |
| `claim_conflicts` | org; UUID; conversion/provider claim refs | org+status+created; conversion | 25m | member R; service W; editor resolution note |
| `tracking_health` | org; UUID; run/check key | org+run; latest org+check | 13m | member R; service W |
| `channel_daily` | org; channel+day+currency grain | PK org+channel+day+currency; org+day | 7y | member R; service W; typed manual adjustment action |
| `ad_daily` | org; ad+day+currency grain | existing PK; org+day; ad | 7y | member R; service W; controlled manual input |
| `cost_items` | org; UUID; channel/campaign/account optional FKs | org+day+currency; type/fidelity/basis | 7y | member R; editor W; metered service W |
| `plan_costs` | org; UUID; plan/effective range/currency | unique org+plan+effective date; active range | 7y | member R; editor W |
| `budget_plans` | org; UUID; scope+period+currency | unique org+scope+period+version; status | 7y | member R; editor draft; confirm action activates |
| `budget_recommendations` | org; UUID; plan/scope/evidence snapshot | org+status+created; plan | 25m | member R; service W; approval action only |
| `revenue_recognition` | org; UUID; conversion/revenue window | conversion+window; org+recognition day | 7y | member R; service/editor source W |
| `campaigns` (affected) | org; UUID; `created_by`; budget/currency/offer/status | org+status+created; org+external refs | org lifetime | member R; editor W; money/status through actions where required |
| `hotlist`, `ad_corpus` (affected) | org; UUID; creator/campaign FKs; `created_by` | org+campaign/stage; corpus source external uniqueness | org lifetime | member R; editor W |
| `ad_accounts` | org; UUID; provider account metadata, no tokens | unique org+provider+external account; status | org lifetime | member R; admin connection actions W |
| `platform_campaigns`, `platform_ad_groups`, `asset_groups`, `platform_ads`, `keywords` | org; UUID; provider and external FKs | unique org+provider+external ID; parent/status/sync indexes | org lifetime + provider tombstones | member R; adapter service W; registered actions mutate |
| `audiences` | org; UUID; consent-safe definition/external refs | unique org+provider+external ID; expiry/status | definition lifetime; membership transient | member R metadata; service handles hashed membership; confirm sync |
| `platform_sync_log` | org; UUID; provider/object/job refs | org+provider+created; object ref | 90d raw error detail | member R redacted; service W |
| `import_jobs` | org; UUID; provider/status/mapping/error summary | org+status+created; idempotency key | 90d raw payload/report | member R; editor starts; service W |
| `external_campaign_refs` | org; UUID; local campaign/provider/external ID | unique org+provider+external ID; local campaign | org lifetime | member R; service W; adoption confirm action |
| `action_invocations` | org; UUID; versioned action/actor/approval | unique org+idempotency key; action/time; actor/time | 25m or 7y material | member R redacted; append-only service function |
| `automation_rules` | org; UUID; versioned trigger/condition/wait/action | org+enabled+trigger; unique rule+version | org lifetime | member R; editor drafts; confirm enable |
| `approvals` | org; UUID; action/input hash/actor/expiry | unique action invocation; assignee/status/expiry | 25m or 7y material | assigned/member R; one transition via function |
| `creator_brand_links` | org; UUID; creator; status/scope | unique org+creator; creator+status | relationship +30d | member R; linked creator sees own link |
| `deliverables`, `review_events`, `threads`, `thread_messages`, `deal_terms`, `payouts` | org; UUID; creator-link/campaign parent FKs | parent/status/time; payout reference uniqueness | content org lifetime; money 7y | member R/W; linked creator only granted rows; payout confirm action |
| `brand_assets`, `creative_tags`, `diversity_snapshots` | org; UUID; asset/campaign/talent/rights refs | org+kind/tags; rights expiry; snapshot time | asset lifecycle +30d; snapshots 25m | member R; editor W; signed storage only |
| `journeys`, `journey_steps`, `journey_runs`, `messages`, `message_sends`, `sending_domains`, `esp_connections`, `suppressions`, `consents`, `landing_pages` | org; UUID; versioned parent and consent/provider refs | parent/status/schedule; recipient hash; suppression uniqueness | consent/sends per legal schedule; money 7y | member R; editor drafts; service sends; public/send actions confirm |
| `ai_citations` | org; UUID; engine/query/source reference | org+engine+observed; cited URL | 25m | member R; service W; no raw private prompt by default |
| Existing `channel_connections` | owning user plus org migration where shared sending is enabled | unique org/user/provider | connection lifetime | owner/admin metadata R; no secret columns |
| Existing `channel_tokens`, `oauth_states` | server-only subject/org reference | token subject/provider; state unique | token until revoke; state 15m | RLS forced, no client policy |

Each migration file must include constraints, indexes, RLS, grants, backfill assertions and
forward-fix notes for its rows. Generated types and migration-policy tests are part of the
same PR evidence.

---

## C7 — specification reconciliation

1. `MASTER-BUILD-PLAN.md` controls scope. This package controls the Wave 1 contracts.
2. `SPEC-spend-and-attribution.md` remains authoritative for minor-unit money, nullable
   budget, daily actual spend and null-vs-zero behavior. Its “three changes” boundary,
   single-file migration instruction and decision to defer the campaign/hotlist org rewrite
   are superseded by the wider master plan and this package.
3. `ADS-ENGINE-SPEC.md` remains authoritative for the T1–T5 evidence permissions, floor,
   structured refusal, format/craft model, A/B/C test intent, provenance and paused push.
   Its illustrative SQL must adopt this package's organisation keys, retention, RLS, action
   policies and shared platform/import schema.
4. Existing `ad_daily` stays at ad/day grain and rolls into `channel_daily`; neither is
   replaced by a budget or estimate.
5. Existing email `channel_connections`/`channel_tokens` remain distinct from paid
   `ad_accounts`; secret handling stays service-only.
6. The conversational campaign builder is a Wave 6 surface. Its action schemas and safety
   boundaries are frozen in C2/Wave 1; it does not pull Wave 6 UI into Wave 1.
7. Creative strategy/hook sophistication extends Wave 3 Ads Engine work. Stage C freezes
   its contract; it does not begin model/runtime implementation.

## Approval checklist

Harish's review should resolve these as one package:

- [x] Approve the action vocabulary and conversational campaign safety boundary.
- [x] Approve the multi-stage creative strategy/hook pipeline and evaluation rubric.
- [x] Approve the proposed model/lookback/maturity defaults in C4.
- [x] Approve the retention defaults in C3, with qualified legal review still required before release.
- [x] Approve the organisation/RLS roles and existing ownership rewrite.
- [x] Approve the schema map and spec reconciliation as the contract for bounded Wave 1 PRs.

Approval opens `W1-1` schema work. It does not approve provider credentials, campaign
activation, autonomous spend changes or public launch.
