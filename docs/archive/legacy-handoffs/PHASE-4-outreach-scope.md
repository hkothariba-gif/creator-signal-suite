# Phase 4 — Outreach (Scoping Document)

_Scope only. No code yet. Goal: turn a shortlisted hotlist creator into a real, tracked, multi-touch conversation the brand manages inside AspenReach. Written 2026-07-13 after auditing the codebase and researching the current state of every channel API involved._

## 1. What we're building (in one paragraph)

Once a brand has added creators to a campaign's hotlist (Phase 3), Phase 4 lets them **find how to reach each creator**, **send an outreach message from inside the app**, and **manage the back-and-forth in one place** — across email first, then X, Reddit, and (in an assisted way) LinkedIn. The selling point is *multi-touch*: an email to their public business address, plus DMs on the platforms where they're active, all sequenced and tracked, with replies flowing back into a single inbox.

## 2. What already exists (so we don't rebuild it)

- **Hotlist + pipeline** — the `hotlist` table has `stage` (`saved → contacted → negotiating → contracted → live`), `campaign_id`, `platform`, `external_id`, `profile_data`. Adding creators and moving them through stages already works, and Phase 3 scores them. So "identify influencers and save them" is **done**; Phase 4 builds on it.
- **`app.outreach.tsx`** — exists but is an empty placeholder: two `DataGate` cards ("Sequences", "Delivery Metrics") gated on the `email` connector. This is our canvas.
- **"Contact Creator" button** on the creator profile — currently a stub that toasts "coming soon."
- **Connectors already reserved** — `email` (Resend, via `EMAIL_API_KEY`), `x` (`X_API_KEY/SECRET`), `reddit` (`REDDIT_CLIENT_ID/SECRET`), `youtube`, `phyllo` (creator data). **No** LinkedIn, Apollo, ZoomInfo, Gmail, or Outlook connector yet.
- **Conventions to reuse** — RLS via `is_org_member`/`can_edit_org`, `createServerFn` + `requireSupabaseAuth`, service-role writes via `supabaseAdmin` in edge functions, the `DataGate` "Waiting for API connection" / "No data to display" contract, and the idempotent-upsert pattern from Phase 2 ingestion.

## 3. The hard reality of each channel (this shapes everything)

The most important part of scoping this is being honest about what the platforms actually allow in 2026. Cold outreach is exactly the use case most of them restrict. Here's what the research found:

| Channel | Can we send programmatically? | How | Key limits / cost |
|---|---|---|---|
| **Email** | ✅ Yes — most reliable | Resend (already our connector) from the brand's own verified domain; or the brand's Gmail/Outlook via OAuth | CAN-SPAM (unsubscribe + physical address), domain warm-up/deliverability. Best channel by far. |
| **X (Twitter) DM** | ✅ Yes, with caveats | X API v2 DM endpoint, OAuth 2.0 user context | **Pay-per-use ~$0.015/DM** (no free tier for new devs as of Feb 2026). Can only DM someone who **follows you or allows DMs from anyone** — otherwise it fails. |
| **Reddit DM** | ✅ Yes | `/api/compose` with OAuth (`privatemessages` scope) | ~60–100 requests/min; cold DMs risk spam-filtering and account flags. |
| **LinkedIn message** | ❌ Not for cold outreach | Official Messages API is **partner-approved only**, first-degree connections or existing threads, member must edit the draft, no HTML. Explicitly **not allowed for prospecting**. | Realistic path is **assisted**: open a prefilled LinkedIn compose in the browser for the brand to send manually, and log it. (Third-party unofficial APIs like Unipile exist but carry ToS/account risk.) |
| **YouTube** | ❌ No messaging API at all | None | Reach YouTubers by **email only**. And the Data API does **not** expose the channel's email or socials — the About-page email is CAPTCHA-gated to humans. |

**Contact discovery reality:** because YouTube won't hand us an email, "organic" discovery means: read the channel **description** (which *is* available via the Data API and often lists a personal site + social handles) → crawl that personal/company site for a `mailto:` or `/contact` page → optionally fall back to a **paid enrichment provider**. On providers: **Apollo** is self-serve and credit-based (~1 credit to reveal an email, `reveal_personal_emails` flag) — a good optional adapter. **Hunter.io** is a cheaper domain→email finder. **ZoomInfo** is enterprise-only (~$50K/yr for prospecting, contract-gated) — **skip for now**.

**Reading replies (for the unified inbox) is unevenly hard:** inbound email is easy (Resend inbound webhook, or a reply-to address). Gmail *read* access is a Google **restricted** scope requiring an annual **CASA security audit** (real money + weeks); Outlook/Graph `Mail.Read` is a lighter user-consent delegated scope. X inbound DMs need the Account Activity API (also gated/paid); Reddit needs inbox polling. So a true real-time multi-channel inbox is a later increment, not v1.

## 4. Proposed data model (new migration, RLS on every table)

1. **`creator_contacts`** — discovered ways to reach a hotlist creator. `id`, `hotlist_id` (fk), `organization_id`/`user_id` (match existing scoping), `channel` (`email` | `x` | `reddit` | `linkedin` | `website`), `handle_or_address`, `source` (`youtube_description` | `website_crawl` | `apollo` | `hunter` | `manual`), `confidence` (0–1), `verified` (bool), `metadata` jsonb, timestamps. Unique on (creator, channel, address) for idempotent discovery.
2. **`outreach_threads`** — one conversation per creator per campaign. `id`, `hotlist_id`, `campaign_id`, `channel`, `status` (`draft` | `active` | `replied` | `bounced` | `closed`), `last_message_at`, timestamps.
3. **`outreach_messages`** — the message ledger. `id`, `thread_id`, `direction` (`outbound` | `inbound`), `channel`, `subject`, `body`, `status` (`queued` | `sent` | `delivered` | `failed` | `received`), `external_id` (provider message id, for idempotency + reply matching), `sent_by`, `sent_at`, `metadata` jsonb.
4. **`channel_connections`** — per-org auth state for a sending identity. `id`, `organization_id`, `provider` (`resend` | `gmail` | `outlook` | `x` | `reddit`), `status`, `external_account_id`/from-address, `connected_by`. **No secret material in the row** — tokens live in Edge Function env / a secrets table, exactly like Phase 2.
5. **`outreach_sequences`** + **`outreach_sequence_steps`** _(Phase 4c)_ — reusable multi-touch templates: ordered steps with `channel`, `delay_hours`, `template_body`, and a `stop_on_reply` rule.

No changes needed to `hotlist` itself — sending the first message flips its `stage` to `contacted` using the column that already exists.

## 5. Architecture

- **Contact discovery** = an edge function `discover-contacts` (service role) that, for a hotlist creator: pulls the YouTube channel description via the Data API, extracts website + social links, fetches the website and scans for `mailto:`/contact pages, and — if a provider key is set — calls the enrichment adapter. Provider-agnostic core with `apollo`/`hunter` adapters, same shape as Phase 2's provider pattern. Writes rows to `creator_contacts` idempotently. Ships dormant (DataGate) and lights up as YouTube/provider keys are set.
- **Sending** = an edge function `send-outreach` with a **per-channel adapter** (`email`→Resend/Graph, `x`→DM v2, `reddit`→compose). The app writes an `outbound` `outreach_messages` row (`queued`); the function delivers it, stores the provider `external_id`, and updates status. LinkedIn's "adapter" just records the message and returns a prefilled compose deep-link for the brand to send by hand.
- **Receiving** = inbound webhooks where available (`ingest-outreach-reply`, gated by a shared secret like Phase 2's postback): Resend inbound / Graph subscription for email; Reddit inbox poll on a schedule; X Account Activity later. Matches replies to threads by `external_id`/participant and appends `inbound` messages, flipping thread `status` to `replied` (and optionally hotlist stage to `negotiating`).
- **UI** — (a) a **contact panel** on the creator profile showing discovered `creator_contacts` with a "find contacts" action; (b) a **composer** (the real "Contact Creator") to pick a channel, write/tweak a message, and send; (c) the **outreach page** becomes a real **inbox + sequences** view — threads list, conversation view, and (4c) sequence builder + delivery metrics wired to `outreach_messages`.

## 6. Build sequence (DECIDED 2026-07-14)

Decisions made: **(1)** send via **Resend from the brand's own domain** first; **(2)** contact discovery is **organic-only** first (YouTube description + website crawl), with paid enrichers as a later dormant adapter; **(3)** the first release is **multi-channel with a unified inbox** — email + X + Reddit + LinkedIn-assisted — not an email-only MVP.

Because v1 is multi-channel, it's built as internal increments that only ship once they're all wired into one inbox:

- **4-1 Foundation (channel-agnostic).** Migration for `creator_contacts`, `outreach_threads`, `outreach_messages`, `channel_connections` (+ RLS, `types.ts`); server functions to list/create threads and messages; the real composer UI; the "Contact Creator" button opens it; sending flips hotlist stage to `contacted`.
- **4-2 Organic contact discovery.** `discover-contacts` edge function: pull YouTube channel description → extract website + social handles → crawl the site for `mailto:`/contact page → write `creator_contacts`. Contact panel on the creator profile.
- **4-3 Email channel.** `send-outreach` email adapter via Resend from the brand's verified domain; inbound reply capture via Resend inbound webhook (`ingest-outreach-reply`, shared-secret gated); CAN-SPAM unsubscribe + address baked in.
- **4-4 X + Reddit DM channels.** DM adapters (X DM v2 pay-per-use; Reddit `/api/compose`), each behind its connector's DataGate; inbound via Reddit inbox poll and (later) X Account Activity.
- **4-5 LinkedIn-assisted.** Record the message + return a prefilled compose deep-link the brand sends manually; logged as an outbound message so the thread stays complete.
- **4-6 Unified inbox + sequences.** The `app.outreach.tsx` page becomes threads list + conversation view across all channels, plus multi-touch sequences (steps, delays, stop-on-reply) and delivery metrics. **This is the point the whole thing ships.**

_Deferred to a later phase:_ bring-your-own Gmail/Outlook sending (Outlook first — lighter scopes; Gmail needs OAuth verification and CASA for reply-reading), and paid enrichment providers (Apollo/Hunter).

**Credentials this will need to actually function (vs. ship dormant behind DataGate):** a verified Resend domain (email), an X developer account on pay-per-use (X DM, ~$0.015/msg), a Reddit OAuth app (Reddit DM), and `YOUTUBE_API_KEY` (already reserved) for discovery. LinkedIn needs nothing (manual-assisted).

## 7. Open decisions (need your call before we build 4a)

1. **Sending identity first:** Resend-from-your-own-domain (fastest, best deliverability control, no per-user OAuth) **vs.** connect Gmail/Outlook up front (feels native but adds OAuth + Google's CASA audit for reply-reading). Recommendation: **Resend first**, add BYO-inbox in 4e.
2. **Enrichment providers:** organic-only first (YouTube description + website crawl), or wire a paid provider (Apollo/Hunter) into 4b now? Recommendation: **organic first**, provider as an optional dormant adapter.
3. **LinkedIn expectation:** confirm that **assisted (prefilled compose + manual send)** is acceptable for v1, since the official API forbids cold DMs.
4. **v1 inbox breadth:** ship 4a with **email-only** send + reply capture, then add channels in 4d — or hold the release until multiple channels work? Recommendation: **email-only first**.

## 8. Compliance & deliverability guardrails (build these in, not bolt-on)

CAN-SPAM for every email (one-click unsubscribe + a physical mailing address, honored automatically); per-channel rate limiting and backoff; domain warm-up guidance; and respecting each platform's ToS (especially X's "recipient must allow DMs" and Reddit/LinkedIn anti-spam rules). These aren't optional niceties — ignoring them gets the sending domain and platform accounts banned, which kills the product's value.

## 9. Sources (channel research)

- X API DM + pricing: developer.x.com, postproxy.dev, zernio.com
- LinkedIn messaging restrictions: Microsoft Learn (LinkedIn Messages API), connectsafely.ai, nubela.co
- Reddit API messaging + limits: support.reddithelp.com, zernio.com
- YouTube Data API (no email/socials): developers.google.com/youtube
- Apollo enrichment API + pricing: docs.apollo.io
- ZoomInfo (enterprise-only): zoominfo.com, cleanlist.ai
- Gmail restricted-scope/CASA: developers.google.com, deepstrike.io
- Microsoft Graph Mail.Send: learn.microsoft.com
