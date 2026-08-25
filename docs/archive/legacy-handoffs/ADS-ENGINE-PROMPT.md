# Ads Engine — how to build it and push it to Lovable

Everything a coding agent needs is in `ADS-ENGINE-SPEC.md` (this folder) and the two
design files at the project root. You do not write any code yourself.

**PR = pull request: GitHub's way of folding one set of changes into your main code.**
You review it, then click Merge. Lovable picks the change up from GitHub automatically.

---

## Do this three times, once per prompt below

1. Open **Claude Code** on the `creator-signal-suite` folder.
2. Copy one prompt block below in full. Paste it into Claude Code. Press **Enter**.
3. Wait. It will edit files and then open a PR. It will print a link ending in
   `/pull/8` (or 9, 10).
4. Open that link in your browser. Read the **Files changed** tab if you want to look,
   then click the green **Merge pull request**, then **Confirm merge**. *Safe — a merge
   can be undone by reverting the PR from the same page.*
5. Open **Lovable**. Your project picks up the merged change from GitHub within a minute.
6. Click through the Ads Center in Lovable and check it works before starting the next
   prompt. *This is the step people skip. Don't.*

Prompts 2 and 3 each add database tables. Claude Code will ask you to run a migration in
**Supabase** — it prints the exact SQL and where to paste it (Supabase → SQL Editor →
New query → paste → Run). *Riskier than a merge: tables are additive here, nothing is
dropped, but read what it prints before you click Run.*

---

## Prompt 1 — the generation core

```
Read aspen-handoff/ADS-ENGINE-SPEC.md, section "PR-A". Implement it exactly.

Build src/lib/evidence-ladder.ts and src/lib/ad-formats.ts as specified, add the
per-platform craft blocks and the 5a/5b sub-tiering to src/lib/ad-playbooks.ts, and
rewire src/lib/ad-generation.server.ts so generateAuthenticCopy takes an EvidenceBundle
plus format, tone and variantCount, and returns all variants from a SINGLE model call
with per-variant provenance. Prompt assembly order is in the spec — skip absent tiers
entirely rather than sending empty headers. Never load the four source guides at
runtime; they are compiled into the craft blocks at build time.

generateAdCopy in src/lib/ads.functions.ts must resolve the bundle, run floorCheck, and
return { blocked: true, ask } instead of throwing.

Rebuild the Ads Center Brief and Versions screens to match the design in
"Aspen Ads Engine.dc.html" at the project root: read that file for layout, copy, tone
picker, format picker, the "What we're writing from" panel and the evidence trail under
each version. Follow aspen-handoff/DESIGN-RULES.md. Wrap the pages in .aspen-scope —
without it the Aspen colours silently fall back to the shadcn dark theme.

Add the one migration in the spec (campaigns.competitors). Do not add other tables.
Type-check and lint before you finish, then open a PR titled
"Ads engine: evidence ladder, craft blocks, ad formats".
```

## Prompt 2 — tests, tracking links, dashboard

```
Read aspen-handoff/ADS-ENGINE-SPEC.md, section "PR-B". Implement it exactly.

Add the ad_tests, ad_variants and ad_links tables with RLS policies mirroring
ad_corpus exactly, build src/lib/ad-tests.functions.ts, and mint one tracking link per
version reusing the existing affiliate redirect handler — do not write a second one.
"Save for later" is a draft with starts_at set; "run alongside" sets run_with and forces
both tests to share a start time.

Build the Test setup, Tests and Performance screens to match "Aspen Ads Engine.dc.html"
at the project root. AuthenticAdStudio.tsx becomes Brief and Versions; the currently
unrouted AdsLibrary.tsx becomes the Tests list. Routes: app.ads.index, app.ads.variants,
app.ads.tests, app.ads.$testId.performance. Every page wrapped in .aspen-scope.

Benchmark comparisons on the Performance screen come from the playbook benchmarks added
in PR-A. The cost-per-signup tile stays as the disabled "Needs spend" state shown in the
design until the spend column from SPEC-spend-and-attribution.md exists — do not invent
a number and do not compute ROAS.

Print the migration SQL for me to run in Supabase before you open the PR. Title it
"Ads engine: A/B tests, tracking links, performance".
```

## Prompt 3 — competitor research

```
Read aspen-handoff/ADS-ENGINE-SPEC.md, section "PR-C". Implement it exactly.

Add the competitor_research table with RLS, and src/lib/competitor-research.server.ts
with inferCompetitors and researchCompetitors. Research runs ON DEMAND when Tier 4 is
requested and the cache is cold or expired, 14-day TTL, findings stored summarised to
roughly 400 tokens — positioning lines, category cliches, format norms — never raw
pages. Competitors are inferred from the product description into campaigns.competitors
and shown as editable chips in the Brief; a user edit wins and is never re-inferred over.

Before writing any fetcher, check what is actually reachable today for each of
LinkedIn, YouTube (Google ads transparency), X and Reddit, and tell me what you found.
Where no ad library exists, fall back to the competitor's own landing pages plus
community reaction threads from collect-signals. Tier 4 may only supply positioning
contrast and format norms — never phrasing, never a claim. Enforce that in the prompt
assembly, not just in a comment.

A workspace with thin brand material now resolves to the "researched" profile instead of
being blocked. Print the migration SQL for me to run in Supabase before opening the PR.
Title it "Ads engine: competitor research".
```

## Prompt 4 — assets library and platform bridges

```
Read aspen-handoff/ADS-ENGINE-SPEC.md, section "PR-D". Implement it exactly.

Add the brand_assets, asset_sources and ad_accounts tables with RLS mirroring
ad_corpus, the asset_id and push_status columns, and a private brand-assets storage
bucket using the same signed-URL pattern as the existing generated ad images.

Build the Assets screen and the Ad accounts screen to match "Aspen Ads Engine.dc.html"
at the project root — read that file for layout and copy. Assets is a workspace-level
sidebar item, not an Ads Center tab. Add the artwork picker to the ad brief and the
"Where it publishes" panel to test setup, both as shown in the design. Every page
wrapped in .aspen-scope.

Build the four platform adapters behind the single PlatformAdapter interface in the
spec. connect() works against a stored-credential stub; pushTest() and readMetrics()
throw a typed NotImplementedError. The Ad accounts screen, connect/disconnect, the
push_status machine and the "Launch and push" button must all work end to end against
that stub, so that filling in a real API later touches one adapter file and no UI.

A push always creates the platform campaign PAUSED with each version's tracking link
attached. The design promises that in two places — make it structurally true, not a
comment.

Print the migration SQL for me to run in Supabase before opening the PR. Title it
"Ads engine: assets library and platform bridges".
```

---

## One thing only you can do

Open Lovable → **Knowledge** panel → paste the contents of
`aspen-handoff/DESIGN-RULES.md`. It is still on the open-items list from the last
handoff, and every prompt above assumes Lovable knows those rules.
