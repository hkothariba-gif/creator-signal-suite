# AspenReach — Roadmap & MVP Plan (updated 2026-07-14)

_Supersedes the earlier phase list. Done and deployed: Phase 0 (foundation/roles/teams), Phase 1 (Ad Studio), Phase 2 (affiliate tracking), Phase 3 (discovery/scoring/heat map), Phase 4 (multi-channel outreach). Next build: **Phase 4E** (scoped in `PHASE-4E-KICKOFF.md`), with this plan defining what comes after._

## The MVP (decided 2026-07-14)

**Target: public self-serve launch.** A brand can sign up, discover and score creators, recruit them from its own inbox, generate authentic ads, track conversions, and pay affiliates — with no hand-holding from us.

**MVP =** Phases 0–4 (shipped) + **4E** + **signal-key activation** + **Phase 5A** (authentic ads engine) + **Phase 6** (payouts, lite → full) + **launch hardening**.

**Post-MVP (much later):** Phase 5B platform publishing (decide at 5A completion), Phase 7 residual KYC, Phase 8 Community, Phase 9 Expansion.

### Build order

1. **Phase 4E — BYO inbox + outreach fast-follows** (next; scoped, decisions locked). Also required for public launch: Google OAuth app verification for Gmail send (production users), or Outlook-only at launch.
2. **Signal-key activation** — set the deferred Phase 1/3 keys (YouTube, Reddit, LLM, Brand24/Phyllo/X/Trends/Image as available) so discovery, scoring, and the heat map actually light up. Mostly guided setup, not code. Prerequisite for Phase 5A's grounding corpus.
3. **Phase 5A — Authentic Ads Engine** (spec below).
4. **Phase 6 — Payouts**: 6A lite (ledger + statements, pay manually) → 6B full automation (Stripe Connect; absorbs most KYC).
5. **Launch hardening** (see below), then public launch.
6. **Phase 5B — platform publishing** if not pulled into MVP at the 5A checkpoint.

## Phase 5A — Authentic Ads Engine  ★ redefined

Extends Phase 1's Ad Studio. Core principle (from the State of Brand piece on brand-voice flattening, 2026-07-12): **AI given tone adjectives produces the statistical average of every company; AI given concrete, verbatim, brand-specific material produces something no competitor could ship.** So this engine is *grounded generation* — ads assembled from real language people actually used, never from "professional, friendly, innovative."

### Grounding corpus (primary sources only — never inferred from the brand's website, which is likely already AI-averaged; avoid the closed loop)

1. **Audience comments** — top/representative comments on the campaign's creators' content (YouTube, Reddit via existing connectors): real phrases, objections, praise, vocabulary.
2. **Creator spoken content** — transcripts of affiliate videos: how influencers actually describe the product in their own words. ⚠️ Reality check: the official YouTube captions API only allows downloading captions for videos you own, so third-party transcripts need the unofficial timedtext route (fragile), a transcript provider (e.g. Supadata/similar), or Whisper on audio — pick at build time; comments corpus works regardless.
3. **Conversion-backed phrases** — Phase 2 affiliate performance data: which creators/messages actually convert, weighting their language higher.
4. **Brand belief doc** — new campaign-level fields replacing tone adjectives: *what we believe* (specific enough a rival CMO would object), *proof points/decisions*, *sentences we will never publish*. The doc a competitor couldn't adopt unchanged.

### Generation rules

- **Provenance required**: every generated concept stores and displays its sources — the comment quotes, transcript excerpts, and performance data it was built from ("why this ad"). Extends the no-mock-data convention: **no ungrounded copy, ever**. No corpus → DataGate waiting state, not generic output.
- **Anti-flattening gates** (from the article's tests, run as automated LLM-judge checks before a concept is shown):
  - *Swap test*: could a competitor ship this ad unchanged? → reject.
  - *Groundedness*: does every claim trace to a corpus item? → reject if not.
- **Mockups/variants** per platform (feed, story, etc.), editable — carried over from the original Phase 5 scope.

### Dependencies

YouTube + Reddit + LLM keys (step 2 above), Phase 2 conversion data, Phase 3 scored hotlist. Ships behind DataGate and lights up as keys/data arrive.

## Phase 5B — Platform Publishing (decision deferred to end of 5A)

The bridge to X/Reddit/LinkedIn ads APIs: per-platform OAuth ad-account connection, draft → review → publish, status tracking (reserved `adAccount`/`adsMiddleware` connectors). Big per-platform lift; brands can manually export 5A creative in the meantime, so this can follow the public launch without blocking it.

## Phase 6 — Payouts (MVP)

- **6A — Payouts-lite:** computed earnings ledger from Phase 2 conversions, payout statements, minimum thresholds, admin approval; the brand pays manually (PayPal/bank) and marks paid.
- **6B — Full automation:** **Stripe Connect** (Express accounts) — affiliates onboard themselves and Stripe handles identity/KYC/tax collection, which **absorbs most of old Phase 7**. Payout schedules, approval before money moves, ledger reconciliation. PayPal as secondary if demanded.

## Launch hardening (public self-serve gate)

- **Billing & plans** — a public SaaS needs subscriptions (reserved `billing`/`stripe` connectors). Currently unscoped; must be scoped before launch. ⚠️ Open item.
- **Email sending at scale** — Google OAuth verification for Gmail (from 4E), and/or a verified Resend domain as platform fallback.
- **Org scoping cleanup** — `campaigns`/`hotlist` are still `user_id`-scoped (Phase 0 design); migrate to `organization_id` for team sharing before public teams use it.
- Onboarding flow, rate limits, abuse controls (outreach spam prevention), CAN-SPAM enforcement.

## Relegated to much later (post-MVP)

- **Phase 7 — Identity/KYC:** mostly absorbed by Stripe Connect onboarding in 6B; only residual needs (e.g., non-Stripe geographies) remain.
- **Phase 8 — Community:** creator community surface (`/app/community` shell) — wins, referrals, leaderboards.
- **Phase 9 — Expansion:** new platforms/markets, integrations, scaling tools.

---

### Cross-cutting notes (unchanged)

- **No mock data, ever** — every panel gates through `DataGate`; all scoring and now all ad copy is real computation/real language, never fabricated.
- Reference: brand-voice flattening article — thestateofbrand.com `/news/brand-voice-ai-software-adjective-list-great-flattening`.
