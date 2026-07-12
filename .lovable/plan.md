## Goal

Turn the onboarding flow into the user's first real campaign so that when they land on the dashboard after signing up, the product they described (plus buyer + platforms + optional lookalike audience sheet) already appears in **Campaigns**.

## 1. Merge platforms into "Describe your ideal buyer" (Step 2), delete Step 3

In `src/routes/onboarding.tsx`:

- Add the four platform toggles (YouTube, Reddit, X, LinkedIn) below the age/gender/income selects on Step 2, reusing the existing `PlatformCard` styling.
- Add an **Audience lookalike sheet** upload control below the platforms (single file, accept `.csv,.xlsx,.xls,.tsv`, ~10 MB cap). Store the picked `File` in a new `lookalikeFile` state; render filename + remove button.
- Delete the current Step 3 (platforms-only page). Renumber: total steps go from 6 → 5. Update the progress bar (`step / 5`), "Step X of 5" header, and the `next()` cap.
- Keep all existing Step 2 state (`age`, `gender`, `income`, `notes`) and the `platforms` object.

## 2. Auto-create the first campaign on `finish()`

Still in `src/routes/onboarding.tsx`, extend `finish()` so after the existing `update({...})` call succeeds (or soft-succeeds for testers):

1. If `lookalikeFile` is set AND we have a real Supabase user, upload it to the new `audience-sheets` bucket at `{user.id}/{campaignId}/{filename}` and capture the storage path.
2. Insert a row into `public.campaigns` (only when `user` is signed in — tester bypass path skips the insert, same as today's soft-success):
   - `user_id`: `user.id`
   - `name`: derived from the product description (first ~60 chars, fallback `"My first campaign"`)
   - `status`: `"draft"`
   - `product_description`: the Step 1 `category` text
   - `platforms`: array built from the Step 2 platform toggles (`["YouTube","Reddit",...]`)
   - `goal`: `"Brand Awareness"` (default)
   - `target_audience` (jsonb): `{ age, gender, income, notes, platforms: [...], lookalike_sheet_path: <storage path or null>, lookalike_sheet_name: <original filename or null> }`
3. Fire the existing `generate-search-criteria` edge function against the new row (same pattern as `CampaignDrawer.create()` in `app.campaigns.index.tsx`) so search criteria are pre-populated. Non-blocking — swallow errors, still navigate.
4. Navigate to `/app/campaigns` (instead of `/app`) so the user immediately sees their seeded campaign. Show a toast: `"We saved your first campaign as a draft."`

Login routing stays as-is (unonboarded → `/onboarding`, onboarded → `/app`), per the answered question.

## 3. Storage bucket for lookalike sheets

Create a private bucket `audience-sheets` via `supabase--storage_create_bucket`. Then a migration adds RLS on `storage.objects` so a user can `INSERT`/`SELECT`/`DELETE` only under their own `{auth.uid()}/…` prefix in that bucket.

## 4. Campaigns list already handles this

`src/routes/app.campaigns.index.tsx` reads `campaigns` for the current `user_id` and renders name, platforms, goal, and `product_description` — no change needed. The seeded campaign will show under the **Draft** tab.

## Technical notes

- Platform label ↔ flag mapping: `youtube → "YouTube"`, `reddit → "Reddit"`, `x → "X"`, `linkedin → "LinkedIn"` (matches the strings `campaigns.platforms` uses today in `CampaignDrawer`).
- Tester bypass (no Supabase session): still writes localStorage `aspen_onboarded`, still routes to `/app/campaigns`, but skips the storage upload + `campaigns` insert (RLS would reject them anyway). We can revisit persisting tester data later.
- No new columns; reuse `campaigns.target_audience` (jsonb) as the "audience spec for this campaign" container the request calls for.
- Files: edits to `src/routes/onboarding.tsx` only, plus one migration for the storage RLS policies.
