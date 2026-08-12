# Next stage: navigation fixes, an AI control panel, and Slack

## 1. Why the preview looked broken

The app itself is healthy. I signed in as a throwaway test account and walked
every route (`/`, `/login`, `/signup`, `/onboarding`, all eleven `/app/*`
screens, `/admin`, `/health`): every page rendered, and there were zero page
errors or console errors. The frozen tab was serving an old cached bundle from a
previous build, which had stopped responding to scripts entirely. The metadata
edit in this turn forces a fresh build, so a reload of the preview picks up the
current app. Root page title/description were also still "Lovable App", so those
are now real Aspen metadata.

## 2. Navigation and follow-through fixes (highest value first)

These are the gaps where the app asks for something and then leaves the user
without the next step.

**Landing after login goes to the wrong place.** A signed-in user hitting
`/login` or `/signup` is sent to `/onboarding`, even when they have already
finished onboarding. Route signed-in users to `/app` and only send them to
onboarding if their profile is genuinely incomplete.

**Empty states are dead ends.** Campaigns shows a bare "No data to display"
card; Hotlist, Discovery, Ads Center, Affiliate and Expansion are similar. Each
one gets an empty state in the pattern of the Home page's "Quick actions" card:
one line of what lives here, and one primary button that starts it ("Create your
first campaign", "Find creators for this campaign", "Connect a platform").

**Uploads have no visible home.** Onboarding and the Ads Center accept product
docs and audience sheets, and they do get stored, but nothing in the UI lists
what was uploaded, when, or whether text extraction succeeded. Add a "Documents"
panel on the campaign detail page: filename, size, upload date, extraction
status (queued / mined / failed, with excerpt count), re-upload and delete. Same
list, read-only, in Settings so a workspace can see everything it has given us.

**Campaign creation only exists inside onboarding.** The "+ New campaign" button
needs a real create flow reusing the onboarding step content (description,
platforms, audience sheet) so a second campaign doesn't require a second signup.

**"No organization yet" in the sidebar.** New accounts have no org, which silently
weakens anything org-scoped later. Create the org during onboarding and show its
name there.

**Discovery is YouTube-only but offers four platforms.** Keep the selector, but
mark X, Reddit and LinkedIn explicitly as not connected yet with a link to
Platforms, instead of letting a user run a search that returns nothing.

**Per-page checks that pass and stay as-is:** Home, Platforms, Settings,
Outreach inbox, Community signals, `/health`, and the landing page all render
correctly with live data wiring.

## 3. AI control panel architecture

Goal: the user types "build a campaign for our onboarding tool aimed at RevOps
leads" and Aspen turns it into a reviewed, executed plan.

Shape:

- **Surface** — a persistent right-hand panel available on every `/app` screen
  (keyboard shortcut, collapsible), plus the existing hero prompt as an entry
  point. Styled from the Aspen tokens, cards like the pricing cards.
- **Tool layer** — one server-side tool per real action the app already has:
  `create_campaign`, `update_audience_spec`, `find_creators`, `score_hotlist`,
  `move_hotlist_stage`, `draft_outreach`, `send_sequence`, `generate_ad`,
  `create_tracking_link`, `read_metrics`. Each is a thin wrapper over the
  existing server functions, so the assistant can't do anything the UI can't.
- **Plan-then-execute** — the model first returns a step list the user sees and
  approves. Mutating tools require that approval; read tools run immediately.
  Steps report status inline and link to the screen they changed.
- **Memory** — conversation threads and step history stored per workspace so the
  assistant can answer "what did we change last week" and resume a plan.
- **Grounding** — the assistant reads the campaign's audience spec, hotlist
  scores and ad corpus excerpts, so its suggestions quote the brand's own
  material rather than inventing copy.

## 4. Slack integration

Goal: ask your Aspen workspace questions from Slack.

- Connect Slack through the managed connector for a single workspace connection,
  and map each Slack user to an Aspen profile via verified email, so answers are
  scoped by the same permissions as the web app.
- A public endpoint receives Slack events and slash commands, verifies the
  signature, and routes the question through the same read-only tools as the AI
  panel (`read_metrics`, creator and product comparisons) — never the mutating
  ones.
- Answers post back as Slack blocks: a headline number, a compact table, and a
  deep link into the matching Aspen screen.
- Supported first: last 24h / 7d campaign performance, creators ranked by
  attributed revenue, products ranked by conversions, outreach reply rate.
- Optional digests: a scheduled morning summary per channel.

## 5. Suggested order

1. Post-login routing, empty states, campaign creation, document panel (small,
   unblocks everyday use).
2. AI control panel: tool layer first, then the panel, then plan approval.
3. Slack: read-only Q&A, then digests.

## Technical notes

- New routes/screens live under `src/routes/app.*` inside the existing
  `.aspen-scope` shell; assistant tools wrap existing `src/lib/*.functions.ts`
  server functions rather than duplicating logic.
- Assistant threads, steps and Slack identity mappings need new tables with
  owner-scoped RLS and explicit grants; Slack event handling belongs on a
  public API route with signature verification.
