// Pure ranking over stored signals. No secrets, safe to import anywhere.
// Extracts and ranks hooks, phrases, and themes. Rank weights raw frequency by
// the engagement carried on the signals a term appears in, so terms attached to
// higher performing content rank above terms that merely repeat.

export type SignalLike = {
  source: string;
  title: string | null;
  content: string | null;
  sentiment: string | null;
  metrics: Record<string, number> | null;
};

export type RankedTerm = {
  text: string;
  score: number;
  count: number;
  sources: string[];
};

export type AdIntelligence = {
  total: number;
  hooks: RankedTerm[];
  phrases: RankedTerm[];
  themes: RankedTerm[];
  sentiment: { positive: number; neutral: number; negative: number };
};

const STOPWORDS = new Set([
  "the","a","an","and","or","but","if","then","else","for","to","of","in","on",
  "at","by","with","from","as","is","are","was","were","be","been","being","it",
  "its","this","that","these","those","we","our","you","your","they","their",
  "i","me","my","mine","he","she","him","her","his","hers","them","us","not",
  "no","yes","so","do","does","did","done","have","has","had","will","would",
  "can","could","should","shall","may","might","must","about","into","over",
  "than","too","very","just","also","more","most","some","any","all","each",
  "every","one","two","new","other","such","up","out","off","down","who","what",
  "when","where","why","how","which","get","got","like","really","much","many",
]);

function engagement(m: Record<string, number> | null): number {
  if (!m) return 0;
  let sum = 0;
  for (const v of Object.values(m)) sum += typeof v === "number" && Number.isFinite(v) ? v : 0;
  return sum;
}

// A signal with engagement E contributes weight 1 + log10(1 + E) to every term
// it carries, so popular content lifts a term without swamping the counts.
function weightOf(m: Record<string, number> | null): number {
  return 1 + Math.log10(1 + Math.max(0, engagement(m)));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && w.length > 2 && !STOPWORDS.has(w));
}

function firstSentence(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  const cut = trimmed.split(/(?<=[.!?])\s/)[0] ?? trimmed;
  return cut.length > 90 ? cut.slice(0, 90).trim() : cut;
}

type Acc = { score: number; count: number; sources: Set<string> };

function rank(map: Map<string, Acc>, limit: number): RankedTerm[] {
  return [...map.entries()]
    .map(([text, a]) => ({ text, score: Math.round(a.score * 100) / 100, count: a.count, sources: [...a.sources] }))
    .sort((x, y) => y.score - x.score)
    .slice(0, limit);
}

export function buildIntelligence(signals: SignalLike[]): AdIntelligence {
  const themes = new Map<string, Acc>();
  const phrases = new Map<string, Acc>();
  const hooks = new Map<string, Acc>();
  const sentiment = { positive: 0, neutral: 0, negative: 0 };

  const bump = (map: Map<string, Acc>, key: string, w: number, source: string) => {
    const a = map.get(key) ?? { score: 0, count: 0, sources: new Set<string>() };
    a.score += w;
    a.count += 1;
    a.sources.add(source);
    map.set(key, a);
  };

  for (const s of signals) {
    if (s.sentiment === "positive") sentiment.positive += 1;
    else if (s.sentiment === "negative") sentiment.negative += 1;
    else if (s.sentiment === "neutral") sentiment.neutral += 1;

    const w = weightOf(s.metrics);
    const text = [s.title, s.content].filter(Boolean).join(". ").trim();
    if (!text) continue;

    // Hooks: the opening line of a piece of content, the part that earns attention.
    const hook = firstSentence(text);
    if (hook.length > 8) bump(hooks, hook, w, s.source);

    const tokens = tokenize(text);
    const seenTheme = new Set<string>();
    for (const t of tokens) {
      if (!seenTheme.has(t)) {
        bump(themes, t, w, s.source);
        seenTheme.add(t);
      }
    }
    const seenPhrase = new Set<string>();
    for (let i = 0; i < tokens.length - 1; i++) {
      const bg = `${tokens[i]} ${tokens[i + 1]}`;
      if (!seenPhrase.has(bg)) {
        bump(phrases, bg, w, s.source);
        seenPhrase.add(bg);
      }
    }
  }

  return {
    total: signals.length,
    hooks: rank(hooks, 12),
    phrases: rank(phrases, 15),
    themes: rank(themes, 15),
    sentiment,
  };
}
