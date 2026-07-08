## 1. New section: Ads Intelligence Engine

Create `src/components/landing/AdsIntelligence.tsx` and place it in `src/routes/index.tsx` **immediately before** `LinkedInRevenue` (which will actually be removed — so it becomes the section right after `ProblemSolution` and before `HeatMapSection`).

Purpose: show how Aspen fuses multiple live signal streams into ad creative that converts.

Layout (built with existing design tokens — no new colors):

- Eyebrow: "Ads Intelligence Engine"
- Headline: "Ads built from real signals, not guesses."
- Subline: one line explaining the fusion approach.
- Center visual: a "signal fusion" diagram
  - Left column: 5 signal input cards (icon + label + one-line description), stacked with staggered fade-up:
    1. Affiliate & influencer performance
    2. Social chatter (Reddit / X threads)
    3. Brand posts & creator uploads
    4. Comment sentiment & buyer intent
    5. Organic engagement velocity
  - Middle: an animated "Aspen Engine" node (pulsing green ring using `#00D97E`, same halo styling as hero)
  - Right column: 3 output cards — "Ad hook", "Creative angle", "Target segment"
  - Connect left→center→right with subtle dashed lines (SVG, `stroke-dasharray` with a slow `animate` for signal flow)
- Bottom strip: small caption "Every draft is traceable back to the signal that inspired it."

Reuse `WordStagger`, `FadeUp`, and the platform icons already in `src/components/landing/`. Motion via `framer-motion` (already used across the page). No fabricated numbers.

## 2. Home page reorganization

Edit `src/routes/index.tsx` to this order:

```text
LandingNav
Hero
PlatformRevenueTabs      (covers all 4 platforms already)
TrustBar
ProblemSolution
AdsIntelligence          (NEW)
HeatMapSection
PlatformCards
Pricing
FinalCTA
LandingFooter
```

Removed: `LinkedInRevenue` (redundant — PlatformRevenueTabs already covers LinkedIn alongside the other platforms). Leave `LinkedInRevenue.tsx` in the repo untouched in case it's reused elsewhere; just drop the import + usage from `index.tsx`.

Net effect: one section removed, one section added — same total count, tighter narrative (problem → how the engine works → proof → platforms → pricing → CTA).

## 3. Pricing update

Edit `src/components/landing/Pricing.tsx`:

- Starter: **$499/mo** (was $99)
- Growth: **$999/mo** (was $299), keep `popular: true`
- Scale → rename to **Enterprise**, price becomes **"Custom"** (render the string instead of `$` + number, hide the `/mo` suffix when price is non-numeric), CTA "Contact Sales"

Keep the existing feature bullets on all three tiers unless you want them refreshed — flag if so.

## Technical notes

- New file only: `src/components/landing/AdsIntelligence.tsx`. All other changes are localized edits to `index.tsx` and `Pricing.tsx`.
- `Pricing.tsx` price rendering needs a small conditional so "Custom" renders without a `$` prefix and without `/mo`.
- No backend, DB, or route changes.
