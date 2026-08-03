# Aspen — design rules

Paste this into Lovable's **Knowledge** panel (Settings → Knowledge) so it
applies to every prompt, including new components.

---

## What Aspen is

Pre-launch B2B product: creator discovery + affiliate/creator management + ads
management in one workspace, across **YouTube, Reddit, X and LinkedIn**.
Positioning: "Find the creators. Run the ads. Keep the proof." The all-in-one
loop is the differentiator — discovery alone is not.

Audience: B2B and vertical SaaS, startups hunting leads, coaches and experts
selling to knowledge workers, agencies. **Not** DTC, e-commerce or consumer
retail brands.

## Never do these

- **No fabricated social proof.** No testimonials, customer logos, star ratings,
  "trusted by 500+ teams", or invented case studies. The product hasn't launched.
  Build trust with cited industry statistics instead.
- **No repeating a statistic.** Each number appears exactly once across the site.
- **No platforms beyond the four.** Instagram, TikTok and Meta are roadmap-only.
  Never list them as features.
- **No CTA other than these two:** "Get early access" (primary) and "Talk to us"
  (enterprise). Not "Start free trial", "Sign up free", "Book a demo".
- **No implying general availability.** Everything is early access: waitlist,
  cohorts, launch pricing locked for 12 months.
- **No emoji** in UI or copy.
- **No AI-slop visuals:** gradient-mesh backgrounds, decorative blobs,
  glassmorphism, rounded box with a coloured left border, pill shapes everywhere.
- **No Inter, Roboto or Arial.** The fonts are set below.

## Colour

Use Tailwind token names from `tailwind.config.ts`. If you need a colour that
isn't tokenised, add it to the config — never type a raw hex or an arbitrary
colour value in a class.

| Token | Hex | Use |
| --- | --- | --- |
| `cream` | `#FAF7F1` | page background — the default |
| `surface` | `#FFFFFF` | cards on cream |
| `dark` | `#17141E` | body text, dark sections |
| `dark-raised` | `#211D2B` | cards inside dark sections |
| `accent` | `#F2542D` | orange — primary CTA, emphasis |
| `highlight` | `#FFD84D` | yellow — small accents, checkmarks |
| `tint` | `#FFECD9` | warm callout blocks (text `accent-ink`) |
| `border` | `#E8E2D6` | card borders, always 1.5px |
| `muted` | `#4A4553` | body copy |
| `subtle` | `#8A8494` | meta text, labels |
| `sand` | `#F5F1E9` | inactive chips, table zebra |

At most **two background colours per page** — cream plus one dark or tinted
section. Platform colours (`youtube` `#F03`, `reddit` `#FF4500`, `x` `#17141E`,
`linkedin` `#0A66C2`) are for platform marks only, never for UI chrome.

## Type

- Headings: `font-heading` (Bricolage Grotesque) at `font-extrabold`, with
  `tracking-[-0.03em]` on large sizes and `leading-[1.05]`.
- Body: `font-sans` (Instrument Sans), 400–700.
- Section eyebrows: 13px, `font-bold`, `tracking-[0.16em]`, `text-accent`,
  uppercase.
- Big headings use `clamp()` for fluid sizing, e.g.
  `text-[clamp(34px,4vw,52px)]`.
- Long paragraphs get `text-pretty`; headlines get `text-balance`.

## Components

- **Cards:** `bg-surface border-[1.5px] border-border rounded-[22px]` with
  20–26px padding. On dark sections: `bg-dark-raised` + `border-dark-border`.
- **Primary button:** `bg-accent text-cream font-bold rounded-[12px]`, hover to
  `bg-dark`.
- **Secondary button:** `border-[1.5px] border-border bg-transparent`, hover
  border to `dark`.
- **Chips / tags:** small radius (`rounded-[8px]`–`rounded-[11px]`), 11–13px,
  `font-bold`. Not fully rounded pills.
- **Layout:** flex or grid with `gap-*`. Never space siblings with margins on
  each child.
- Radii stay in the 8–26px range. Nothing fully rounded except avatars, status
  dots and progress tracks.

## Copy voice

Plain, conversational, written for a 25–35 year old marketer. Short sentences.
Say the specific thing rather than the impressive-sounding thing: "Channel emails
pulled from the YouTube Data API", not "AI-powered contact enrichment". No
jargon, no "unlock", "supercharge", "seamless", "revolutionary". No exclamation
marks.

## When adding something new

Name an existing element to copy from — "styled like the pricing cards on the
landing page" — rather than describing a card from scratch. If a pattern doesn't
exist yet, build it from the tokens above and keep it consistent with the
nearest relative.
