# Ads Engine — build spec (evidence ladder + tests + performance)

Written 2026-08-09. Reads against `ad-playbooks.ts`, `ad-generation.server.ts`,
`ads.functions.ts` on `main` (30b32fab). Companion design: `Aspen Ads Engine.dc.html`.
Architecture rationale: `Aspen Ads Engine - Evidence Ladder.dc.html`.

Reconciled 2026-08-24 with `MASTER-BUILD-PLAN.md` and `DECISIONS-AND-BLOCKERS.md`, which
control product scope where this older implementation spec conflicts. The two companion HTML
exports are not currently in the repository; this document must remain implementable without
them unless they are restored. The cited commit is a historical baseline, so re-audit current
code before implementation.

Reconciled again 2026-08-31 with `STAGE-C-WAVE-1-CONTRACTS.md`. The T1–T5 evidence
permissions, floor, format/craft rules, structured refusal, provenance and paused-push rule
remain controlling Ads Engine behavior. Illustrative SQL and runtime flow must adopt Stage
C's organisation/RLS/action contracts and its structured strategy → angle/hook matrix →
validation → quality-ranking stages; do not implement this file in isolation.

## Decisions locked

| Question | Answer |
|---|---|
| When does competitor research run | On demand, cached per campaign, 14-day TTL |
| Who names competitors | Inferred from product description, user corrects in the brief |
| Is the tier visible | No tier labels. The workspace names the **profile** only, plus one concrete "what would strengthen this" line |
| Ad format model | In scope. Ships in the first pass |

Added scope from the same round: tone picker, A/B/C variants, saved tests that run
later or simultaneously, per-variant tracking links, performance dashboard.

## Ship order — one branch, four PRs

Each PR is independently useful and independently revertible. Merge in order.

1. **PR-A · ladder, craft, formats** — the generation core. No new tables except one column.
2. **PR-B · tests, links, dashboard** — the surface the marketer actually lives in.
3. **PR-C · Tier 4 research** — external-dependency work, deferred until access is confirmed.
4. **PR-D · assets and platform bridges** — shared assets plus approval-gated adapters.

## PR-A — ladder, craft, formats

### New `src/lib/evidence-ladder.ts`

Pure functions, no I/O, so it is trivially testable.

```ts
export type Tier = 1 | 2 | 3 | 4 | 5;
export type Profile = "proven" | "declared" | "researched" | "blocked";
export type Grant = "yes" | "no" | "with_proof" | "paraphrase" | "primary" | "framing" | "contrast" | "only";

export type EvidenceBundle = {
  tiers: {
    t1: { conversionPhrases: string[]; pastAdWinners: AdResult[] };
    t2: { beliefs: string; proofPoints: string[]; neverSay: string[]; productDescription: string; docExcerpts: string[] };
    t3: { quotes: { text: string; source: string; url?: string }[] };
    t4: { positioning: string[]; cliches: string[]; formatNorms: string[]; competitors: string[] } | null;
    t5: { craft: PlatformCraft; benchmarks: Benchmarks };
  };
  populated: Tier[];
  profile: Profile;
  unblockAsk: string | null;   // the single next upload, in plain words
};

export const PERMISSIONS: Record<Tier, { claims: Grant; language: Grant; positioning: Grant; expectations: Grant }> = {
  1: { claims: "yes",        language: "yes",        positioning: "yes",      expectations: "yes"  },
  2: { claims: "with_proof", language: "paraphrase", positioning: "yes",      expectations: "no"   },
  3: { claims: "no",         language: "primary",    positioning: "framing",  expectations: "no"   },
  4: { claims: "no",         language: "no",         positioning: "contrast", expectations: "contrast" },
  5: { claims: "no",         language: "no",         positioning: "no",       expectations: "only" },
};

export function resolveProfile(populated: Tier[]): Profile;
export function floorCheck(b: EvidenceBundle): { ok: boolean; reason?: string; ask?: string };
export function permissionPrompt(b: EvidenceBundle): string;   // the matrix, rendered for the model
export function lockedStyles(b: EvidenceBundle): { style: string; reason: string }[];
```

Floor: **T2 present AND at least one of T1/T3/T4 populated.** Otherwise refuse with
`ask`, never a bare string. `Receipts` and `Straight offer` unlock at T1 only;
when locked they return a stated reason instead of silently failing the gate.

### New `src/lib/ad-formats.ts`

The engine currently emits headline + body + CTA and one square image on every
platform. This is the missing model.

```ts
export type AdFormat = {
  id: string; platform: AdPlatform; label: string;
  media: "image" | "video" | "carousel" | "document" | "none";
  aspects: string[];
  limits: { intro?: number; headline?: number; body?: number; subject?: number };
  cards?: [number, number];
  note: string;
};
```

Seed data, from the four uploaded guides:

- **LinkedIn** — `single_image` (1.91:1 / 1:1 / 4:5, intro 150, headline 70) ·
  `carousel` (2–10 cards at 1080×1080, intro 255, headline 45) ·
  `video` (MP4 ≤500 MB, 15–30 s sweet spot, captions for silent autoplay) ·
  `document` (PDF, under 10 pages) · `thought_leader` (promotes a named person's post) ·
  `sponsored_message` (subject 60, body 1500).
- **X** — `promoted_post` (copy 50–100 chars) · `vertical_video` (9:16, cap 15 s,
  brand and motion inside 3 s) · `amplify_preroll` · `timeline_takeover`.
- **Reddit** — `image_freeform` · `video` (utility in first 3 s) · `carousel`
  (one distinct benefit per card) · `conversation` (open question, comments on).
- **YouTube** — `skippable_instream` (ABCD, hook before the 5 s skip) ·
  `shorts` (9:16, ≤60 s) · `bumper` (6 s) · `in_feed`.

Format choice drives the character limits already checked programmatically, the
image aspect requested from the generator, and which fields the copy object carries.
X formats remain export-only creative support; Aspen does not manage or push X campaigns.

### Changed `src/lib/ad-playbooks.ts`

Add a `craft` block per platform, compiled once from the four guides. This is the
whole of Tier 5's craft job — never load the guides at runtime.

- **LinkedIn** — a named human outperforms the company page; original data beats a
  third-party report; structured comparison against the legacy alternative; customer
  logo bar in the bottom third; intro front-loads value before the "see more" fold.
- **X** — 50–100 characters; peer register, not institutional; brand and motion inside
  3 seconds on video; bid first actions (replies, reposts) so social proof compounds
  on the unit; vertical, sound-on.
- **Reddit** — must read as a post, not an ad; name the subreddit in the first line;
  lo-fi photo or a real UI screenshot over studio polish; a contradiction hook earns
  the click; comments on, with a pinned brand reply answering "who is this for" and
  "what's the proof".
- **YouTube** — existing ABCD block stands.

**Sub-tier the evidence** so a blog roundup cannot outrank a large-N study inside the
same gate. `5a` = IPA, Ehrenberg-Bass, Kantar/ABCD, Binet & Field, platform financial
filings. `5b` = vendor guides and example roundups. Rule: 5b may set formats, limits
and tactics; 5b may never contradict a 5a principle.

Benchmarks per platform, for the performance screen to judge against:
LinkedIn CTR 0.4–0.6%, CPC $5–9, lead-form CVR 10–15% ·
Reddit B2B SaaS CTR 0.2–0.5%, CPC $0.60–2.50, CPM $3–12, CVR 1–4%, CPA $50–150+ ·
X CPC $0.18–0.38, CPM ~$2.09, CPE ~$0.13.

### Changed `src/lib/ad-generation.server.ts`

`generateAuthenticCopy` takes `{ bundle, format, tone, variantCount }` and returns
`variantCount` variants **in one model call**, each with `provenance: { tier, source, quoted }[]`.
Prompt assembly order: permission matrix → populated tiers, highest first → craft block
for the one selected platform → format limits → tone recipe. Skip absent tiers entirely
rather than sending empty headers.

Gates unchanged in spirit, stricter in mechanics: the swap test, groundedness, and
platform fit now check **against the matrix** — a claim whose only citation is T3, T4
or T5 fails automatically instead of being judged on vibes.

### Changed `src/lib/ads.functions.ts`

`generateAdCopy` resolves the bundle first, runs `floorCheck`, and returns a
structured refusal (`{ blocked: true, ask }`) rather than throwing.

### Migration

`alter table campaigns add column competitors jsonb not null default '[]'::jsonb;`

## PR-B — tests, links, dashboard

### Migration

```sql
create table ad_tests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null, campaign_id uuid not null,
  name text not null, platform text not null, format text not null, tone text,
  status text not null check (status in ('draft','scheduled','running','finished','archived')),
  primary_metric text not null default 'clicks',
  budget_minor bigint, currency text, starts_at timestamptz, ends_at timestamptz,
  run_with uuid references ad_tests(id),
  stop_rule jsonb, winner_variant_id uuid, created_at timestamptz default now()
);
create table ad_variants (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references ad_tests(id) on delete cascade,
  letter text not null, weight integer not null default 50,
  headline text, body text, cta text, image_path text,
  style text, format text, provenance jsonb, created_at timestamptz default now()
);
create table ad_links (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references ad_variants(id) on delete cascade,
  slug text unique not null, destination_url text not null,
  clicks integer not null default 0, created_at timestamptz default now()
);
```

Org-scoped RLS on all three, following the Wave 1 ownership matrix rather than copying the
legacy user-scoped `ad_corpus` policies.

### New `src/lib/ad-tests.functions.ts`

`saveTest` · `launchTest` · `pauseTest` · `listTests` · `testPerformance` ·
`mintTrackingLinks` (one slug per variant; reuse the affiliate redirect handler —
do not write a second one).

**Simultaneous runs**: `run_with` points at another test. Launching either launches
both and holds their `starts_at` equal. **Save for later** is `status='draft'` with
`starts_at` set; a scheduled job flips it to `running`.

### Screens

New Brief and Variants route components replace the deleted `AuthenticAdStudio.tsx`.
`AdsLibrary.tsx` — currently unrouted — becomes the Tests library.
New: Test setup, Performance. Routes `app.ads.index`, `app.ads.variants`,
`app.ads.tests`, `app.ads.$testId.performance`.

### Known blocker, carried

Spend, CPA and ROAS tiles need the numeric spend column from
`SPEC-spend-and-attribution.md`. Ship the dashboard without them rather than
inventing numbers; the tiles are designed but marked pending in the design file.

## PR-C — Tier 4 research

### Migration

```sql
create table competitor_research (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null, campaign_id uuid not null, platform text not null,
  competitors jsonb not null, findings jsonb not null,
  fetched_at timestamptz default now(), expires_at timestamptz not null
);
```

### New `src/lib/competitor-research.server.ts`

`inferCompetitors(productDescription)` → up to 5 names, written straight to
`campaigns.competitors` and shown as editable chips in the brief. The user's edit wins
and is never re-inferred over.

`researchCompetitors({ campaignId, platform })` runs on demand when Tier 4 is requested
and the cache is cold or expired. 14-day TTL. Findings are stored **summarised to roughly
400 tokens** — positioning lines, category clichés, format norms — never raw scraped pages.

Access per platform, confirm before committing engineering time:
LinkedIn has a searchable public ad library, the strongest source.
Google's ads transparency surface covers YouTube advertiser video.
X's transparency listing has moved repeatedly — treat as unverified until checked.
Reddit has no ad library; substitute how the competitor is discussed in relevant
subreddits, which `collect-signals` already fetches.

Where a library is unavailable, the competitor's own landing pages plus community
reaction threads give positioning without giving creative, which is all Tier 4 is
permitted to supply anyway.

## PR-D — assets library and platform bridges

### Migration

```sql
create table brand_assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  kind text not null check (kind in ('still','video','logo')),
  storage_path text not null,
  width integer, height integer, duration_seconds numeric,
  source text not null default 'upload' check (source in ('upload','gdrive','dropbox','figma')),
  external_id text, created_at timestamptz default now()
);
create table asset_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  provider text not null check (provider in ('gdrive','dropbox','figma')),
  folder_ref text, status text not null default 'connected',
  last_synced_at timestamptz, created_at timestamptz default now()
);
create table ad_accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  platform text not null check (platform in ('google','meta','linkedin','reddit','youtube')),
  external_account_id text, account_name text,
  status text not null default 'disconnected' check (status in ('connected','disconnected','error')),
  scopes text[], last_synced_at timestamptz, created_at timestamptz default now(),
  unique (org_id, platform)
);
alter table ad_variants add column asset_id uuid references brand_assets(id);
alter table ad_tests add column push_status text not null default 'not_pushed'
  check (push_status in ('not_pushed','pushing','pushed','failed'));
alter table ad_tests add column external_refs jsonb not null default '{}'::jsonb;
```

Org-scoped RLS on all three new tables, following the Wave 1 ownership matrix. A private
storage bucket `brand-assets` uses signed URLs, following the existing generated-image
pattern.

### Assets library

A workspace-level section, not an ads-only one: sidebar item **Assets**, above the
FIND group. Upload plus three sync sources (Google Drive, Dropbox, Figma) that are
folder-scoped, one folder each, re-read on a schedule. Ingest records width, height and
duration so the picker can tell the user what an asset fits.

In the ad brief the picker shows assets whose ratio matches the selected format first,
then everything else. Anything that does not fit the format is cropped to the format's
ratio and the crop is shown before launch, never silently. `ad_variants.asset_id` records
the choice, so performance can eventually be read per asset as well as per version.

### Platform bridges

One adapter per platform behind a single interface, so the UI and the state machine can
ship before any API does:

```ts
export type PlatformAdapter = {
  platform: AdPlatform;
  connect(): Promise<{ accountId: string; accountName: string; scopes: string[] }>;
  pushTest(test: AdTest, variants: AdVariant[]): Promise<{ externalIds: Record<string, string> }>;
  readMetrics(externalIds: Record<string, string>): Promise<MetricRow[]>;
};
```

Ship connector adapters for Google Ads (including YouTube), Meta and LinkedIn behind the
shared interface. Keep Reddit behind an API-feasibility flag. Before approval, each adapter
may implement `connect` against a stored-credential stub and throw a typed
`NotImplementedError` from `pushTest` and `readMetrics`. The Ad accounts screen, connection
flow, `push_status` machine and "Launch and push" button work end to end against that stub;
filling in a real API later touches one adapter and no UI.

**Non-negotiable behaviour, true from the first release:** a push creates the campaign
**paused**, with each version's tracking link already attached. Nothing spends until the
user turns it on. This is stated on the Ad accounts screen and in the launch panel, so it
must be true.

Real API priority: Google Ads, Meta Ads and LinkedIn Ads; Reddit follows only if access is
feasible. YouTube runs through Google Ads. X has no management adapter.

## Runtime token budget

The point of the ladder is that generation gets *cheaper*, not dearer.

| | Naive | This design |
|---|---|---|
| Craft | all four guides, ~4,700 | one platform block, ~600 |
| Evidence | everything flat | populated tiers only |
| Tier 4 | raw pages | 400-token cached summary |
| 3 variants | 3 calls | 1 call |

Roughly 3.5k tokens per three-variant generation against roughly 9k for the obvious
implementation, and the guides are compiled exactly once — here, at build time.
