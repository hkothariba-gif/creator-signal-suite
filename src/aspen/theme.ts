/* Aspen design tokens as plain TS, for values needed outside Tailwind (inline
   style={{}} and anything computed in JS).

   These are already mirrored as Tailwind tokens in the @theme block of
   src/styles.css — this app is on Tailwind v4, so the theme lives in CSS and
   there is no tailwind.config file. If you convert an inline style to a
   utility, the token is already there; if you add one here, add it there too. */

export const aspen = {
  color: {
    cream: "#FAF7F1", // page background
    surface: "#FFFFFF", // cards
    dark: "#17141E", // text + dark sections
    darkRaised: "#211D2B", // cards on dark
    darkBorder: "#2C2838",
    accent: "#F2542D", // orange — primary CTA
    highlight: "#FFD84D", // yellow
    tint: "#FFECD9", // warm tint blocks
    tintText: "#B33A12",
    border: "#E8E2D6",
    muted: "#4A4553",
    subtle: "#8A8494",
    onDarkMuted: "#B8B2C2",
    success: "#1FA463",
  },
  platform: {
    youtube: "#F03",
    reddit: "#FF4500",
    x: "#17141E",
    linkedin: "#0A66C2",
  },
  font: {
    heading: "'Bricolage Grotesque', sans-serif", // weight 800, letter-spacing -0.03em
    body: "'Instrument Sans', sans-serif",
  },
  radius: { card: 22, cardLg: 26, control: 12, chip: 10 },
  border: "1.5px solid #E8E2D6",
} as const;
