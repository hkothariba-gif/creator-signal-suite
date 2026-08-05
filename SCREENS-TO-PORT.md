# Aspen — five pieces still to port

Design source: `Aspen App.dc.html` (Omelette project). Palette and type per
`DESIGN-RULES.md`. Everything below is inline-styled in the design; in the repo use
Tailwind classes against the `@theme` tokens as the other Aspen screens do.

Reminder: any new Aspen page or panel must sit inside the `.aspen-scope` wrapper,
or the four colliding token names (`accent`, `muted`, `border`, `sans`) fall back
to shadcn's dark theme.

Shared card shell used by all of these: `bg-white border-[1.5px] border-[#E8E2D6]
rounded-[20px] p-[22px]`. Section headings: Bricolage Grotesque 700, 16.5px.
Body: Instrument Sans. Muted text `#8A8494`, secondary `#4A4553`.

---

## 1. `EmailAccountsCard` → "Sending identity"

Replaces the dark card on Outreach. Keep every existing behaviour: OAuth start,
disconnect, the `configured` gate, the revoked state, busy spinners.

- Heading "Sending identity", 6px bottom margin.
- Sub-copy, 12.5px `#8A8494`: "Connect your own inbox so outreach sends from your
  real address. Without one, email goes out via the shared Aspen sender."
- One row per provider, `bg-[#FAF7F1] rounded-[13px] px-[15px] py-3`, stacked with
  9px gap. Provider name 14px/700; status line 12px `#8A8494` underneath, using the
  existing four-way logic (`Connected as <address>` / `Session expired — reconnect`
  / `Not connected` / `Awaiting OAuth app setup`).
- Connected → right-aligned "Disconnect" button: 1.5px `#E8E2D6` border,
  transparent bg, 12.5px/700 `#8A8494`, 9px radius; hover border and text
  `#C4442A`.
- Not connected → "Connect" button: solid `#F2542D`, `#FAF7F1` text, 12.5px/700,
  9px radius; hover bg `#17141E`. Disabled at 40% when not `configured`.
- Footnote 11.5px `#B5AFA3`: "Outlook supports send and reply tracking. Gmail is
  send-only — replies land in your Gmail inbox. Tokens are stored server-side and
  never shared."

## 2. `DeliveryMetricsPanel` → "Delivery metrics"

- Heading "Delivery metrics".
- Three equal tiles in a row, 9px gap, each `bg-[#FAF7F1] rounded-[13px]`,
  13px/10px padding, centred: Bricolage 800 26px number over a 12px/600 `#8A8494`
  label. Sent → `#17141E`, Replies → `#F2542D`, Failed → `#8A8494`. (Drop the old
  red/amber/green; Aspen has no semantic traffic-light palette.)
- Below, one row per channel that has traffic: 12.5px, `justify-between`, 8px
  vertical padding, 1px `#F0EAE0` top border. Left = channel name, 600 `#8A8494`,
  capitalised. Right = `N sent · N replies · N% reply rate` in `#4A4553`.
- Keep the two honest empty states: loading, and "No data to display" when sent
  and replies are both 0.

## 3. `SequencesPanel` → "Sequences"

The one panel that stays dark — `bg-[#17141E]`, `#FAF7F1` text, 20px radius. It is
the deliberate accent card in that row, so don't convert it to cream.

- Header row: "Sequences" heading left; "+ New" button right — solid `#F2542D`,
  12.5px/700, 9px radius, hover bg `#FFD84D` with `#17141E` text.
- Sub-copy 12.5px `#8A8494`: "Multi-touch follow-ups that stop the moment someone
  replies. Enroll creators from the composer."
- One card per sequence, `bg-[#211D2B] rounded-[13px] px-[15px] py-[13px]`, 9px
  gap. Name 13.5px/700; meta 12px `#8A8494` = `N steps · N active`. Status pill
  right, 11.5px/700, no background — Running `#FFD84D`, Paused `#8A8494`.
- Action row inside each card, 11px above: Edit / Enrollments / Archive. All
  1.5px `#34303F` border, transparent, 11.5px/700, 8px radius. Edit and
  Enrollments text `#B8B2C2` (hover `#FAF7F1`, border `#8A8494`); Archive text
  `#8A8494` (hover text and border `#F98A6B`).
- Footnote 11.5px `#6E687A`: "Use {{creator_name}} to personalize a step." — the
  token itself in `#FFD84D` 700.
- Editor form, enrollment list, stop-on-reply and archive behaviour all stay as
  built; restyle inputs to the Aspen field style used elsewhere on Outreach
  (`bg-[#FAF7F1]`, 1.5px `#E8E2D6`, 11–12px radius, focus border `#F2542D`).

## 4. `AffiliateHeatMap` → Hotlist fit map

The scatter itself is already redesigned on the Hotlist screen (cream card,
`#FFECD9` best-match quadrant, `#FFD84D` dashed budget line, orange dots for
in-range creators and `#C9C1B4` for out-of-range). What's missing is the ranked
list, which now sits inside the same card under a 1.5px `#F0EAE0` divider:

- Label "RANKED BY FIT", 11.5px/700, 0.12em tracking, `#8A8494`.
- One row per creator, 10px gap: score right-aligned in a 30px column, 14.5px/800,
  coloured by band; name 13.5px/700 truncated; a 6px progress bar under the name
  (`#F0EAE0` track, width = score%, fill in the band colour); then two chips,
  `bg-[#F5F1E9]` `#8A8494` 10.5px/700 6px radius — `Fit NN` and the formatted
  reach. **Both chips need `white-space: nowrap`.**
- Score bands replace the old green/amber/grey: ≥70 → `#F2542D`, ≥40 → `#C98A2E`,
  below → `#8A8494`.
- Keep the two graceful-degradation paths: creators with no reach data still
  appear in the list, and the "reach axis fills in once a creator data source is
  connected" note still shows when nothing can be plotted.

## 5. `/app/campaigns/$id` — campaign detail

New screen. Column layout, 16px gap, max-width 1080px.

1. **Back link** — "← All campaigns", 13.5px/700 `#8A8494`, hover `#F2542D`.
2. **Header card** (26px padding). Left: status pill (existing status colours),
   platform chips below it (11px/700 white on the platform colour, 7px radius),
   then `<product> · goal is <goal>` at 14.5px `#4A4553` with the goal bolded to
   `#17141E`. The campaign name is **not** repeated here — the page header already
   shows it, with the date range and goal as its subtitle. Right: "Add creators"
   (solid `#F2542D`, hover `#17141E`), "Pause" and "Duplicate" (1.5px `#E8E2D6`
   outline, hover border `#17141E`).
   Footer strip above a 1.5px `#E8E2D6` divider: `<spent> of <budget> spent`, a
   10px `#F5F1E9` track with an `#F2542D` fill at the spend percentage, and the
   date range right-aligned in `#8A8494`.
3. **Funnel row** — one flexible column per stage: Discovered, Shortlisted,
   Contacted, Contracted, Live. Bricolage 800 30px number, 13.5px/700 label,
   12px `#8A8494` note. The last two stages' numbers are `#F2542D`, the rest
   `#17141E`.
4. **Two columns, min 380px each.** Left "Creators on this campaign" with an
   "Open hotlist →" link: rows on `#FAF7F1`, 14px radius, platform glyph tile,
   name + `<deal> · <clicks> clicks`, a stage pill (Live `#DDF3E6`/`#0E7A3D`,
   Contracted `#FFECD9`/`#B33A12`, else `#F5F1E9`/`#8A8494`), revenue right-aligned
   in a 62px column. Rows link to the creator profile. Right "Ads running" with an
   "Ads Center →" link: platform dot, kind, status right (Live `#0E7A3D`, else
   `#8A8494`), the headline in quotes at 14.5px/600, then `<spend> spent ·
   <cpa> per conversion`.
5. **Proof band** — `bg-[#17141E]`, 22px radius, 26px padding. Four stats in
   `#FFD84D` Bricolage 800 25px with 12.5px `#8A8494` labels: Attributed revenue,
   Spend, Return, Conversions. Beside them a 12-bar column chart, 96px tall, 5px
   gap, 5px top radius — early bars `#3A3546`, middle `#FFD84D`, last three
   `#F2542D` — captioned "Attributed revenue, last 12 weeks".
6. **Brief card** — label/value rows, 1px `#F0EBE1` top borders. Labels in a 92px
   column, 12.5px/700 uppercase 0.06em `#8A8494`. Values 14.5px `#17141E`.
   Rows: Product, Audience, Offer, Avoid. "Edit brief" outline button in the header.
7. **"Archive this campaign"** — plain text button, 13px/700 `#8A8494`,
   hover `#F2542D`, bottom-left.

Wire it to the real campaign row, its scored hotlist creators, its ads and its
attribution totals. Where a number isn't available yet, use an honest empty state
rather than a zero that reads as real.
