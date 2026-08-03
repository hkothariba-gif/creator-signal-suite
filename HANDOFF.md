# Aspen design handoff → creator-signal-suite

Ported from the Aspen design files into React/TSX so Lovable can pick them up
through GitHub. **Everything here is presentational** — no data layer, no router
wiring. That's the job below.

Repo: `hkothariba-gif/creator-signal-suite` · branch `main`

---

## What's in the box

```
tailwind.config.ts           → the design tokens (merge with yours)
DESIGN-RULES.md              → paste into Lovable's Knowledge panel
src/aspen/
  AspenHome.tsx            → landing page          (src/routes/index.tsx)
  AspenLogin.tsx           → login                 (src/routes/login.tsx)
  AspenEarlyAccess.tsx     → signup, reframed      (src/routes/signup.tsx)
  AspenOnboarding.tsx      → 2-step setup          (src/routes/onboarding.tsx)
  AspenApp.tsx             → ALL 12 app screens in one component
  aspen.css                → base styles + 57 extracted pseudo-state rules
  theme.ts                 → tokens as plain TS (for use outside Tailwind)
public/aspen/*.webp        → clay illustrations (1200×1200)
public/aspen/vid/*.mp4     → 4 clay film clips used on the landing page
public/tour/               → the standalone scroll-through film (serve at /tour)
```

## Do this first (in order)

1. **Copy** `src/aspen/` and `public/` into the repo root, merging with what's there.
2. **Tailwind** — merge `tailwind.config.ts` into the repo's config, and paste
   `DESIGN-RULES.md` into Lovable's Knowledge panel (Settings → Knowledge) so
   future prompts inherit the palette and the content rules.
3. **Fonts** — `aspen.css` imports Bricolage Grotesque + Instrument Sans from
   Google Fonts. If the app already has a font pipeline, move the `@import` there.
4. **Mount the pages.** Each component is a default-exported class component that
   takes no props. In each target route, render it in place of the current body:

   ```tsx
   import AspenHome from '../aspen/AspenHome';
   export const Route = createFileRoute('/')({ component: AspenHome });
   ```

5. **Split `AspenApp.tsx`.** It holds all 12 screens behind `state.screen` plus a
   sidebar, because the design needed to be clickable in one file. For the repo,
   split it: the shell (sidebar + header) becomes the `app.tsx` layout route, and
   each `{v.isXxx ? (…) : null}` block becomes its existing `app.<name>.tsx`
   route. The `screenMeta` and `nav` arrays at the top of the class are the map.

6. **Replace the sample data.** Every array literal in `renderVals()` /
   the class fields is design filler (creators, threads, signals, payouts,
   revenue). Swap for the real hooks and delete the literals. `renderVals()`
   returns a flat object of view values — treat it as the seam: keep its shape,
   change its source.

## Conversion notes (read before you refactor)

- **Styling is Tailwind utilities** against the tokens in `tailwind.config.ts` —
  merge that file's `theme.extend` into the repo's existing config. Every colour
  in the design is a named token (`bg-cream`, `text-accent`, `border-border`);
  if you ever need a hex that isn't there, add the token rather than inlining it.
- **Sizes are arbitrary values** (`text-[13.5px]`, `p-[20px_32px]`) because the
  design's scale doesn't map onto Tailwind's default steps. That's intentional —
  don't round them to `text-sm`/`p-6`, it changes the design.
- **~70 declarations are still `style={{}}`**: data-driven values (a bar's
  height, a chip's active colour) that can't be static classes. Leave them.
- **Pseudo-states are `.ahN` classes in `aspen.css`** (`ah1`…`ah57`), one per
  element that had a hover/active state in the design. They're mechanical and
  ugly on purpose — each maps to exactly one `hover:` utility set. Convert them
  in the same pass as the inline styles, or leave them; they work.
- **Lists** render as `(v.items || []).map((item, $index) => <React.Fragment
  key={$index}>…)`. Replace `$index` keys with real ids once the data is real.
- **Conditionals** render as `{v.flag ? (<>…</>) : null}`.
- **`{/* TODO port */}` markers** flag the one or two places where the design
  used a host-specific element. Each keeps its original markup in the comment.
- The class components are faithful but plain — converting them to hooks is
  optional and safe to do route by route after the data is wired.

## Content rules that must survive the port

- **No fabricated social proof.** No testimonials, customer logos or review
  counts anywhere. Trust comes from industry statistics, each cited once, with
  sources credited in the footer.
- **Two CTAs only:** "Get early access" (primary) and "Talk to us" (enterprise).
- **Four platforms:** YouTube, Reddit, X, LinkedIn. Instagram/TikTok/Meta are
  roadmap-only — don't add them to feature copy.
- **Early-access framing** throughout: waitlist, cohorts, launch pricing locked
  12 months. Nothing implies the product is generally available.
- Voice: plain and conversational, written for a 25–35 y/o marketer.

## Design tokens (also in theme.ts)

| Token | Value | Use |
| --- | --- | --- |
| cream | `#FAF7F1` | page background |
| dark | `#17141E` | text, dark sections |
| accent | `#F2542D` | primary CTA, orange |
| highlight | `#FFD84D` | yellow emphasis |
| tint | `#FFECD9` | warm callout blocks |
| border | `#E8E2D6` | 1.5px card borders |
| muted / subtle | `#4A4553` / `#8A8494` | body / meta text |

Headings: Bricolage Grotesque 800, `letter-spacing: -0.03em`.
Body: Instrument Sans 400–700. Cards: 20–26px radius, 1.5px borders.
Platform colours are for platform marks only: YouTube `#F03`, Reddit `#FF4500`,
X `#17141E`, LinkedIn `#0A66C2`.

## Suggested prompt for Claude Code

> Read HANDOFF.md. Merge tailwind.config.ts into our Tailwind config, copy
> src/aspen and public into this repo, then wire
> AspenHome, AspenLogin, AspenEarlyAccess and AspenOnboarding into their target
> routes, keeping TanStack Router conventions. Don't touch AspenApp yet. Run the
> dev server, fix any type or import errors, then commit and push to main.

Do the landing/auth/onboarding pages first and confirm Lovable renders them
before splitting `AspenApp.tsx` — that one's a bigger job and easier to review
on its own.
