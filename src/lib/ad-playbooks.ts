// Ads Engine v2: the Ad Practice Library. Evidence-backed platform playbooks
// and structural style recipes that shape HOW grounded copy is delivered.
// Pure data, safe to import in browser or server. The grounding corpus and
// campaign belief doc always supply WHAT is said; nothing here reintroduces
// tone adjectives — every style is a structural recipe with dos/don'ts.
//
// Evidence base (encoded in the rules below):
// - Google ABCD framework, validated by Kantar/Ipsos across 17k+ campaigns:
//   ABCD-compliant creative shows ~+30% short-term sales likelihood.
// - LinkedIn B2B Institute / Ehrenberg-Bass 95:5 rule; B2B Institute study:
//   71% of formulaic B2B ads (voiceover + text wall + logo last) drive no growth.
// - Binet & Field (IPA, 996 campaigns): emotional campaigns ~2x rational on
//   long-term profit; ~60:40 brand/activation balance.
// - Kantar/Oracle humor research: 90% recall lift for funny ads, 72% brand
//   preference — but the BRAND must be the center of the joke.
// - Reddit practice studies: CTR = message-to-community fit; organic-style
//   headlines, problem-first framing, no hard sell; comments are part of the ad.
// - Platform benchmark report (2023–2026): character limits, skip windows,
//   diagnostic ladders (CPM → CTR → CVR).

export type AdPlatform = "linkedin" | "x" | "reddit" | "youtube";

export type PlatformPlaybook = {
  platform: AdPlatform;
  audienceMindset: string;
  rules: string[];
  avoid: string[];
  limits: { headlineMax: number; bodyMax: number };
  benchmarks: string;
};

export const PLATFORM_PLAYBOOKS: Record<AdPlatform, PlatformPlaybook> = {
  linkedin: {
    platform: "linkedin",
    audienceMindset:
      "Professionals in learn/evaluate mode. 95% of B2B buyers are OUT of market right now, so the job is to be remembered, not clicked (95:5 rule).",
    rules: [
      "Aim for memorable over clickable: one sharp idea a buyer can replay in a meeting later",
      "Use emotion and story even for B2B — emotional creative roughly doubles long-term effects vs rational (Binet & Field)",
      "Sound like a person with a point of view (thought-leader voice), not a company",
      "Front-load the idea: the first line must survive the '...see more' fold",
    ],
    avoid: [
      "The 71%-failure formula: feature lists, jargon walls, generic stock energy, brand mention buried at the end",
      "Hyper-rational spec-sheet copy aimed only at the 5% in-market",
    ],
    limits: { headlineMax: 70, bodyMax: 150 },
    benchmarks: "Intro text ≤150 chars before the fold; headline ≤70 chars.",
  },
  x: {
    platform: "x",
    audienceMindset:
      "Real-time conversation and cultural momentum. Ads that win join the dialogue; ads that interrupt get scrolled.",
    rules: [
      "Write like a sharp post, not an ad: punchy, immediate, present-tense",
      "One thought per post; rhythm matters more than completeness",
      "Reference the live conversation the audience is actually having (from the corpus)",
      "Native media and conversational hooks outperform link-dump posts",
    ],
    avoid: [
      "Corporate announcements pasted from a press release",
      "Hashtag stuffing, multiple CTAs, thread-length arguments",
    ],
    limits: { headlineMax: 0, bodyMax: 280 },
    benchmarks: "Single post ≤280 chars. Typical strong CTR ~0.86%+.",
  },
  reddit: {
    platform: "reddit",
    audienceMindset:
      "Research mode: skeptical, savvy, allergic to marketing. CTR here is a 'message-to-community-fit' score.",
    rules: [
      "Headline must read like an organic post title a redditor would write",
      "Problem-first framing with specific outcomes beats aspirational copy",
      "Be useful or be funny — humor lowers defenses, but only when it lands native",
      "Show receipts: specifics, numbers, and honest caveats build the trust that drives CVR",
      "Assume the comments are part of the ad: write copy you could defend in a thread",
    ],
    avoid: [
      "Hard sells, superlatives, 'we're excited to announce', anything that smells like a press release",
      "Pretending not to be an ad — transparency wins, cosplay gets called out",
    ],
    limits: { headlineMax: 300, bodyMax: 500 },
    benchmarks:
      "Diagnose with the CPM→CTR→CVR ladder: high CPM = targeting, low CTR = creative/community fit, low CVR = landing trust.",
  },
  youtube: {
    platform: "youtube",
    audienceMindset:
      "Lean-back viewing with a 9.4-second skip decision. Creative must earn every second (view rate <25% = creative bottleneck).",
    rules: [
      "ABCD — Attention: open on the most interesting human moment, no logo intros",
      "ABCD — Branding: brand present in the first 5 seconds, spoken or shown naturally",
      "ABCD — Connection: story and emotion over spec lists; feature the audience's own words",
      "ABCD — Direction: exactly one specific CTA at the end",
    ],
    avoid: [
      "Slow builds that spend the skip window on scenery or logos",
      "Multiple messages / multiple CTAs in one spot",
    ],
    limits: { headlineMax: 100, bodyMax: 500 },
    benchmarks:
      "ABCD-compliant creative: ~+30% short-term sales likelihood (Google/Kantar). Script for the skip window.",
  },
};

// ── Style recipes ────────────────────────────────────────────────────────────
// Structure, not adjectives. Every style still draws its substance from the
// grounding corpus + belief doc, and every output faces all three gates.

export type AdStyle = {
  id: string;
  label: string;
  emoji: string;
  recipe: string; // structural instructions for the generator
  caution: string; // what the judge should watch for
  bestOn: AdPlatform[];
};

export const AD_STYLES: AdStyle[] = [
  {
    id: "deadpan",
    label: "Deadpan",
    emoji: "😐",
    recipe:
      "Dry, understated delivery. State the absurd or impressive thing in a flat, matter-of-fact register; the joke lands in the final line. Short sentences. No exclamation marks.",
    caution: "The brand must be the center of the joke or the humor won't convert to branded memory (Kantar).",
    bestOn: ["x", "reddit", "linkedin"],
  },
  {
    id: "irreverent",
    label: "Irreverent",
    emoji: "🔥",
    recipe:
      "Punch at the category's tired conventions — the clichés every competitor repeats — never at customers or creators. Name the convention, subvert it, plant the brand's belief as the alternative.",
    caution: "Must punch up at conventions/competitor habits, never down at users. Belief doc must back the attitude.",
    bestOn: ["x", "reddit"],
  },
  {
    id: "absurdist",
    label: "Absurdist",
    emoji: "🦆",
    recipe:
      "Start from one real corpus detail and escalate it to a surreal place, then snap back to the product in the last beat. One bit only — commit to it fully.",
    caution: "The brand must anchor the bit; random-for-random's-sake fails the swap test.",
    bestOn: ["x", "reddit"],
  },
  {
    id: "straight_offer",
    label: "Straight offer",
    emoji: "🎯",
    recipe:
      "Pure activation: lead with the concrete offer, back it with one proof point (real number from the corpus/Phase 2 data), end with one hard CTA. No metaphors, no warm-up. This is the deliberately 'salesy' mode — clarity is the craft.",
    caution: "Every claim needs a source; urgency must be real (no fake scarcity).",
    bestOn: ["linkedin", "reddit", "youtube"],
  },
  {
    id: "storyteller",
    label: "Storyteller",
    emoji: "📖",
    recipe:
      "A 3-beat mini-narrative built from one real creator or audience moment in the corpus: situation → turn → resolution featuring the product. Emotional beats rational ~2x on long-term effects.",
    caution: "The story must come from a real corpus item, not an invented composite person.",
    bestOn: ["youtube", "linkedin"],
  },
  {
    id: "voice_of_fan",
    label: "Voice of the fan",
    emoji: "💬",
    recipe:
      "Build the ad around one or two verbatim audience quotes (quotation marks, attribution style like a review). The brand's only job is framing the quote. UGC energy.",
    caution: "Quotes must be verbatim from the corpus — no paraphrasing into marketing speak.",
    bestOn: ["reddit", "x", "youtube"],
  },
  {
    id: "receipts",
    label: "Receipts",
    emoji: "🧾",
    recipe:
      "Data-led proof: open with the single most surprising true number (conversion data, audience stat, proof point), then one sentence of context, then CTA. Numbers do the talking.",
    caution: "Numbers must trace to Phase 2 data or the belief doc's proof points — the groundedness gate will check.",
    bestOn: ["linkedin", "reddit"],
  },
  {
    id: "contrarian",
    label: "Contrarian",
    emoji: "⚡",
    recipe:
      "Open with the brand belief a rival CMO would object to, stated plainly. One sentence of why. One sentence of what the brand does about it. This is the belief doc weaponized.",
    caution: "The stated position must literally come from the belief doc — this style fails instantly without a sharp one.",
    bestOn: ["linkedin", "x"],
  },
  {
    id: "educator",
    label: "Educator",
    emoji: "🎓",
    recipe:
      "Teach exactly one useful thing the audience demonstrably asks about (pull the question from real comments). Give the answer honestly, then a soft CTA. Value first, ask second.",
    caution: "The lesson must be genuinely useful standalone — if the 'lesson' is just a pitch, it fails platform fit on Reddit.",
    bestOn: ["reddit", "linkedin", "youtube"],
  },
  {
    id: "launch_energy",
    label: "Launch energy",
    emoji: "🚀",
    recipe:
      "Announcement mode: what's new, why it exists (belief doc), what to do right now. Time-bound and specific. High tempo but concrete — every hype word replaced by a fact.",
    caution: "Momentum without substance fails the swap test; anchor each beat in a real detail.",
    bestOn: ["x", "linkedin", "youtube"],
  },
];

export function getStyle(id: string): AdStyle | undefined {
  return AD_STYLES.find((s) => s.id === id);
}

export function getPlaybook(platform: string): PlatformPlaybook {
  return PLATFORM_PLAYBOOKS[(platform as AdPlatform) in PLATFORM_PLAYBOOKS ? (platform as AdPlatform) : "reddit"];
}
