# Aspen UI/UX — batch prompts for Claude Code

One prompt per batch. Run them **in order**. Each is self-contained: paste it, let it
finish, check the result, then move to the next.

Companion files, all four of which must sit in `aspen-handoff/` in the repo:
`B1-TOKEN-MAP.md` (hex → token table), `aspen-uiux-audit-and-remediation-plan.md` (the
findings the batches cite by ID), and `aspen-stage-1-uiux-pass.md` (what was already fixed).

The typecheck command is `npx tsc --noEmit -p tsconfig.json`. This repo has no `tsgo`.

---

## Setup — getting Claude Code pointed at the repo

Do this once. **Safe, nothing here changes your code.**

1. Open **Terminal**. It's in Applications → Utilities → Terminal. Or press `Cmd+Space`,
   type `terminal`, press Return.

2. Tell it which folder your code is in. Type `cd ` (with the space), then drag the
   `creator-signal-suite` folder from Finder into the Terminal window — it fills in the
   path for you — then press Return.

3. Put the token map where Claude Code can read it. Download `B1-TOKEN-MAP.md` from this
   project, then in Finder press `Cmd+Shift+G`, paste the path to your repo, add
   `/aspen-handoff` to the end, and press Return. Drop the file in there. If there's no
   `aspen-handoff` folder, make one first (`Cmd+Shift+N`).

4. **Make a branch.** A branch is a parallel copy of your code — work on it and `main`
   stays untouched until you choose to merge. In Terminal, type:

   ```
   git checkout -b uiux-remediation
   ```

   Press Return. This is safe and reversible.

5. Start Claude Code — type `claude` and press Return.

6. Paste a batch prompt below. Press Return.

**After each batch**, in Terminal:

```
git add -A && git commit -m "B2-1: token migration, campaigns + outreach"
```

That saves a checkpoint. If a later batch goes wrong you can rewind to it.

**If a batch goes badly wrong** and you want to throw the work away and start that batch
over — `git reset --hard HEAD` discards everything since your last commit. That one is
**irreversible**, so only run it when you're sure.

---

## B2-0 — Delete the dead code (do this first)

> Read `aspen-handoff/aspen-uiux-audit-and-remediation-plan.md`, findings C5 and C6.
>
> A previous pass established the real dependency picture, so work from this rather than
> re-deriving it:
>
> - `AppShell.tsx` exports four things. `AppShell` and `Wordmark` are dead. `Card` and
>   `StatCard` are **live** — used by `admin.tsx`, `AdsLibrary.tsx` and `AuthenticAdStudio.tsx`.
> - `CampaignPicker.tsx`'s only importer is `AuthenticAdStudio.tsx`.
> - `AuthenticAdStudio.tsx` (666 lines, 71 hex literals, zero importers) **is being deleted.**
>   It is superseded by the Ads Engine spec in `aspen-handoff/ADS-ENGINE-SPEC.md`. It stays
>   recoverable from git history.
>
> Do this:
>
> 1. Delete `src/components/app/AuthenticAdStudio.tsx`.
> 2. Delete `src/components/app/CampaignPicker.tsx` — its only importer is now gone.
> 3. Move `Card` and `StatCard` out of `AppShell.tsx` into a new
>    `src/components/app/Card.tsx`, moving their code verbatim. No restyling, no token
>    migration — that happens in a later batch.
> 4. Repoint the importers of `Card` / `StatCard` at the new module. Import lines only;
>    change nothing else in those files.
> 5. Delete `src/components/app/AppShell.tsx` once it is empty of live exports.
> 6. Leave `AdsLibrary.tsx` in place and unmigrated — it is wanted for finding H1.
>
> Then `npx tsc --noEmit -p tsconfig.json`. Report: files deleted, files created, importers
> repointed, typecheck result.

## B2-1 — Token migration: campaigns, outreach, platforms

> Read `aspen-handoff/B1-TOKEN-MAP.md` first — it is the authoritative hex → token table
> for this repo. Read sections 0, 1, 2 and 4.
>
> Migrate hardcoded hex colour literals to design tokens in exactly these four files:
>
> - `src/routes/app.campaigns.$id.tsx` (~20 literals)
> - `src/routes/app.outreach.tsx` (~15)
> - `src/routes/app.campaigns.index.tsx` (~8)
> - `src/routes/app.platforms.tsx` (~9)
>
> Rules:
> - Use only tokens that already exist in the `@theme` block of `src/styles.css`, plus the
>   snap-to substitutions in section 2 of the token map. Add no new tokens in this batch.
> - Tailwind v4. There is no `tailwind.config.ts`; never create one.
> - All four files render inside `.aspen-scope`, so the scoped names (`accent`, `border`,
>   `muted`) are safe here. Verify that assumption per file before relying on it.
> - Many literals live in `style={{ }}` objects and lookup maps (`STATUS_STYLE`,
>   `STAGE_PILL`, `PLATFORMS`), not in `className`. For those, use the CSS variable form:
>   `background: "var(--color-success-wash)"`. Do **not** restructure maps into className
>   strings — this batch is mechanical only.
> - Change no layout, spacing, logic, or copy. Colour values only.
> - The rendered colour must be identical before and after, except for the seven
>   deliberate snap-to-nearest substitutions in section 2 of the token map.
>
> Then run `npx tsc --noEmit -p tsconfig.json`. Report in one line per file: literals
> replaced, and the typecheck result.

---

## B2-2 — Token migration: heat map, intelligence, panels

> Read `aspen-handoff/B1-TOKEN-MAP.md` sections 1 and 2.
>
> Same rules as the previous batch. Files:
>
> - `src/components/app/AffiliateHeatMap.tsx` (~12)
> - `src/components/app/CampaignIntelligence.tsx` (~12)
> - `src/components/app/OutreachPanels.tsx` (~7)
> - `src/components/app/DataGate.tsx` (~7)
>
> Two specifics:
> - `AffiliateHeatMap` needs one new token. Add `--color-warn-ink: #c98a2e;` to the
>   `@theme` block in `src/styles.css` and use it for the mid-band score colour at line 31.
> - `DataGate`: migrate its hex literals only. Do **not** invert its dark-by-default
>   styling — that is a separate finding scheduled for B5, and changing it here would alter
>   every panel in the app.
>
> `OutreachPanels.tsx` is described in the audit as the cleanest component in the app for
> token usage. Its few literals are hover states and chart colours — treat them carefully
> and preserve exact hover behaviour.
>
> Then `npx tsc --noEmit -p tsconfig.json`. Report per file plus typecheck.

---

## B2-3 — Token migration: creators, hotlist, ads, documents

> Read `aspen-handoff/B1-TOKEN-MAP.md` sections 1 and 2. Same rules as previous batches.
>
> - `src/routes/app.creators.$id.tsx` (~7)
> - `src/routes/app.hotlist.tsx` (~6)
> - `src/routes/app.ads.tsx` (~5)
> - `src/components/app/CampaignDocuments.tsx` (~3)
>
> One new token pair for `CampaignDocuments`. Its "Failed" row uses `#FFE3DB` / `#B03418`,
> which are semantically failure colours, not brand accent. Add to the `@theme` block in
> `src/styles.css`:
>
> ```css
> --color-danger-wash: #ffe3db;
> --color-danger-ink:  #b03418;
> ```
>
> Put them in `@theme` proper, not inside `.aspen-scope` — these names don't collide with
> the shadcn theme.
>
> Then `npx tsc --noEmit -p tsconfig.json`. Report per file plus typecheck.

---

## B2-4 — Token migration: the dark-theme screens

> Read `aspen-handoff/B1-TOKEN-MAP.md` — **section 0(a) especially**, then 1 and 3.
>
> - `src/routes/admin.tsx` (~10)
> - `src/routes/health.tsx` (~17)
> - `src/components/app/AdsLibrary.tsx` (~12)
> - `src/components/app/AdPreviewFrame.tsx` (~9)
> - `src/components/app/Card.tsx` (the pair extracted in B2-0)
>
> Per-file counts in the map run ~70% low across every batch measured so far — expect
> roughly 80 literals here, not 48. Don't stop at the estimate.
>
> Also pick up what B2-2 deferred for want of the dark ramp: three `#5A6478` and one
> `#F0F4FF`. Leave `DataGate.tsx:127`'s `bg-[#0C1222]` alone — that class name is the hook
> for the `!important` rules at `styles.css:468,479`; it belongs with the B5 inversion.
>
> **These files do not render inside `.aspen-scope`.** Aspen token names (`text-muted`,
> `border-border`, `text-accent`) will silently fall back to the shadcn dark theme in them.
> Use the legacy dark ramp instead: `--color-bg-base`, `--color-bg-surface`,
> `--color-bg-elevated`, `--color-brand-green`, `--color-brand-muted`,
> `--color-brand-violet`, `--color-brand-amber`.
>
> Three tokens are missing from that ramp. **Add these first**, to the `@theme` block in
> `src/styles.css` (in `@theme` proper, not inside `.aspen-scope` — they don't collide):
>
> ```css
> --color-brand-ink:    #f0f4ff;  /* body text on dark */
> --color-brand-dim:    #5a6478;  /* tertiary text on dark */
> --color-brand-danger: #ff6b6b;  /* failed states on dark */
> ```
>
> This is a token migration only. Do **not** re-skin these screens to the cream Aspen
> theme — that's audit finding H13 and a separate job.
>
> `AdPreviewFrame.tsx` is a special case. Its `#1a1a1a`, `#1f1f1f`, `#0b1416`, `#d93a00`,
> `#FCC934`, `#3ea6ff` values reproduce YouTube's and Reddit's own ad chrome inside a
> preview. They are content, not theme. Don't tokenise them — instead collect them into one
> `PLATFORM_CHROME` const at the top of the file with a comment explaining why they stay
> literal. Do tokenise its `#00D97E` and `#0a66c2` normally.
>
> Then `npx tsc --noEmit -p tsconfig.json`. Report per file plus typecheck.

---

## B2-5 — Token migration: sweep-up

> Read `aspen-handoff/B1-TOKEN-MAP.md` sections 1 and 2.
>
> - `src/routes/app.community.tsx` (~2)
> - `src/routes/app.tsx` (~1, at line 432)
>
> Then re-run the sweep to confirm the batch is complete:
>
> ```
> rg -n "#[0-9a-fA-F]{3,6}" src/routes src/components/app
> ```
>
> Expected remaining hits, and nothing else:
> - `AdPreviewFrame.tsx` — the `PLATFORM_CHROME` const from B2-4
> - `AuthenticAdStudio.tsx` — untouched pending my decision
> - `OutreachComposer.tsx` — scheduled for the C4 re-skin, not this pass
> - Any hex inside comments
>
> List anything else that remains, with file:line, and don't fix it — I want to see it.
> Then `npx tsc --noEmit -p tsconfig.json` and report.

---

## B3 — Error and loading states

> Read `aspen-handoff/aspen-uiux-audit-and-remediation-plan.md`, headline numbers and
> finding H5. The audit counts **zero** `isError` branches across all app routes: every
> backend failure currently looks identical to an empty state.
>
> **Step 1, before writing anything.** Open `src/components/app/DataGate.tsx` and report
> what props it actually has. A previous pass added `emptyTitle` / `emptyHint` /
> `emptyAction`. I do not believe `error` / `errorTitle` / `errorHint` / `errorAction`
> exist yet. Tell me which of those are present before you continue.
>
> **Step 2.** If the error props are missing, add them to `DataGate` following the exact
> shape and naming of the existing empty-state slots — same prop-naming pattern, same
> default-preserving behaviour (a panel that passes no error props behaves exactly as it
> does today). Style the error state with the tokens migrated in B2, scoped the same way
> the empty state is via `.aspen-scope .datagate-empty-*` in `src/styles.css`.
>
> **Step 3.** Wire an `isError` branch into every `useQuery` across `src/routes/app.*`.
> Every one gets a retry action that refetches. Requirements:
> - No bare spinner on a blank page — use a skeleton that matches the shape of the content
>   it replaces.
> - Error copy names what failed and what to do, in plain language. No error codes or stack
>   traces in the UI.
> - `app.discovery.tsx:145-146` is audit finding H5 specifically: it currently swallows API
>   errors into an empty result set, so a quota failure is indistinguishable from zero
>   results. It needs a distinct message — "Search failed — YouTube returned an error" —
>   plus Retry.
>
> Skip these, already handled in an earlier pass: the `DataGate` empty states, the
> `app.tsx` auth guards and skeleton, the `app.index.tsx` revenue tile and panels, and the
> `CampaignDocuments` rollback.
>
> Presentation and error-handling only. Do not touch business logic, Supabase schema, RLS,
> or edge functions.
>
> Then `npx tsc --noEmit -p tsconfig.json`. Report: DataGate props added, count of query
> branches wired per file, typecheck result.

---

## B4 — Responsive

> Read finding C7 in `aspen-handoff/aspen-uiux-audit-and-remediation-plan.md`. The
> authenticated app has 4 breakpoint utilities in total across 25 routes and 9 components.
> It is desktop-only.
>
> Work mobile-first, in this order. Do the sidebar first and stop for my review before
> continuing — everything else depends on the shell being right.
>
> 1. **Sidebar.** `src/routes/app.tsx:260` is a fixed `w-[246px] shrink-0 sticky
>    h-[100vh]`. Below `lg:` it becomes a slide-over drawer opened by a hamburger in the
>    header. Closes on Escape, on backdrop click, and on route change. It needs
>    `role="dialog"` and `aria-modal`, and focus moves into it on open and returns to the
>    hamburger on close. At `lg:` and above, behaviour is exactly as it is today.
>
> 2. **Card grids.** Every `grid-cols-[repeat(auto-fill,...)]` and fixed multi-column grid
>    across the app routes gets a mobile-first ramp: one column by default,
>    `sm:grid-cols-2`, `lg:grid-cols-3`.
>
> 3. **Wide data.** `src/routes/app.affiliate.tsx:253-260` and the hotlist board go into
>    horizontal scroll containers with a visible edge fade so it's discoverable that there's
>    more to the right. Where a table is simple enough to stack into cards under `sm:`,
>    prefer stacking over scrolling.
>
> Then check every `/app` route at 375px wide and report any that still overflow
> horizontally. Layout only — no colour, copy, or logic changes.
>
> `npx tsc --noEmit -p tsconfig.json` at the end of each of the three steps.

---

## B5 — Accessibility and remaining findings

> Read sections 3 and 4 of `aspen-handoff/aspen-uiux-audit-and-remediation-plan.md` and
> work through them in the order listed there. Group the work as follows, and commit
> between groups.
>
> **Forms and labels.** Inputs across `app.settings.tsx:306-312`,
> `app.affiliate.tsx:160-170`, `app.ads.tsx:436-462` and `OutreachComposer.tsx:203-211` use
> caption `div`s instead of `<label htmlFor>`. Convert them. Add `type="url"` and an
> `https://` check to the affiliate destination field (`app.affiliate.tsx:219-224`), and
> real email validation to the invite field (`app.settings.tsx:238-253`).
>
> **Semantics and roles.** `aria-current="page"` on active nav items
> (`app.tsx:294-304` — the active state is colour-only today). `role="tab"` /
> `aria-selected` on the community tabs (`app.community.tsx:29-40`). `aria-pressed` on the
> hotlist stage buttons (`app.creators.$id.tsx:206-218`). Any interactive `div` that should
> be a `button` becomes one. Hotlist cards (`app.hotlist.tsx:280-337`) are draggable `div`s
> with no focusable role — give them `role="button"`, `tabIndex={0}`, and arrow-key stage
> movement, keeping the existing `→` fallback.
>
> **Modals.** `CampaignDrawer` (`app.campaigns.index.tsx:386-509`) and
> `CampaignIntelligence.tsx:24-35` have no `role="dialog"`, no `aria-modal`, no focus trap,
> no Escape handler. Build one shared dialog primitive and route all overlays through it,
> including the B4 sidebar drawer.
>
> **Focus and feedback.** Visible focus rings on every interactive element, using the
> existing accent token — never `outline: none` without a replacement. `aria-live="polite"`
> on the toast region.
>
> **DataGate default inversion** (audit section 3, theming fragility). `DataGate`'s default
> classes are dark and depend on the `.aspen-scope .datagate-panel` override in
> `src/styles.css`, so any panel rendered outside `.aspen-scope` silently reverts to dark.
> Invert it: Aspen tokens become the default, and the dark treatment becomes an explicit
> opt-in variant used by `/admin`. Check every `DataGate` usage after this change — it
> touches every panel in the app.
>
> **Copy leaks.** Remove engineering copy from the UI: "No offer field on campaigns yet"
> (`app.campaigns.$id.tsx:736`), admin's regex-derived integration labels
> (`admin.tsx:98-113`), and the missing `label` on admin's Activity `DataGate`
> (`admin.tsx:116-121`). Give "coming soon" buttons (`app.campaigns.$id.tsx:440-453`) a
> distinct dashed, subtle treatment so they don't look identical to working ones.
>
> Stop and report after each group rather than doing all five at once.
> `npx tsc --noEmit -p tsconfig.json` before each report.

---

## Not in these batches — decisions needed from you

These are audit findings that need a product call, not an implementation pass:

- **C6 / `AuthenticAdStudio.tsx`** — 666 lines, unrouted, and a rival to the ads engine
  you've been designing. Finish, or delete.
- **H1 + C6 / `AdsLibrary.tsx`** — needs a `/app/ads/library` route to become reachable.
  Per `CLAUDE.md` this one is blocked on a screen design.
- **C1, C2** — onboarding upload reporting and `criteria_status`. Both need small schema
  additions, which is outside the presentation-only rule these batches run under.
- **H7** — a real `archived` status, distinct from `completed`. Also schema.
- **H13** — re-skinning `admin`, `health` and `invite.$token` from dark to cream Aspen.
  B2-4 only tokenises them; converting them is a design decision about whether internal
  screens should look like the product.
- **`/health` has no auth guard at all.** Public or admin-only?
