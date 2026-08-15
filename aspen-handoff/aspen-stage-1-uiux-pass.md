# Aspen — Stage 1 UI/UX pass

Date: 13 August 2026
Scope: navigation and follow-through fixes from the "next stage" plan, section 2.

---

## 1. What was wrong

The app rendered everywhere, but several screens asked the user for something
and then left them without a next step:

- Empty panels showed a flat "No data to display" card with nothing to click.
- Uploaded documents were stored but never listed, so nobody could tell whether
  text extraction had worked.
- Discovery offered four platforms while only YouTube actually searched.
- Root page metadata still said "Lovable App".

## 2. What changed

### Actionable empty states

`DataGate` — the component every data panel renders through — now takes three
extra slots:

| Prop | Purpose |
| --- | --- |
| `emptyTitle` | Headline instead of the flat "No data to display" |
| `emptyHint` | One line describing what lives in the panel once it has data |
| `emptyAction` | The next step — a button or link |

The old bare copy stays the default, so panels with nothing useful to offer are
unchanged. Styling for the new title and hint is scoped in
`.aspen-scope .datagate-empty-*` so cream pages get cream treatment while
`/admin` keeps the dark utilities.

Wired up on:

- **Campaigns** — "Create your first campaign", opening the campaign drawer.
- **Hotlist** — points at Discovery to find creators for the campaign.
- **Discovery** — explains what a search returns before one has been run.
- **Affiliate** — points at connecting a platform.

### Discovery platform gating

The four-platform selector stays, but X, Reddit and LinkedIn now carry an
explicit "not connected" chip with a link to the Platforms hub, instead of
letting a user run a search that silently returns nothing.

### Documents panel

New `CampaignDocuments` component, mounted on the campaign detail page:

- filename, upload date, file size
- extraction status: Queued / Mined / Failed, with the excerpt count on mined
  docs and the error text on failed ones
- "+ Add file" (PDF, txt, md, 10MB cap) uploading to the `brand-docs` bucket
  and immediately running extraction
- "Re-extract" / "Retry" and "Delete" per row
- the audience lookalike sheet from onboarding is named in the same list, marked
  "Stored" — previously it was invisible after upload

A read-only roll-up of the same list now sits in Settings, so a workspace can
see everything it has handed over in one place.

Supporting server functions: `listBrandDocs`, `processBrandDoc`,
`deleteBrandDoc` in `src/lib/brand-docs.functions.ts`.

### Metadata

Root route title and description replaced with real Aspen copy.

## 3. Files touched

```text
src/components/app/DataGate.tsx          empty-state slots
src/components/app/CampaignDocuments.tsx new
src/lib/brand-docs.functions.ts          list / process / delete
src/routes/app.campaigns.index.tsx       empty state
src/routes/app.campaigns.$id.tsx         documents panel
src/routes/app.hotlist.tsx               empty state
src/routes/app.discovery.tsx             empty state + platform gating
src/routes/app.affiliate.tsx             empty state
src/routes/app.settings.tsx              read-only documents card
src/routes/__root.tsx                    metadata
src/styles.css                           .aspen-scope empty-state styling
```

## 4. Still open from section 2 of the plan

- Post-login routing: signed-in users still land on `/onboarding` rather than
  `/app` when onboarding is already complete.
- "+ New campaign" outside onboarding: a standalone create flow reusing the
  onboarding step content.
- Sidebar still shows "No organization yet" for accounts created before org
  creation moved into onboarding.
- Empty states on Ads Center and Expansion.

Next stages unchanged: AI control panel (tool layer, then panel, then plan
approval), then Slack read-only Q&A and digests.
