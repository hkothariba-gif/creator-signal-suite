# B1 — Token map (hex → token)

Built from `src/styles.css` @theme on `main` and a hex sweep of `src/routes` + `src/components/app`.
254 hex literals found in those two trees (106 routes, 148 app components).

**No component edits in B1.** This file is the input to B2.

---

## 0. Read this first — three things that will bite

**a. Four Aspen token names do not exist in `@theme`.**
`accent`, `border`, `muted`, `sans` collide with the repo's shadcn theme, so they are
defined only inside `.aspen-scope`. Consequence: `text-accent` / `border-border` /
`text-muted` resolve **only** inside a `.aspen-scope` wrapper. Any file migrated to those
utilities must be inside one, or it silently falls back to shadcn's dark theme.
Before migrating a file, confirm it renders inside `.aspen-scope`. `admin.tsx`,
`health.tsx`, `invite.$token.tsx` currently do **not**.

**b. Two files hold ~80 of the 254 literals and are both slated for deletion.**
`AuthenticAdStudio.tsx` (~50, audit C6 — unrouted, 666 lines) and `AppShell.tsx`
(~30, audit C5 — rendered by no route). Do not migrate either. Resolve C5/C6 first.
That removes 31% of the problem by deletion rather than edits.

**c. Two YouTube reds are live.** `--color-youtube: #f03` (Aspen) and
`--color-yt-red: #ff0000` (legacy). `AdPreviewFrame` and the landing CSS use `#ff0000`.
Pick one — recommend keeping `--color-youtube` and aliasing `--color-yt-red` to it.

---

## 1. Already tokenised — direct swap, no @theme change

These hexes appear in components and already have an exact token. Pure find-and-replace.

| Hex | Token | Utility | Seen in |
| --- | --- | --- | --- |
| `#FAF7F1` | `--color-cream` | `bg-cream` `text-cream` | ads, creators.$id, hotlist, outreach |
| `#17141E` | *(scoped)* `--color-dark` | `text-dark` `bg-dark` | campaigns.*, creators.$id, hotlist, outreach, platforms, OutreachPanels, AffiliateHeatMap |
| `#8A8494` | `--color-subtle` | `text-subtle` | 20+ sites — the single most common literal |
| `#FFECD9` | `--color-tint` | `bg-tint` | ads, campaigns.$id, AffiliateHeatMap |
| `#B33A12` | `--color-accent-ink` | `text-accent-ink` | ads, campaigns.$id, AffiliateHeatMap |
| `#DDF3E6` | `--color-success-wash` | `bg-success-wash` | ads, campaigns.$id/index, platforms, CampaignDocuments |
| `#0E7A3D` | `--color-success-ink` | `text-success-ink` | same as above + campaigns.$id:553 |
| `#1FA463` | `--color-success` | `text-success` | outreach:53, app.tsx:432 |
| `#F5F1E9` | `--color-sand` | `bg-sand` | ads, campaigns.*, platforms, CampaignDocuments |
| `#E7EDFB` | `--color-info-wash` | `bg-info-wash` | campaigns.$id:64, campaigns.index:52 |
| `#3159A8` | `--color-info-ink` | `text-info-ink` | same |
| `#FFD84D` | `--color-highlight` | `bg-highlight` | campaigns.$id:667, OutreachPanels:423 |
| `#C0341A` | `--color-accent-deep` | `text-accent-deep` | outreach:55,280,292 |
| `#FFF6F2` | `--color-accent-wash` | `bg-accent-wash` | outreach:268 |
| `#FFD9CC` | `--color-accent-pale` | `border-accent-pale` | outreach:269 |
| `#C9C1B4` | `--color-sand-dark` | `bg-sand-dark` | app.tsx:432, AffiliateHeatMap:129 |
| `#3A3546` | `--color-dark-line` | `border-dark-line` | campaigns.$id:667, hotlist:229 |
| `#B8B2C2` | `--color-on-dark` | `text-on-dark` | hotlist:231 |
| `#FFF0EF` | `--color-tint-youtube` | `bg-tint-youtube` | platforms:31 |
| `#FFF2EC` | `--color-tint-reddit` | `bg-tint-reddit` | platforms:41 |
| `#EFF5FD` | `--color-tint-linkedin` | `bg-tint-linkedin` | platforms:61 |
| `#FF4500` | `--color-reddit` | `text-reddit` | campaigns.*, creators.$id, hotlist, outreach, platforms, CampaignIntelligence |
| `#0A66C2` `#0a66c2` | `--color-linkedin` | `text-linkedin` | same + AdPreviewFrame:46 |
| `#05080F` | `--color-bg-base` | `bg-bg-base` | admin, health, AppShell*, AuthenticAdStudio*, CampaignPicker |
| `#0C1222` | `--color-bg-surface` | `bg-bg-surface` | admin, health, AppShell*, CampaignIntelligence, DataGate |
| `#131D2E` | `--color-bg-elevated` | `bg-bg-elevated` | CampaignIntelligence:81 |
| `#00D97E` | `--color-brand-green` | `text-brand-green` | admin, health, AdsLibrary, AppShell*, AuthenticAdStudio*, CampaignIntelligence, CampaignPicker, AdPreviewFrame |
| `#8892A4` | `--color-brand-muted` | `text-brand-muted` | 40+ sites across the dark-theme files |
| `#7C3AED` | `--color-brand-violet` | `bg-brand-violet` | admin:66, AppShell*:31 |
| `#F59E0B` | `--color-brand-amber` | `text-brand-amber` | AdsLibrary:128, AppShell*:184 |

\* = file slated for deletion (C5/C6). Skip.

---

## 2. Near-duplicates — snap to the existing token, do NOT add a new one

Each of these is within a couple of steps of a token that already exists. They are almost
certainly hand-typed drift, not intent. Snapping them removes five would-be tokens.

| Hex found | Δ | Snap to | Token | Site |
| --- | --- | --- | --- | --- |
| `#F0EBE1` | +1/+1/+1 | `#F0EAE0` | `--color-border-soft` | campaigns.$id:793 |
| `#6E687A` | +1 on last | `#6E6879` | `--color-dark-muted` | campaigns.$id:778, OutreachPanels:499 |
| `#C4442A` | ~4 | `#C0341A` | `--color-accent-deep` | OutreachPanels:111 (hover) |
| `#34303F` | ~6 | `#3A3546` | `--color-dark-line` | OutreachPanels:284 |
| `#4B5563` | ~1 | `#4A5568` | `--color-brand-tertiary` | AppShell*:53 |
| `#FFE3DB` | ~1 | `#FFE4DA` | `--color-tint-deep` | CampaignDocuments:24 |
| `#00c472` | ~5 | `#00C26F` | `--color-brand-green-dark` | health:130 (hover) |

`#B03418` (CampaignDocuments:24 failed-state fg) is 6 steps from `--color-accent-ink`
`#B33A12`, but it is semantically a *failure* colour sitting next to a *tint* — see §3.

---

## 3. New tokens to add to the `@theme` block

Nine tokens. Everything else in the sweep maps to §1 or §2.

```css
/* Danger / failure — distinct from accent, which is a brand colour not an alarm */
--color-danger-wash: #ffe3db;
--color-danger-ink:  #b03418;

/* Warning mid-tone — the amber band in the affiliate heat map */
--color-warn-ink: #c98a2e;

/* Dark-theme text ramp (legacy shell + admin/health/invite until they migrate) */
--color-brand-ink:    #f0f4ff;  /* body text on dark — ~35 sites */
--color-brand-dim:    #5a6478;  /* tertiary text on dark — ~15 sites */
--color-brand-danger: #ff6b6b;  /* failed states on dark */

/* X/Twitter mark. --color-x-black (#000) is wrong: the app draws X at Aspen dark. */
--color-x: #17141e;

/* Ad-preview platform chrome — mimicking real platform UI, like the brand marks.
   Legitimately literal, but should be named so they are greppable. */
--color-chrome-yt-surface: #0f0f0f;
--color-chrome-yt-cta:     #3ea6ff;
```

Also change: alias `--color-yt-red` to `--color-youtube` (or delete it) so there is one
YouTube red. And keep `--color-danger-wash` / `--color-danger-ink` out of `.aspen-scope`
— they don't collide with shadcn, so they belong in `@theme` proper.

### Deliberately NOT tokenised

`AdPreviewFrame.tsx` `#1a1a1a` `#1f1f1f` `#0b1416` `#d93a00` `#FCC934` — these reproduce
YouTube's and Reddit's own ad chrome inside a preview frame. They are content, not theme.
Leave them literal with a one-line comment saying so, or move all of them into a single
`PLATFORM_CHROME` const at the top of that file. Recommend the const.

---

## 4. Migration order for B2 (revised — largest *useful* offender first)

Batches of 4 files. Order matters: the audit's C5/C6 deletions come first because they
delete ~80 literals outright.

| # | Files | Literals | Note |
| --- | --- | --- | --- |
| **B2-0** | *(no edits)* resolve C5 + C6 | −80 | Delete `AppShell.tsx`, `CampaignPicker.tsx`; decide `AuthenticAdStudio.tsx`. Not a token task — do it first anyway. |
| B2-1 | `app.campaigns.$id.tsx`, `app.outreach.tsx`, `app.campaigns.index.tsx`, `app.platforms.tsx` | ~52 | All already inside `.aspen-scope`. Safest, highest volume. |
| B2-2 | `AffiliateHeatMap.tsx`, `CampaignIntelligence.tsx`, `DataGate.tsx`, `OutreachPanels.tsx` | ~38 | `DataGate` also needs the audit's default-inversion — do that in B5, not here. |
| B2-3 | `app.creators.$id.tsx`, `app.hotlist.tsx`, `app.ads.tsx`, `CampaignDocuments.tsx` | ~21 | |
| B2-4 | `admin.tsx`, `health.tsx`, `AdsLibrary.tsx`, `AdPreviewFrame.tsx` | ~48 | **Not `.aspen-scope`d.** Use the `--color-brand-*` dark ramp from §3, not Aspen names. Re-skinning these to cream is audit H13 — a separate, later job. |
| B2-5 | `app.community.tsx`, `app.tsx` | ~3 | Sweep-up. |

Note for B2-1 and B2-3: many literals are in `style={{ }}` objects and lookup maps
(`STATUS_STYLE`, `STAGE_PILL`, `PLATFORMS`), not `className`. Those become
`var(--color-success-wash)` in the style object, or better, the map values become
Tailwind class strings and the consumer switches to `className`. Prefer the `var()` form
for B2 — converting maps to classNames is a restructure, and B2 is mechanical only.
