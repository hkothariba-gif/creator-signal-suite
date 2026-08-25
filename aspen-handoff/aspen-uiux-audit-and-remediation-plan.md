# AspenReach — Full UI/UX Audit & Remediation Plan

Date: 13 August 2026
Scope: every route in `src/routes/` plus every component in `src/components/app/`, read line by line. Findings carry `file:line` references so each item can be handed to an implementation agent as a standalone task.

---

## 0. Headline numbers

| Measure | Value | Meaning |
| --- | --- | --- |
| Responsive breakpoint utilities (`sm:`/`md:`/`lg:`) across all 25 `/app` routes + 9 app components | **4 total** (3 files) | The authenticated app is desktop-only. Sidebar is a fixed 246px with no drawer. |
| `isError` branches in app routes | **0** | No screen distinguishes "query failed" from "no data". Every backend failure looks like an empty state. |
| `toast.*` calls | 97 | Feedback exists, but it is transient-only; nothing persists a failure the user can act on later. |
| Hardcoded hex colour literals in `src/routes` + `src/components` | **425** | Design tokens exist in `src/styles.css` `@theme` but are bypassed constantly. |
| Fully-built components rendered by no route | **2** (`AuthenticAdStudio.tsx` 666 lines, `AdsLibrary.tsx` 177 lines) | Shipped weight, zero user reach. |
| Screens still on the pre-Aspen dark theme | **4** (`admin`, `health`, `invite.$token`, `OutreachComposer`) | Two design systems live side by side. |

---

## 1. Critical — fix first

### C1. Onboarding uploads fail silently
`src/routes/onboarding.tsx:114-116` (audience lookalike sheet) and `:139-141` (brand docs) catch upload errors and only `console.error`. `finish()` still shows the success toast and redirects (`:196-198`). A user can attach three PDFs, have all three fail, and be told everything worked.
**Fix:** collect per-file results, render a list under the upload control with per-file state (uploaded / failed + retry). Block the success toast when any file failed; show "2 of 3 files uploaded — retry the rest or continue".

### C2. Onboarding never reports missing search criteria
`onboarding.tsx:165-167` swallows a `generate-search-criteria` failure. The campaign is created with empty `search_criteria`, and Discovery later shows a generic empty state with no explanation.
**Fix:** persist a `criteria_status` on the campaign (`pending` / `ready` / `failed`) and surface it on the campaign detail page with a "Regenerate search criteria" button.

### C3. `/app` has no `onboarded` guard
`src/routes/app.tsx:202` only redirects unauthenticated users. A signed-in, non-onboarded user reaching `/app/*` directly — or arriving via `invite.$token.tsx:33`, which always sends to `/app` — lands in a shell where org-scoped screens fail in different ways per screen (`app.ads.tsx:224-241` has a good `/onboarding` CTA; `app.outreach.tsx`, `app.community.tsx`, `app.expansion.tsx`, `app.platforms.tsx` show generic empties).
**Fix:** one guard in the `/app` layout: `!loading && user && !user.onboarded → /onboarding`. Also add the same check to `invite.$token.tsx` redirect and an inverse guard on `/onboarding` so completed users don't re-enter.

### C4. `OutreachComposer` is dark-theme inside cream surfaces
`src/components/app/OutreachComposer.tsx:164-311` is entirely legacy hex (`bg-[#05080F]`, `border-white/10`, `text-[#00D97E]`). It renders inside the Aspen cream card at `app.outreach.tsx:223-233` and inside a cream modal at `app.creators.$id.tsx:247-275`. This is the most visible visual break in the product.
**Fix:** re-skin to tokens — `bg-surface`, `border-border` at 1.5px, `text-muted`/`text-subtle`, `bg-accent text-cream` for the send button, radii 8–22px.

### C5. Two competing shells; one is dead
`src/components/app/AppShell.tsx` (240px dark sidebar, notifications dropdown `:97-114`, Upgrade modal `:127-162`) is rendered by no `/app` route — `app.tsx:260+` builds its own Aspen sidebar. `src/components/app/CampaignPicker.tsx` is likewise superseded by `useAspenCampaign()`.
**Fix:** delete both files (and the Upgrade modal / notification bell stubs with them), or if either is wanted, port to tokens and route it. Do not leave both.

### C6. Two fully-built, unreachable features
`AuthenticAdStudio.tsx` (666 lines: belief docs, corpus collection, brand-doc upload, grounded generation) has zero imports anywhere. `AdsLibrary.tsx` (draft → approved → archived flow with provenance drawer) is referenced only in a comment at `app.ads.tsx:22-28`.
**Fix:** decide per component — wire `AdsLibrary` to a `/app/ads/library` route (re-skinned to tokens) because it closes gap H1 below; either finish or delete `AuthenticAdStudio`, since keeping two rival ad generators is a maintenance trap.

### C7. Mobile is unsupported
`app.tsx:260` fixed `w-[246px] shrink-0 sticky h-[100vh]`; `AppShell.tsx:51` fixed 240px. Zero breakpoint utilities in any app route. Below ~900px the sidebar consumes a third of the viewport and tables/grids overflow.
**Fix:** sidebar becomes a slide-over under `lg:`, triggered by a header hamburger; card grids get `sm:grid-cols-2 lg:grid-cols-3`; the wide data grids (`app.affiliate.tsx:253-260`, hotlist board) get horizontal scroll containers with a visible edge fade.

---

## 2. High — dead ends and honesty gaps

| ID | Finding | Location | Fix |
| --- | --- | --- | --- |
| H1 | Saved ads are unviewable. `saveDraft` writes to `ads` (`:191-214`) but no list exists after the Library tab was removed. | `app.ads.tsx:191-214` | Route `AdsLibrary` (see C6) and add "View saved ads" next to Save. |
| H2 | Home panels render literal `<></>` inside a connected `DataGate` — "Pending outreach" and "Recent campaign activity" can never show anything. | `app.index.tsx:143-163`, `:188-195` | Wire to `listThreads` / recent campaign events, or replace with a labelled "coming in the outreach phase" state. Do not ship an empty live-looking card. |
| H3 | Revenue tile hardcodes an em dash even on the `salesReady` branch. | `app.index.tsx:239-244` | Render the real figure when ready. |
| H4 | Discovery searches YouTube only, while the nav subtitle promises "YouTube, Reddit, X and LinkedIn in one query". | `app.tsx:54` vs `app.discovery.tsx:40-66,138-150` | Change the subtitle to "YouTube search — more platforms as they connect". Keep the not-connected chips (`:232-239`). |
| H5 | Discovery swallows API errors into an empty result set — quota failure looks identical to zero results. | `app.discovery.tsx:145-146` | Distinct error state: "Search failed — YouTube API returned an error" + Retry. |
| H6 | "Edit brief" navigates back to the campaigns list; there is no way to edit product/audience/avoid from detail. | `app.campaigns.$id.tsx:723-729` | Build an inline edit form on the detail page reusing the drawer fields. |
| H7 | "Complete" and "Archive this campaign" both set `status: "completed"`; no delete exists anywhere. | `app.campaigns.$id.tsx:746-752`, `app.campaigns.index.tsx:99-107` | Add a real `archived` status (hidden from tabs) and a delete with typed confirmation. |
| H8 | Destructive actions with no confirmation: remove team member, revoke invite, role change, delete document, archive campaign, archive running sequence. | `app.settings.tsx:255-283,384-389`; `CampaignDocuments.tsx:207-213`; `app.campaigns.$id.tsx:746-752`; `OutreachPanels.tsx:263-272` | One shared `<ConfirmDialog>` — name the object, name the consequence, destructive button on the right. |
| H9 | Orphaned storage on partial upload: file lands in storage, DB insert fails, no cleanup. | `CampaignDocuments.tsx:66-109` (`:94-97`) | Delete the storage object in the insert `catch`, then report the failure. |
| H10 | Hotlist cards are `draggable` `div`s with no focusable role; only the small stage links inside are reachable. | `app.hotlist.tsx:280-337` | `role="button"` + `tabIndex={0}` + arrow-key stage movement on the card; keep the `→` fallback. |
| H11 | Auth-resolution blank screens: `null` returned while loading. | `app.tsx:232`, `admin.tsx:57` | Skeleton shell (sidebar + header + shimmer cards). |
| H12 | No client-side validation on login/signup; blank submits round-trip to Supabase for a generic error. No forgot-password path, no resend-confirmation on the `done` state. | `login.tsx:34`, `signup.tsx:18-19,49` | Inline field validation, `aria-describedby` errors, add reset-password and resend links. |
| H13 | `admin.tsx`, `health.tsx`, `invite.$token.tsx` are all still pre-Aspen dark hex. | `admin.tsx:60-125`, `health.tsx:42-138`, `invite.$token.tsx:38-72` | Migrate to tokens. `/health` also has no auth guard at all — decide public vs admin-only. |

---

## 3. Medium — friction, consistency, semantics

**Navigation & state**
- Campaign switcher is a blind `⇄` cycle button with no list — unusable past ~3 campaigns (`app.tsx:276-284`). Replace with a dropdown listing campaigns + "New campaign".
- Nav count badges exist only for Campaigns and Hotlist (`app.tsx:82-85,310`) — either wire all or show none.
- Onboarding banner dismissal is component state; it returns on every reload (`app.index.tsx:109-115`). Persist to the profile.
- Discovery run history is `useState` only — leaving the page loses it (`app.campaigns.$id.tsx:185-213`). Persist runs and show "Last run 2h ago · 14 creators".
- Community's four tabs all render the same `DataGate`; switching tabs visibly does nothing (`app.community.tsx:17,43-50`). Collapse to one panel until per-tab data exists.
- Expansion repeats near-identical "waiting for connection" copy three times (`app.expansion.tsx:28-35,44-51`). One page-level banner + quiet panels.
- Platforms page shows "Not configured" with no remediation path (`app.platforms.tsx:158`). Add a "How to connect" link per row.
- Creator profile's "Not scored yet" nudge has no link to the Hotlist action (`app.creators.$id.tsx:182-184`).
- `OutreachComposer` keeps a stale `subject` when switching Email → X (`:184-188`).
- `search={{ new: true }}` magic string repeated in 5 places (`app.tsx:375`, `app.campaigns.index.tsx:58,96`, `app.campaigns.$id.tsx:218,725`). Extract a constant.

**Modals & focus**
- `CampaignDrawer` (`app.campaigns.index.tsx:386-509`) and the Upgrade modal (`AppShell.tsx:127-162`) have no `role="dialog"`, no `aria-modal`, no focus trap, no Escape handler. Standardise on one dialog primitive for all overlays including `CampaignIntelligence.tsx:24-35`.

**Forms & validation**
- Budget rejection rules are only revealed after a failed submit (`app.campaigns.index.tsx:295-302`) — add hint text.
- Affiliate destination URL has no `type="url"` or `https://` check (`app.affiliate.tsx:219-224`).
- Invite email is only `.trim()`-checked before hitting the edge function (`app.settings.tsx:238-253`).
- Document `accept=".pdf,.txt,.md"` is a UI hint only; no extension/mime re-check before upload (`CampaignDocuments.tsx:156`).
- `lastInviteLink` fallback has no copy button (`app.settings.tsx:342-351`).

**Theming fragility**
- `DataGate`'s default classes are dark and depend on the `.aspen-scope .datagate-panel` override in `src/styles.css` (`DataGate.tsx:93-98`). Any panel rendered outside `.aspen-scope` silently reverts to dark with no warning. Invert the default to Aspen tokens and opt into the dark variant.
- Hardcoded hex maps that should be tokens: `app.tsx:301-308`, `app.campaigns.index.tsx:36-53`, `app.campaigns.$id.tsx:52-70,667,855-863`, `app.hotlist.tsx:220-237`. Platform brand colours (`#F03`, `#FF4500`, `#0A66C2`) are legitimately literal — keep those, tokenised as `--color-youtube` etc.
- Also confirm `DEV_LOGIN_ENABLED` cannot be true in a production build (`login.tsx:49-53`).

---

## 4. Low — polish

- No `aria-current="page"` on active nav items (`app.tsx:294-304`); active state is colour-only.
- Community tabs lack `role="tab"`/`aria-selected` (`app.community.tsx:29-40`); hotlist stage buttons lack `aria-pressed` (`app.creators.$id.tsx:206-218`).
- Inputs across Settings, Affiliate, Ads, and OutreachComposer use caption `div`s instead of `<label htmlFor>` — a repeated screen-reader gap (`app.settings.tsx:306-312`, `app.affiliate.tsx:160-170`, `app.ads.tsx:436-462`, `OutreachComposer.tsx:203-211`).
- Tabular data rendered as `div` grids rather than `<table>` (`app.affiliate.tsx:253-260`, `admin.tsx:98-113`).
- Heat-map data points expose detail via `<title>` only — not keyboard reachable (`AffiliateHeatMap.tsx:119-124`).
- Discovery's fit-score explanation is a native `title` tooltip — invisible on touch (`app.discovery.tsx:297-304`). Use an info icon + popover.
- Hotlist drag-drop gives no success confirmation (`:147-155`); "Score creators" disabled reason lives in separate text above the button (`:195-207`).
- Engineering copy leaking to users: "No offer field on campaigns yet" (`app.campaigns.$id.tsx:736`); admin's regex-derived integration labels ("ads Middleware") vs Platforms' curated labels (`admin.tsx:98-113` vs `app.platforms.tsx:70-92`); admin Activity `DataGate` passes no `label` (`admin.tsx:116-121`).
- "Coming soon" buttons look identical to working ones (`app.campaigns.$id.tsx:440-453`). Give placeholders a distinct dashed/subtle treatment.
- Platforms uses literal glyphs (`▶`, `r/`, `X`, `in`) while the rest of the app uses lucide icons (`app.platforms.tsx`).
- `AppShell.tsx:84` doesn't await `logout()` before navigating — a race the newer shell already fixed (`app.tsx:337`). Moot if C5 deletes the file.
- `logout()` in `app.tsx:335-344` has no try/catch — a network failure leaves the user in place with no message.
- Empty-state treatment differs between siblings: Discovery has an illustrated empty state (`:339-353`), Hotlist without a campaign shows a bare column (`:208`).

---

## 5. What is genuinely good (do not "fix" these)

- `DataGate`'s three-state contract (waiting-for-connection / empty-with-next-step / data) is the strongest pattern in the codebase and is applied consistently across Campaigns, Discovery, Hotlist, Ads, Community, Expansion.
- Honest placeholder copy instead of fake numbers: Affiliate's payouts tile (`app.affiliate.tsx:203-211`), Billing (`app.settings.tsx:432-447`), the LinkedIn "assisted" explanation (`OutreachComposer.tsx:228-231`).
- Optimistic update + rollback + error toast on hotlist stage moves (`app.hotlist.tsx:147-155`) and creator profile (`app.creators.$id.tsx:72-83`).
- `OutreachPanels.tsx` is the cleanest component in the app for token usage and state coverage.
- Onboarding's data wiring (profile, campaign, two storage buckets, doc processing, criteria generation) is the most complete flow in the product — it only lacks result reporting.
- `invite.$token.tsx:16-20` guards against double-invoking `accept-invite`.

---

## 6. Suggested implementation order

1. **Truthfulness pass** (C1, C2, H2, H3, H5, and the "coming soon" styling). Nothing else matters while the UI reports success it can't back up.
2. **Routing integrity** (C3, invite redirect, onboarding re-entry guard, H11 skeletons).
3. **Design-system unification** (C4, C5, H13, the `DataGate` default inversion, hex → tokens). One PR per file group; purely presentational.
4. **Safety rails** (H8 shared confirm dialog, H9 storage rollback, modal focus traps, form validation).
5. **Close the dead ends** (H1 + C6 ads library, H6 edit brief, H7 archive/delete semantics, campaign switcher dropdown).
6. **Mobile** (C7) as a single dedicated pass once the shell is stable.
7. **Accessibility sweep** (labels, roles, `aria-current`, keyboard drag alternatives, table semantics).

Each numbered group is independently shippable and touches presentation only, except groups 1, 2, and 5, which need small server-function or schema additions (`criteria_status`, `archived` status, upload result reporting).
