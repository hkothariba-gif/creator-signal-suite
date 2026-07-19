# Phase 5A — Authentic Ads Engine — Delivery Notes (built 2026-07-15)

> **v2 addendum (2026-07-17): Ads Engine v2.** Added on top of 5A, no migration needed:
> - `src/lib/ad-playbooks.ts` — evidence-backed platform playbooks (LinkedIn 95:5/memorable-over-clickable + char limits; X conversational; Reddit community-fit/no-hard-sell; YouTube ABCD + skip window) and **10 structural style filters** (Deadpan, Irreverent, Absurdist, Straight offer, Storyteller, Voice of the fan, Receipts, Contrarian, Educator, Launch energy). Styles are structural recipes, not tone adjectives — substance still comes from corpus + belief doc. Evidence: Google/Kantar ABCD (+30% sales likelihood), Binet & Field (emotional ≈2x rational), Kantar/Oracle humor research (brand must center the joke), B2B Institute (71% formulaic ads fail), uploaded 2023–2026 benchmark report.
> - **Third gate: platform fit** — LLM judge now tests swap + groundedness + platform practice, plus programmatic character-limit checks. Style + playbook stored in ad provenance.
> - `src/components/app/AdPreviewFrame.tsx` — platform-true preview mockups (LinkedIn/X/Reddit/YouTube shells). Style picker + LinkedIn platform option added to the Authentic Ads panel.
> - Design-tool decision: copy + AI imagery + previews for now; full canvas editor deferred post-MVP.

Grounded ad generation: copy is written only from real audience comments,
creators' spoken words, conversion-backed phrases (Phase 2), and a campaign
**belief doc** — never from tone adjectives. Every ad stores provenance ("why
this ad") and must pass two LLM-judge gates before it counts as clean: the
**swap test** (could a competitor ship it unchanged?) and the **groundedness
test** (does every claim trace to a source?). Design per the State of Brand
"Great Flattening" analysis: adjectives → the average of every brand; verbatim
material + beliefs → copy AI can't flatten.

## What was built

- **Migration `20260715090000_phase5a_authentic_ads.sql`** — campaigns get
  `brand_beliefs` / `proof_points` / `never_say`; new `ad_corpus` table
  (user-scoped RLS); ads get `campaign_id` + `provenance`. `types.ts` updated.
- **`src/lib/corpus-sources.server.ts`** — YouTube comment fetcher (creators'
  recent videos), transcript excerpts via the unofficial timedtext endpoint
  (best-effort; official captions API can't read others' videos), Reddit
  comment search. All return [] on failure; nothing fabricated.
- **`src/lib/ad-corpus.functions.ts`** — `collectAdCorpus` (comments +
  transcripts for top hotlist creators, Reddit audience language, converted
  link phrases from Phase 2), `listAdCorpus`.
- **`src/lib/ad-generation.server.ts`** — `generateAuthenticCopy`: grounded
  prompt (numbered verbatim sources + belief doc, generic-adjective ban),
  returns citations + echo phrases; judge gates with one retry-on-feedback;
  fails closed if the judge is unavailable.
- **`src/lib/ads.functions.ts`** — `generateAuthenticAd`: requires belief doc +
  ≥3 corpus quotes + LLM key; picks strongest sources (likes/ups/conversions);
  saves the ad with full provenance and gate results.
- **`src/components/app/AuthenticAdStudio.tsx`** + top slot in
  `src/routes/app.ads.tsx` — belief doc editor, corpus collect/browse, generate,
  gate badges, "Why this ad" quotes. Generated ads land in the existing library.

## Deploy

1. Local: `npx tsc --noEmit && npx vite build`, commit, `git push` (pull first).
2. SQL editor: run the contents of `supabase/migrations/20260715090000_phase5a_authentic_ads.sql`.
3. No new edge functions. No new secrets required beyond the signal keys:
   `LLM_API_KEY` (required to generate), `YOUTUBE_API_KEY` + `REDDIT_CLIENT_ID`/`REDDIT_SECRET`
   (corpus sources — the panel works partially with whichever is set). These go
   in the app host env (same place as `EMAIL_API_KEY`).

## Test plan

1. Ad Studio → Authentic Ads → pick a campaign with scored creators.
2. Write + save a belief doc (beliefs / proof / never-say).
3. Collect — expect comment counts (needs YouTube key); Reddit items with Reddit keys; converted phrases if Phase 2 has conversions.
4. Generate — ad appears with two green gate badges and quoted sources; check the draft shows in the ad library with `provenance` populated.
5. Adversarial check: put only vague text in beliefs ("we are innovative and customer-focused") — generation should come back gate-flagged, not silently clean.

## Known limits

- Transcripts are best-effort (timedtext often empty); corpus works from comments alone. A paid transcript provider or Whisper is the upgrade path.
- Reddit corpus quality depends on the campaign name/product being searchable terms.
- Gates are LLM judgment, not proof — provenance display is the human check.
- Phase 5B (publishing to X/Reddit/LinkedIn ads APIs) intentionally not included; decision point is end of 5A per the roadmap.
