# Aspen — master build plan

Written 2026-08-18 and revised 2026-08-24. This supersedes `NEXT-BUILD-PLAN.md` as the
top-level plan. It does **not** supersede the three specs that already exist —
`SPEC-spend-and-attribution.md`, `ADS-ENGINE-SPEC.md`, `UIUX-BATCH-PROMPTS.md` — it absorbs
them and says where each one now sits.

No paste-ready prompts here, per your answer. Prompts get written for whatever you greenlight.

---

## Part 0 — Your question, answered first

> *"Have you carefully looked at what our build and plan requirements were prior to the
> podcast, and are you sure you've taken everything unique and worth building from it?"*

### On the prior requirements: yes, and here's the reconciliation

Six documents defined Aspen's build before the podcast. Every one is accounted for below,
because the most expensive mistake available right now is re-specifying something already
spec'd.

| Prior document | Status | Where it goes in this plan |
| --- | --- | --- |
| `UIUX-BATCH-PROMPTS.md` (B3, B4, B5) | B3 complete; B4–B5 open | Wave 0. Finish before new screens land. |
| `SPEC-spend-and-attribution.md` | Written, unbuilt | **Absorbed and widened** into Wave 1. Its money conventions become law for the whole plan. See note below. |
| `ADS-ENGINE-SPEC.md` (PR-A→D) | Written, unbuilt | PR-A/B/C keep their functional intent; schema, ownership and screens are reconciled with this plan. PR-D grows around the approved connector priority. |
| `NEXT-BUILD-PLAN.md` (5 workstreams) | Decisions locked | All five survive. The action-vocabulary insight is now load-bearing for far more than three surfaces. |
| `aspen-uiux-audit-and-remediation-plan.md` | Partly done | Its "needs a product call" list is answered in Part 7. |
| `B1-TOKEN-MAP.md` | Done through B2 | Reference only. New code uses tokens from day one. |

**The important reconciliation:** `SPEC-spend-and-attribution.md` says *"Any ad platform
connector — out of scope. Spend is manual entry for now."* That sentence is now wrong, and
it was written deliberately, so it is worth being explicit rather than quietly contradicting
it. Its actual durable contributions are three things this plan builds on rather than
around:

1. Money in **minor units, bigint, with a sibling currency**. Never `numeric`, never
   dollars, never derived. That convention now applies to ad spend, creator payouts, free
   credits, token cost, email cost and revenue alike.
2. Spend recorded at **daily grain**, not as a scalar, so it can be plotted against revenue.
   That decision is what makes the elasticity chart, the lag band and incrementality
   possible later — it was right for reasons that have grown.
3. Manual spend entry doesn't get deleted when connectors arrive. It becomes the fallback
   for channels Aspen can't read, and the seed path for demos.

### On the podcast: the extraction is complete, but the filter was wrong

Honest answer in two parts.

**First, a limitation you should know.** The raw transcript is not saved in this project —
only my extraction, `TRANSCRIPT-BUILD-IDEAS.md`. So I cannot re-scan the source for things I
missed on the first pass. If you re-upload it, I'll do a second read looking specifically
for what I dropped, and I'd expect to find a handful of tactical details rather than new
strategy.

**Second, the more useful answer.** I did not miss ideas so much as *filter* them against an
Aspen that didn't run Google, didn't run Meta and didn't do lifecycle. Your answers just
changed that filter, so four things my first pass rejected are **back in, and built below** —
this is a recovered list, not a cut list:

| Rejected on the first pass | Why it returns | Built in |
| --- | --- | --- |
| **Meta and Google buying mechanics** | Now the core of a whole workstream. Everything he said about campaign structure, the 50-conversion floor, match rate and enrichment score is build material, not context. | **Wave 3** |
| **Lifecycle** | Now a product area. His triple-counting warning is no longer a caution about someone else's tool — it's a bug Aspen can ship. | **Wave 5** |
| **Referral programme internals (A4)** | Once Aspen sends in-product messages, "show the referral offer right before they hit the wall" is a journey trigger. It stops being a different product and becomes one journey template. | **Wave 5** |
| **Paywall and trial-credit economics** | Free credits are a cost line in fully-loaded CAC — he's explicit that omitting them means you aren't calculating acquisition cost at all. The `cost_items` table carries them and the CAC tile sums them. Only the paywall *UI design* stays parked (Part 9); the economics ship. | **Waves 1–2** |

And four items I ranked Tier 3 ("worth building, no urgency") are now **structurally
required**, not optional:

- **M1 cross-channel de-duplication.** With affiliate + Google + Meta + lifecycle all live
  in one workspace, four sources will claim the same signup. This stops being a credibility
  nicety and becomes the thing that decides whether anyone believes any number Aspen shows.
- **M6 conversion lag.** The moment you chart spend against revenue across channels, the
  most recent fortnight always looks like a crash. Ship the maturity band with the chart, or
  spend every customer call explaining it.
- **C6 the format bridge.** Performance Max and Demand Gen demand asset groups in many
  ratios. One vertical creator video has to become a legal PMax asset set. This is now
  load-bearing infrastructure, not a nice trick.
- **M3 the 50-conversion readiness gate.** When Aspen is the thing pressing "launch" on a
  Google campaign, refusing to launch into insufficient conversion data is a duty, not a
  flourish.

Three things I ranked highly and would now rank higher, because your answers make them
cheap where they used to be expensive: **A6 creator-matched landing pages** (you'll own the
link, the creator, the ad copy *and* the email — the page writes itself), **G4 the decision
log** (falls out of the action layer for free), and **A1 creator content as AI-answer fuel**
(the only claim on this list no competitor can copy).

One thing I would still leave out: **A5 newsletters**. Different buyer, different supply
type, and this plan is already very large.

---

## Part 1 — The scope reality check

You picked all twelve items for the MVP, full Google management, Meta alongside it, your own
pixel with identity stitching, and Aspen sending lifecycle messages by default. Said plainly:
**that is four products, not one release.**

- An attribution platform (pixel, identity, cross-channel truth)
- A media buyer (Google + Meta, five surfaces, create/budget/launch/optimise)
- A lifecycle marketing tool (journeys, sending infrastructure, deliverability, consent)
- The creator marketplace that already exists

Each of those is a company. The Google Ads and Meta APIs alone are, in practice, a
multi-month engineering commitment before a single screen looks good — and the gating item
isn't code, it's **approvals** (Part 6).

**Settled 2026-08-21.** Three things are cut, the LinkedIn route is fixed, and launch is at
the end of Wave 7 — the whole thing, in one release.

**Cut, agreed:**

- **Google Shopping** — needs a Merchant Center product feed, and the ICP has no cart.
  Nothing for a Shopping campaign to sell. Removed from the surface list.
- **Push notifications** — would mean shipping an SDK that runs inside your customers'
  products. Different product, different sale. Retargeting and email cover the same journeys.
- **X ads management** — X stays a discovery and organic-sourcing platform. No campaign
  management. The engineering goes to Google and Meta, where the spend is.

**LinkedIn, fixed:** no personal-DM automation. Two supported routes only — **Conversation
Ads / Sponsored Messaging** (paid, official, already in the ads engine's format model) and an
**assisted queue** where Aspen drafts and a human sends. Nothing that puts a customer's
LinkedIn account at risk.

**One release, end of Wave 7.** That's a real choice with a real cost, so it's worth naming
what it buys and what it charges. It buys a coherent story: the loop only makes its argument
when all of it works, and a half-loop invites the comparison to whichever point tool does
that half better. It charges you feedback — every assumption in here stays untested until
launch, and the plan is long enough that some of them will be wrong.

The mitigation isn't to launch earlier, it's to **get the waves in front of real people
without selling them.** Wave 2 and Wave 4 are the two points where Aspen is demonstrable
end-to-end, so use them as design-partner checkpoints: a handful of B2B SaaS teams, real
data, no pricing page. That keeps the single-launch decision while removing most of its risk.
They're marked as checkpoints in Part 5.

---

## Part 2 — What Aspen becomes

One paragraph, because every decision below should be checkable against it.

Aspen is the place a B2B SaaS growth team runs the whole loop: find creators, brief and pay
them, turn their content into ads across LinkedIn, Reddit, YouTube, Google and Meta, catch
every click with its own tracking, nurture the people who didn't convert, and — the part
nobody else does — tell the truth about which of those actually produced revenue, with the
double-counting removed and the real cost included.

The operating surface for that loop is the **Growth Command Center**: one dashboard showing
performance, spend and core metrics across paid media, retention, affiliate and creator
marketing. Customers can import existing campaigns before Aspen manages anything, set daily
and monthly budgets, and receive evidence-backed Ads Engine budget recommendations. Imports
default to a read-only mirror, and no recommendation changes spend without human confirmation.

The loop, in the order the data moves:

**Source** (creators, hotlist) → **Create** (briefs, versions, formats, assets) →
**Distribute** (five ad platforms + affiliate links + email) → **Capture** (pixel, events,
identity) → **Attribute** (channels, models, de-dup, fully-loaded cost) → **Nurture**
(journeys, retargeting audiences) → **Decide** (chat, Slack, automation rules, decision log)
→ back to Source.

Two claims fall out of that shape and belong in the homepage work:

- Creator content is simultaneously the highest-ROI acquisition channel *and* the main way
  you get cited in AI answers. YouTube and Reddit are two of Aspen's four discovery
  platforms and the two highest-citation sources. That is a second, durable reason to spend
  on creators that no ads tool argues.
- Affiliate delivering 10–15% of acquisition at two venture-backed SaaS companies is the
  best third-party validation of Aspen's core that exists, and it's quotable.

---

## Part 3 — The five decisions everything hangs off

If these five are right, the rest is labour. If any is wrong, several workstreams get built
twice. All five are design work, doable here, before any code.

### D1 · The action vocabulary

Already identified in `NEXT-BUILD-PLAN.md` as the highest-leverage decision when it covered
three surfaces. It now covers **six**: chat, Slack, the creator portal's brand actions,
automation rules, the confirmation system, and the decision log.

One named list of everything Aspen can do — *create campaign, add creator, draft outreach,
approve deliverable, mint link, push ad test, raise budget, pause campaign, enter person into
journey, send message, sync audience, record payout* — each with its inputs, what it returns,
and one flag: **silent · confirm · never-automatic**. Money and public visibility force
`confirm`.

Every invocation writes a row to `action_invocations`. That single table is simultaneously
the audit log, the decision log Matt describes, the undo history, and the training data for
the self-improving loop. Get it once.

### D2 · The event and identity spine

The pixel is the moat, and it's also the piece where a wrong shape can't be fixed later.
B2B differs from e-com in one way that matters more than everything else: **the buying unit
is a company, not a person.** Six people from one account read three pieces of creator
content and one of them starts a trial. An e-com attribution model gets that wrong every
time.

So the spine resolves three levels: `visitors` (anonymous) → `persons` (identified) →
`accounts` (company, usually by email domain). Touchpoints attach to whichever level is
known, and get promoted upward when identity resolves. Conversions attach at the account
level for B2B events.

**Confirmed 2026-08-21.** Conversion objects are **customer-defined**, and the seed list is
wider than the first draft:

| Seeded conversion | Funnel |
| --- | --- |
| Plan viewed | both — intent, not conversion |
| Demo requested | sales-led |
| Trial started | both |
| Account activated | self-serve — can happen in the first session |
| Upgraded to paid (from freemium) | self-serve |
| Subscription started | both |
| Seat added | both — expansion |

Still no carts. But the addition of **immediate self-serve activation** changes the model in
a way worth stating, because it's the kind of thing that silently breaks an attribution
engine built for only one funnel shape:

A sales-led purchase is six people from one company over eleven weeks. A self-serve
activation can be one anonymous visitor converting in a single session, minutes after
clicking a creator's link. Structurally that's e-com-shaped, even though the product is
SaaS — short path, one identity, first-touch carries almost all the weight.

So the spine cannot assume either shape. Three consequences, all cheap now and expensive
later:

1. **Conversions attach at the level that's actually known** — account when it resolves,
   person when only that exists. Not account-only.
2. **Attribution models are chosen per conversion type**, not per workspace. Same-session
   activation should not be run through a linear model that expects eleven weeks of
   touchpoints; an eleven-week enterprise deal should not be scored last-click.
3. **`event_definitions` carries a funnel shape flag** (`self_serve` / `sales_led` /
   `either`), so the maturity band, the lag window and the model default all read from one
   place instead of being guessed per screen.

### D3 · One channel model

Every source of traffic — creator affiliate link, LinkedIn ads, Reddit ads, YouTube ads,
Google Ads, Meta, email, retargeting, organic, referral — is a row in `channels`, not a
special case in code. Spend, cost, touchpoints and attribution all key off it.

This is what makes de-duplication possible at all. A conversion has many `attributions`
rows, one per claiming channel, with a credit fraction per model that sums to 1. When two
platforms both claim 100%, Aspen doesn't average them silently — it writes a conflict row
and shows it. Being visibly honest about an overlap is the entire credibility play.

### D4 · One money spine

Everything in minor units, daily grain, per channel. And **cost is not just ad spend**:
`cost_items` carries ad spend, creator payouts, free trial credits, cost-to-serve (tokens),
tooling and agency fees. Fully-loaded CAC is a sum over that table, not a column somewhere.

### D4a · Cost-to-serve — approved 2026-08-23

The L1–L4 ladder and the no-backend-access boundary are confirmed.

You're right that this is the hard one, and the instinct to be creative about it is correct —
but the creative move is the opposite of what it looks like. **Aspen never reads the
customer's backend.** Not once.

The reason is arithmetic, not engineering difficulty. Provider billing APIs — OpenAI,
Anthropic, AWS — return *organisation-level* totals. They do not and cannot tell you which
of your customer's end users burned which tokens. So an OAuth connector to a billing API,
after all the work of building it, produces exactly one number: the monthly total. Which the
customer could have typed in ten seconds. **Don't build provider connectors.** They are the
most expensive route to the least fidelity, and they look like the obvious answer, which is
why it's worth writing down that they aren't.

Instead: a **cost ladder**, same pattern as the ads engine's evidence ladder. Four rungs.
Every customer lands on whichever one they can reach, and every number Aspen shows says which
rung it's standing on.

**L1 · Known costs only.** Zero setup, works on day one. Ad spend from the connectors,
creator payouts and affiliate commission from Aspen's own records, tooling and agency fees if
entered. `CAC = known costs ÷ new accounts`.

This rung is worth more than it sounds. Most teams' CAC already omits creator fees and
affiliate commission entirely, because those live in a different system from ad spend. Aspen
holds both natively. So L1 alone is a better CAC than the customer currently has — and it
answers your "beyond just the percentage payout to the affiliate" directly: the payout is one
line of four, and Aspen owns three of them without asking anyone for anything.

**L2 · Blended cost-to-serve.** One number, once a month: last month's total AI and infra
bill, typed in. Aspen divides by active accounts. Crude, directionally right, thirty seconds
of work, no engineering on the customer's side. Most customers will live here, and that's
fine.

**L3 · Per-plan cost.** Customer sets a cost-to-serve figure per plan tier — free, pro,
team. Aspen weights it by the plan mix each channel actually delivered.

This is the rung that earns its keep, because it surfaces something no ads tool can see: the
channel that brings a flood of free accounts which never upgrade but cost real money every
month. On L1 that channel looks cheap. On L3 it's revealed as the most expensive one you
have. That single reversal is a sales demo on its own.

Where a customer already has a token-usage or cost-metering system, they may provide an
export, summary or supported feed. Aspen uses comparable existing-client cohorts — account
size, plan, usage profile and observed token cost — to estimate the monthly service cost of
a new customer. This remains customer-supplied data; Aspen does not access the customer's
backend or build provider-billing connectors. Recalculated CAC includes the estimate when it
is available, and labels it as estimated rather than measured.

**L4 · Metered from events.** The customer is already posting events to Aspen's ingest
endpoint — that's Wave 1, built regardless. They add one more event type with a cost or
token count as a property (`ai_request`, `cost_minor: 240`). Aspen sums it per account.

No integration, no backend access, no new plumbing. One extra event on a pipe that already
exists. This is the creative answer you were looking for: the pixel spine we're building for
attribution is *also* the cost-metering channel, and it cost nothing extra to be one.

**The honesty rule.** Every CAC and return figure renders its rung — "known costs only,
cost-to-serve not recorded" is a trustworthy number. A number that silently omits half the
cost is not, and getting caught doing that once undoes the whole credibility play this
product is built on.

So: `cost_items` gets a `fidelity` column (`known` / `blended` / `per_plan` / `metered`) plus
a basis that distinguishes entered, cohort-estimated and measured cost. Every aggregate
carries the lowest rung it contains. Same shape as the claim-conflict handling in D3 — where
Aspen doesn't know, Aspen says so.

For AI-native customers, ROAS that ignores cost-to-serve is wrong, so the return tile
computes **LTV gross profit** at L2 and above, and says what's missing at L1.

### D5 · One automation engine

The lifecycle journey engine (*trigger → condition → wait → action*) and the ads automation
rules (*if CPA over target for 7 days, pause*) and the Slack decision queue are the same
machine with different triggers and different actions. All three call D1's vocabulary.

Build one. Journeys, continue/stop rules, and the 9am Slack digest are then three
configurations, not three systems.

---

## Part 4 — The schema

You asked for one migration, all of it now. Right call for coherence, with one engineering
caveat: **one PR, several numbered files**, applied in order. A single two-thousand-line SQL
file that fails at line 1,400 is genuinely painful to debug, and splitting costs nothing.

Existing conventions hold: minor units, sibling currency, RLS on every table mirroring
`ad_corpus`, `updated_at` triggers.

**4a · Identity and events**
`visitors` · `identities` (email hash, external user id, LinkedIn URN) · `persons` ·
`accounts` (company domain) · `events` (month-partitioned, jsonb props) ·
`event_definitions` (customer-defined funnel steps + **`funnel_shape`**: self_serve /
sales_led / either, per D2) · `touchpoints` · `conversions` (attach at account **or** person
level, whichever resolved)

**4b · Attribution**
`channels` · `attribution_models` (last-click, first-click, linear, position-based, Aspen
default) · **`model_defaults` keyed by `funnel_shape`** so a same-session activation and an
eleven-week enterprise deal aren't scored by the same model (D2) · `attributions` (conversion
× channel × model, credit fraction) · `claim_conflicts` · `tracking_health` (scored checks,
run on demand)

**4c · Money**
`channel_daily` (generalises `ad_daily`, which stays at per-ad grain and rolls up) ·
`cost_items` (+ **`fidelity`**: known / blended / per_plan / metered and a measured/estimated
basis, per D4a) · `plan_costs` (L3 per-tier cost-to-serve) · `budget_plans` (daily/monthly,
scope, amount and currency) · `budget_recommendations` (suggested amount, evidence,
constraints and approval state) · `campaigns.budget_minor` and `currency` (already spec'd) ·
`campaigns.offer` (closes a known gap) · distinct `paused` / `archived` campaign states
(closes another) · `revenue_recognition` window for the lag band

**4d · Ad platforms**
Extend `ad_accounts` to include `google` and `meta` (+ manager id, customer id, currency,
timezone) · `platform_campaigns` · `platform_ad_groups` · `asset_groups` (PMax) ·
`platform_ads` · `keywords` (text, match type, negative) · `audiences` (customer list,
website, lookalike, contact list + external refs) · `platform_sync_log`

**4d.1 · Imports and external ownership**
`import_jobs` (provider, status, mapping report and error summary) ·
`external_campaign_refs` (channel, provider, external id, sync mode, provenance and last
synced time). The initial sync mode is `read_only`; adopting a campaign for Aspen management
requires an explicit later action and a provider capable of safe writeback.

No Shopping tables and no X campaign tables — both cut (Part 1).

**4e · Lifecycle**
`journeys` · `journey_steps` · `journey_runs` · `messages` · `message_sends` (full delivery
lifecycle incl. bounce and complaint) · `sending_domains` (SPF / DKIM / DMARC state,
warmup) · `esp_connections` (mirror or handoff mode) · `suppressions` · `consents`
(basis, source, region — not optional in the EU) · `landing_pages` (A6, creator-matched)

**4f · Creator portal**
Creator role and `creator_brand_links` (the walled join — a creator sees each brand
separately) · `deliverables` with review states (draft → submitted → in review → changes
requested → approved → live) · `review_events` · `threads` and `thread_messages` ·
`deal_terms` (**flat fee · CPM on post · % of ad spend · rev share on referred · affiliate
% · royalty on a winner**) · `payouts`

**4g · Creative intelligence**
`brand_assets` gains `talent_id`, `is_production_ugc`, and **`rights_expires_at`** — if
Aspen pays royalties for continuing to run a winner, it must know when the licence ends ·
`creative_tags` (setting, talent, hook type, pacing, format) · `diversity_snapshots`

**4h · Actions and automation**
`action_invocations` (actor: user / chat / slack / automation — the decision log) ·
`automation_rules` (condition, thresholds, mode: suggest / confirm / auto) · `approvals`
(surface: app or Slack)

**4i · Later, noted so the shape allows it**
`ai_citations` (engine, query, cited URL, whether it's content Aspen sourced) — the
measurable version of the AEO claim. One table, no urgency, but cheap to leave room for.

---

## Part 5 — Workstreams and waves

Sizes are relative (S / M / L / XL) with agent-pace week ranges assuming one reviewed build
stream and no approval delays. **The calendar risk in this plan is approvals, not code.**

### Wave 0 · Finish what's open — 1 week, in flight
B3 error/loading, B4 responsive, B5 accessibility and B6 quality/security are complete on
`uiux-remediation`, pending merge review. One PR off that branch.
New screens shouldn't land on a half-migrated repo.
**In parallel, today: start every external application in Part 6.** They are the long pole.

### Wave 1 · The spine — XL, 4–6 weeks
Migration (4a–4i). Action vocabulary spec, then registry, then `action_invocations`.
Tracking pixel plus a server-side ingest endpoint. Identity stitching (visitor → person →
account). Attribution engine with pluggable models, per-funnel-shape defaults, conflict
flagging, and the lag window. Cost model with the L1–L4 fidelity ladder and fully-loaded CAC.

Almost nothing user-visible ships here, which makes it the wave most likely to get rushed.
Don't. Nine features downstream read these tables.

### Wave 2 · Make the spine visible — L, 3–4 weeks
Setup health screen, scored, with the single next fix named (M2 — an in-app screen, not a
separate free product, per your answer). Cross-channel attribution screen with a model
switcher, conflict flags and the maturity band. Fully-loaded CAC and LTV-gross-profit tiles.
Creators ranked by delivered result, alongside ranked-by-fit (M10). Spend-to-revenue
elasticity chart (M4). Organic mix number (M9).

Ship the first **Growth Command Center** here: performance, spend, pacing and core metrics
across paid, retention, affiliate and creator channels, with every CAC/return figure showing
its fidelity. Add daily/monthly budget planning and Ads Engine recommendations in
recommend-only mode. Support universal CSV and manual imports first so existing affiliate,
creator and paid campaigns can be mapped into the common channel model before native
connectors are available.

Aspen's own affiliate program is the operating system and source of truth: partner
recruitment/approval, native links, campaign attribution, commission/deal terms, payouts and
reporting live in Aspen. PartnerStack, Rewardful and similar products are optional migration
sources for a customer who already uses them; Aspen does not depend on them to run an
affiliate program, and no account with them is required for the core build.

**Design-partner checkpoint 1.** Everything here works on the creator and affiliate product
that already exists, which makes this the first point Aspen is demonstrable end-to-end. Not a
launch — launch is end of Wave 7 — but the right moment to put it in front of a few real B2B
SaaS teams with real data and no pricing page. Cost-to-serve rungs L1–L3 ship here; L4 lands
with the Wave 1 ingest work and needs a customer willing to post the events.

### Wave 3 · Google + Meta — XL, 6–10 weeks, approval-gated
OAuth and account linking. Campaign mirror with two-way sync. Create, budget, launch, pause,
optimise — Search with keywords and negatives, Performance Max with asset groups, YouTube,
Demand Gen. **No Shopping** (cut). Meta alongside, same interface. Audience push (customer
lists, website, lookalikes). Match rate and enrichment score surfaced as first-class health
numbers. The 50-conversion readiness gate before any launch. The format bridge (C6) turning
one vertical asset into a legal asset group. Creative volume quota against budget (C3).

Everything goes through the `PlatformAdapter` interface `ADS-ENGINE-SPEC.md` PR-D already
defines, and the non-negotiable rule there still holds: **a push creates the campaign
paused.** Nothing spends until a human turns it on.

Native import priority is Google Ads, Meta Ads and LinkedIn Ads, with Reddit subject to API
feasibility. Imported campaigns begin as read-only mirrors. Budget recommendations may be
accepted by a human, but autonomous budget changes remain out of scope.

Craft blocks for Google and Meta need source material Aspen doesn't have — see Part 8.

Creative generation is a staged system, not a one-shot prompt: structured brief → evidence
floor → strategy → angle/hook matrix → materially distinct candidates → deterministic
claim/format checks → quality ranking → human selection. Scores describe groundedness and
craft quality, never forecast CTR or revenue. Mature performance can inform a later
hypothesis without overriding evidence rules or pretending correlation proves causation.

### Wave 4 · Creator portal, library, deals — L/XL, 5–7 weeks
The portal (second auth role, RLS on every creator-visible table, invite acceptance, upload
with review states, brand-side queue that deep-links into campaign context, walled history,
message threads). Library extensions: performed examples with numbers attached, brand
guidelines and do-not-say, approved deliverables auto-filed back. The six deal types
including royalty on a winner, with rights expiry. Creative tagging and the diversity audit
(C4). Public affiliate recruitment page with an application queue (A3).

**Design-partner checkpoint 2.** The full creator operating system. Second and best moment
for feedback before launch — the portal has a second audience (creators) whose reactions you
cannot predict from inside the building.

The portal is the one piece where a rushed guess is expensive: a creator uploading unreleased
content must be certain the wrong brand cannot see it. Design it fully here first.

Creator migration starts with the universal CSV mapper from Wave 2, followed by GRIN when
access is available. CreatorIQ and Aspire remain feasibility decisions driven by
design-partner demand.

### Wave 5 · Lifecycle — XL, 5–8 weeks
Journey builder on D5's engine. Email sending with domain authentication, warmup,
suppressions and consent. ESP connect in mirror-or-handoff mode for customers who already
run HubSpot or Customer.io. Retargeting audience sync into Google and Meta (which is why
Wave 3 comes first). LinkedIn Conversation Ads plus the assisted-send queue — **no DM
automation** (Part 1). Creator-matched landing pages (A6). Referral-offer journeys triggered
at the usage wall (A4). **No push** (cut).

Import and reporting priority is HubSpot and Customer.io first, Klaviyo next and Braze later.
Retention performance rolls into the same Growth Command Center rather than a separate
dashboard.

### Wave 6 · Chat, Slack, automation — M/L, 3–4 weeks
Chat side panel over the action layer, with the confirmation card as the centrepiece — it
shows the *criteria*, not just the recommendation. Decision log surfaced as a readable
history. Threshold-based continue/stop rules (G3). Slack as a **decision queue** first and a
chat second: three digests a day, approvals as buttons (G1). Close the generation loop so
version N+1 reads version N's results (G2).

The first chat job is a conversational campaign builder: it turns a multi-turn discussion
into a versioned brief, asks for missing launch-critical facts, prepares a plan and creative
drafts, then proposes only named D1 actions. Conversation cannot itself publish, send,
change spend or activate a campaign. Those steps retain their exact confirmation policy;
provider pushes still create paused campaigns and activation remains separate.

Thin *only* because Wave 1 built the vocabulary. Skip Wave 1's spec and this wave triples.

### Wave 7 · Homepage and positioning — S, design-only, any time
New hero (abstract, two overlapping fields with a solid shared centre — already locked). The
AI-citation argument. The affiliate validation stat. Ads and lifecycle in the story. Runs in
parallel with any wave; needs no repo work until the copy is settled.

### Parallelism
- Wave 7 anytime, by anyone.
- Creator portal and lifecycle **design** happen here while Waves 1–3 build there.
- Wave 3 is approval-gated, so if approvals stall, Wave 4 moves ahead of it.

---

## Part 6 — External gates: start these today

These are the items where waiting is the cost. Every one is a form, a review, or a person at
another company — none of them go faster because engineering is ready.

`EXTERNAL-ACCESS-CHECKLIST.md` is the operational source for paid, affiliate, creator and
retention access. The list below highlights the longest calendar gates.

1. **Google Ads API.** Needs a developer token, requested from a Google Ads manager
   account, and it arrives at *test* level. Test tokens can only touch test accounts, so
   basic access requires a submitted application and a review of how you use the API.
   Apply first, before any code.
2. **Meta Marketing API.** Business verification plus App Review for `ads_management` at
   advanced access. Expect to submit screen recordings of the flows, which means a working
   build — so plan the submission for mid-Wave 3, not the end.
3. **LinkedIn Marketing Developer Platform.** Partner application and approval. It is a
   Tier 1 adapter alongside Google and Meta; implementation order follows usable access and
   design-partner demand.
4. **Reddit Ads API.** Access terms are less documented; confirm before scheduling.
5. **Email sending.** A dedicated sending domain (e.g. `mail.aspen.xyz`) with SPF, DKIM and
   DMARC records, plus a sending provider account and a warmup schedule. Cheap, but it takes
   real calendar days and it must exist before the first journey sends.
6. **Legal, before lifecycle ships.** CAN-SPAM and GDPR basics: unsubscribe in every
   message, honoured within days; a lawful basis recorded per contact; a data processing
   agreement, because Aspen will hold your customers' customers' data. A pixel with identity
   stitching makes Aspen a data processor. Get this reviewed by someone qualified — it is
   the one item on this list I can't help with.

Because API terms shift, treat 1–4 as "confirm current requirements at the portal, then
schedule," not as fixed facts.

---

## Part 7 — Old questions this plan answers

From the audit's open list and `CLAUDE.md`'s known gaps:

- **`AdsLibrary.tsx` unrouted** → becomes the Tests library in ads engine PR-B.
- **`AuthenticAdStudio.tsx`** → deleted in B2-0, superseded.
- **No offer field on campaigns** → Wave 1 migration, 4c.
- **Pause and Archive share one status** → Wave 1 migration, 4c.
- **No `hotlist_id` on affiliate links** → already spec'd; lands in Wave 1.
- **No spend column** → Wave 1, widened to full cost.
- **`hotlist` and `campaigns` are user-scoped, not org-scoped** → this plan needs org
  scoping everywhere (a creator portal and a shared decision log make per-user ownership
  incoherent). Do it inside the Wave 1 migration, where the RLS rewrite is happening anyway.
  Deferring it again means doing the same rewrite twice.
- **`/health` has no auth guard** → admin-only. Free to fix in Wave 0.
- **Dark internal screens (admin, health, invite)** → leave dark. Internal tools looking
  internal is fine, and Wave 1–3 need the hours more.

---

## Part 8 — What I need from you

**Materials — in progress.**
- **Google and Meta ad craft guides** — you're sourcing these. Same shape as the four you
  uploaded for LinkedIn, X, Reddit and YouTube: benchmarks, formats, limits, what works. The
  ads engine compiles a craft block per platform at build time from those documents, so until
  they land, Google and Meta generation has no grounded platform knowledge and the evidence
  ladder's Tier 5 is empty for exactly the two platforms carrying the most spend. Needed
  before Wave 3's *generation* work, not before its API work — so there's runway.
- The **podcast transcript** again, if you want the second pass described in Part 0.
- Anything on **your own numbers** — real CPAs, conversion rates, sending volume. Benchmarks
  are currently borrowed; yours would be better.

**Decisions — settled 2026-08-21.**

| # | Decision | Outcome |
| --- | --- | --- |
| 1 | Google Shopping | **Dropped** |
| 2 | Push notifications | **Dropped** |
| 3 | X ads management | **Dropped** — X stays discovery-only |
| 4 | LinkedIn DM route | **Conversation Ads + assisted queue** |
| 5 | Go-to-market timing | **One launch, end of Wave 7**; Waves 2 and 4 are design-partner checkpoints |
| D1 | Action vocabulary | Confirmed |
| D2 | Event and identity spine | Confirmed, conversion list widened — self-serve activation now first-class |
| D3 | One channel model | Confirmed |
| D4 | Money spine | Confirmed; D4a approved 2026-08-23 with customer-supplied cohort estimates and no backend/provider-billing access |
| D5 | Automation engine | Confirmed |

**Wave 1 is unblocked.** D1–D5 are confirmed. Initial design partners receive free private
access; broader beta/public timing remains unchanged unless separately approved.

---

## Part 9 — Parked, on purpose

Named so they don't creep back in unnoticed: **newsletters as a fifth supply type** (the
largest new market in the transcript, and a different buyer motion) · **marketing-mix
modelling and holdout incrementality** (right after ~$1M/month spend; the daily-grain data
this plan captures is what makes it possible later) · **TikTok, Instagram and Meta organic**
· **paywall and trial UI design** (the trial-credit *economics* ship in Waves 1–2) · **the
growth-school idea** · **full AI video generation**, which he calls slop and which stays a
variation tool, never an origination one.

Cut outright, not parked: Google Shopping, push notifications, X ads management, LinkedIn DM
automation, and provider billing-API connectors (D4a).

---

## Reading order for whoever builds this

`MASTER-BUILD-PLAN.md` (this) → `SPEC-spend-and-attribution.md` (money conventions, still
law) → `ADS-ENGINE-SPEC.md` (adapter interface, evidence ladder) → `DESIGN-RULES.md`
(styling) → `TRANSCRIPT-BUILD-IDEAS.md` (the why behind several features).
