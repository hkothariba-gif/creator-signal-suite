# Ads Center v3 — Approved Plan (2026-07-19)

User-approved rebuild of the ad-building experience. Decisions: build in order
below; brand-doc upload INCLUDED in first release; Lovable autonomous edits
PAUSED for the duration (all changes via git).

## Principles

- **Product-first language.** Ads are built for a product, on a campaign. Never
  "brand setup" or "workspace." Brand material is added enrichment, not a gate.
- **Campaign is the single source of truth.** The Ads Center reads the same
  `campaigns` row used by creator marketing (product_description,
  target_audience, belief doc, ad_corpus, affiliate data). Nothing re-entered.
- **Every flow ends in ads** ("Ads for [campaign]"), never a generic dashboard.
- Anti-flattening engine rules unchanged: grounded corpus + belief doc supply
  substance; style recipes shape delivery; three gates before an ad is clean.

## Build order

1. **V3-1 Campaign-first Ads Center.** Rework `app.ads.tsx`: landing = campaign
   picker (or "create campaign"); per-campaign workspace with three tabs:
   **Generate** (platform + 10 styles + variants), **Library**, **Inputs**
   (product summary, belief doc editor, corpus health, affiliate status, brand
   docs). Absorbs AuthenticAdStudio; Phase 1 signals studio demoted to an
   "Intelligence" section.
2. **V3-2 Campaign data bridge.** Pull campaign data into the workspace;
   inline new-campaign modal (reuse CampaignDrawer); campaign_id stamped on
   every generated ad (column exists).
3. **V3-3 Ads Library.** Grid of all ads for the campaign: AdPreviewFrame
   thumbnails, style + gate badges, provenance drawer, status flow
   draft → approved → archived, filters by platform/style/status.
4. **V3-4 Brand-doc ingestion.** Upload PDF/text per campaign (Supabase
   Storage bucket `brand-docs`), server-side extraction (LLM) into belief-doc
   suggestions + `ad_corpus` rows (new kind `brand_doc` — small migration).
5. **V3-5 Onboarding cleanup.** Lovable's 5-step wizard stripped to plain
   account setup, ending at "Create your first campaign →"; product-first copy
   pass across ads surfaces.

## Incidents to keep fixed

- `is_org_member` permission denied (Lovable security fix revoked EXECUTE on
  org helper fns): re-granted to `authenticated` 2026-07-19 via SQL editor.
  Add a committed migration with these grants so DB state is reproducible:
  `grant execute on function public.is_org_member(uuid)|can_edit_org|is_org_admin|org_role|shares_org_with to authenticated;`
- Watch for Lovable re-revoking or re-adding wizard steps while paused.
