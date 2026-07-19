// Server only. Brand doc text extraction for Ads Center v3-4.
// Turns an uploaded PDF or text file into (a) verbatim excerpts that join the
// grounding corpus as kind 'brand_doc' and (b) belief doc suggestions the user
// can apply by hand. Everything fails closed: no key or no readable text means
// an explicit error to the caller, never fabricated content.

export type BrandDocExtraction = {
  excerpts: string[];
  beliefs: string[];
  proofPoints: string[];
  neverSay: string[];
};

const MAX_DOC_CHARS = 60_000;

// ── File text ────────────────────────────────────────────────────────────────

export async function extractDocText(fileName: string, bytes: Uint8Array): Promise<string> {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return (text ?? "").trim().slice(0, MAX_DOC_CHARS);
  }
  // txt / md / any plain text
  return new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim().slice(0, MAX_DOC_CHARS);
}

// ── LLM extraction ───────────────────────────────────────────────────────────

async function llmJson(system: string, user: string): Promise<Record<string, unknown> | null> {
  const key = process.env.LLM_API_KEY;
  if (!key) return null;
  const base = process.env.LLM_API_BASE ?? "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function stringArray(v: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim().slice(0, maxLen))
    .slice(0, maxItems);
}

export async function extractBrandDocMaterial(input: {
  fileName: string;
  text: string;
  productDescription: string;
}): Promise<BrandDocExtraction | null> {
  if (!process.env.LLM_API_KEY) return null;
  const system =
    "You mine a brand's own document for advertising raw material. Return strict JSON only: " +
    '{"excerpts": string[], "beliefs": string[], "proof_points": string[], "never_say": string[]}. ' +
    "excerpts: 5 to 15 VERBATIM passages copied exactly from the document, each under 300 characters, " +
    "picked for concrete claims, specific facts, distinctive voice, product details, or customer language. " +
    "Never paraphrase an excerpt and never invent one. " +
    "beliefs: up to 5 short statements of what this brand believes, so specific a rival would object; drawn only from the document. " +
    "proof_points: up to 5 decisions or facts from the document that back those beliefs. " +
    "never_say: up to 5 words or claims the document forbids or that would contradict it. " +
    "If the document supports fewer items, return fewer. If it supports none, return empty arrays. " +
    "No hyphens or dashes in beliefs, proof_points, or never_say. No unbacked statistics.";
  const user = [
    `Document name: ${input.fileName}`,
    input.productDescription ? `Product context: ${input.productDescription.slice(0, 500)}` : "",
    "Document text:",
    input.text,
  ]
    .filter(Boolean)
    .join("\n\n");

  const parsed = await llmJson(system, user);
  if (!parsed) return null;

  const excerpts = stringArray(parsed.excerpts, 15, 300)
    // Keep only excerpts that really appear in the document (whitespace-tolerant).
    .filter((e) => normalize(input.text).includes(normalize(e).slice(0, 120)));
  return {
    excerpts,
    beliefs: stringArray(parsed.beliefs, 5, 300),
    proofPoints: stringArray(parsed.proof_points, 5, 300),
    neverSay: stringArray(parsed.never_say, 5, 200),
  };
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}
