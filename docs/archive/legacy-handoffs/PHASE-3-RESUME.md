# AspenReach Phase 3 — Resume Handoff

_Paused 2026-07-13. Everything below is what's done and exactly how to finish._

## TL;DR

Phase 3 (Discovery + per-campaign affiliate scoring + heat map) is **fully coded and saved**, but **not yet pushed to GitHub**. The six source files live in this repo under **`phase3-pending/`** (durable copies). All that remains: drop them into place, verify the build, and open/merge the PR.

## Status

- **Code: DONE.** Six files written and saved to `phase3-pending/` in this repo.
- **No migration needed.** Phase 3 reuses existing columns (`hotlist.score`, `hotlist.campaign_id`, `hotlist.profile_data` jsonb; `campaigns.product_description` / `target_audience` / `search_criteria`). No Supabase deploy required for Phase 3.
- **Not done:** move files into place, local build verify, branch + PR + merge on GitHub.
- **Security note:** the GitHub PAT minted last session was **deleted** and localStorage cleared at pause. A fresh token must be minted next session (GitHub re-prompts email/sudo verification each time).

## The six files (source → destination)

| Saved copy (durable) | Goes to | Type |
|---|---|---|
| `phase3-pending/src/lib/scoring.ts` | `src/lib/scoring.ts` | NEW (146 lines) |
| `phase3-pending/src/lib/creators.functions.ts` | `src/lib/creators.functions.ts` | NEW (196 lines) |
| `phase3-pending/src/components/app/CampaignPicker.tsx` | `src/components/app/CampaignPicker.tsx` | NEW (55 lines) |
| `phase3-pending/src/components/app/AffiliateHeatMap.tsx` | `src/components/app/AffiliateHeatMap.tsx` | NEW (122 lines) |
| `phase3-pending/src/routes/app.discovery.tsx` | `src/routes/app.discovery.tsx` | REWRITE (252 lines; replaces current 216-line version) |
| `phase3-pending/src/routes/app.hotlist.tsx` | `src/routes/app.hotlist.tsx` | REWRITE (233 → 306 lines) |

SHA-256 (first 12) of the saved copies, to confirm integrity next session:
```
5650ce79c0b7  src/components/app/AffiliateHeatMap.tsx
c1c09ef33df0  src/components/app/CampaignPicker.tsx
8ad815134c7a  src/lib/creators.functions.ts
22410b2f1051  src/lib/scoring.ts
d0065c9885df  src/routes/app.discovery.tsx
e31c423712b6  src/routes/app.hotlist.tsx
```

## What Phase 3 does (so you remember the intent)

1. **Per-campaign affiliates.** A `CampaignPicker` dropdown on Discovery and Hotlist. Each campaign shows only its own creators (via existing `hotlist.campaign_id`); "All campaigns" overview kept. Adding from Discovery attaches the current campaign.
2. **Scoring engine** (`scoring.ts` pure fns + `creators.functions.ts` server fn `scoreCampaignCreators`). Each creator scored 0–100 from four weighted inputs — alignment 40 / content 25 / channel 20 / comments 15, re-normalized across whatever data is available. Alignment uses the LLM key (keyword/Jaccard fallback when absent); channel pulls YouTube stats when `YOUTUBE_API_KEY` is set. Result saved to `hotlist.score` + breakdown in `profile_data.score_breakdown`.
3. **Heat map** (`AffiliateHeatMap.tsx`). SVG scatter: x = Fit (alignment), y = Reach (channel), colored by overall (≥70 green, ≥40 amber, else grey), "Best fit" quadrant highlighted, plus an always-visible fit-ranked list. Degrades gracefully when reach data isn't connected yet.
4. **Graceful DataGate fallbacks** everywhere — ships now, lights up as YouTube + LLM keys are set. No mock data.

## Finish steps (next session)

1. **Put files in place:**
   ```bash
   cd ~/Downloads/aspenreach-handoff/creator-signal-suite
   cp phase3-pending/src/lib/scoring.ts                      src/lib/scoring.ts
   cp phase3-pending/src/lib/creators.functions.ts           src/lib/creators.functions.ts
   cp phase3-pending/src/components/app/CampaignPicker.tsx    src/components/app/CampaignPicker.tsx
   cp phase3-pending/src/components/app/AffiliateHeatMap.tsx  src/components/app/AffiliateHeatMap.tsx
   cp phase3-pending/src/routes/app.discovery.tsx            src/routes/app.discovery.tsx
   cp phase3-pending/src/routes/app.hotlist.tsx             src/routes/app.hotlist.tsx
   ```
2. **Verify locally** (the real build; sandbox can't run full tsc/vite):
   ```bash
   git checkout -b phase-3-discovery-scoring
   npm install && npx tsc --noEmit && npx vite build
   ```
   Expect clean (Phase 1 & 2 both passed this way). `vite build` regenerates `routeTree.gen.ts`.
3. **Deliver to GitHub.** Either: `git add -A && git commit -m "Phase 3: discovery, per-campaign scoring, affiliate heat map" && git push -u origin phase-3-discovery-scoring`, then open a PR to `main` and merge — OR resume the browser-API push flow (mint a fresh classic PAT with `repo` scope, stash into localStorage immediately, create-tree/commit/ref/PR/merge, then delete the token).
4. **Delete the token** afterward if a browser PAT was minted.

## Reference values (from the paused browser push, may need recompute if main moved)

- Repo: `github.com/hkothariba-gif/creator-signal-suite` (Lovable-connected, auto-publishes on push to `main`).
- Supabase project: `hjxjukueextjejasaxql` ("Aspen reach").
- At pause, `origin/main` = `5d77c40`. Commit parent `5d77c407a84b5c0ca9db7723fa4ee1813c0b0212`, base_tree `088cf3dc9aae9dddfba8a4df46d5ed49196cc20e`, target_tree `ec7c20cda403a9d58a8c9c839a2b174895a0799b`. **If Lovable pushed new commits since, recompute these** — the simplest path is a normal `git push` + PR rather than the API tree method.

## After Phase 3

Roadmap for Phases 4–9 is in `ASPENREACH-REMAINING-ROADMAP.md`. Next up: Phase 4 (Outreach) or the user-priority Phase 5 (Ads Engine v2 + platform publishing to X/Reddit/LinkedIn).
