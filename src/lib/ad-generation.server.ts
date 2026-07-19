// Server only. Generates ad copy through the LLM API and ad imagery through the
// image API, then stores the image in Supabase Storage. Keys are read from the
// server environment and never reach the browser. Returns null on failure so
// callers surface an honest error rather than fabricated output.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AdCopy = { headline: string; body: string; cta: string };

const BUCKET = "ad-images";

function firstString(...vals: unknown[]): string {
  for (const v of vals) if (typeof v === "string" && v.trim()) return v.trim();
  return "";
}

// ── Copy through the LLM API (OpenAI compatible chat completions) ────────────

export async function generateCopy(input: {
  brand: string;
  brief: string;
  tone: string;
  platform: string;
  themes: string[];
  hooks: string[];
}): Promise<AdCopy | null> {
  const key = process.env.LLM_API_KEY;
  if (!key) return null;
  const base = process.env.LLM_API_BASE ?? "https://api.openai.com/v1";
  const model = process.env.LLM_MODEL ?? "gpt-4o-mini";

  const system =
    "You write short direct advertising copy. Return strict JSON only: " +
    '{"headline": string, "body": string, "cta": string}. ' +
    "Headline under 60 characters. Body two or three sentences. " +
    "Call to action under 24 characters. No hyphens or dashes. No unbacked statistics.";
  const user = [
    `Brand: ${input.brand}`,
    `Target platform: ${input.platform}`,
    `Tone: ${input.tone}`,
    `Brief: ${input.brief}`,
    input.themes.length ? `Themes drawn from audience signals: ${input.themes.join(", ")}` : "",
    input.hooks.length ? `Hooks that earned attention: ${input.hooks.slice(0, 4).join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

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
    const parsed = JSON.parse(content) as Record<string, unknown>;
    const headline = firstString(parsed.headline);
    const body = firstString(parsed.body);
    const cta = firstString(parsed.cta);
    if (!headline && !body) return null;
    return { headline, body, cta };
  } catch {
    return null;
  }
}

// ── Phase 5A: grounded generation with anti-flattening gates ─────────────────
// The engine only writes from verbatim source material (real comments, creator
// spoken words, conversion-backed phrases) plus the campaign belief doc. Tone
// adjectives are deliberately absent from the prompt: adjectives produce the
// statistical average of every brand; verbatim material produces copy no
// competitor could ship. Two LLM-judge gates enforce that before anything is
// shown: a swap test (could a competitor run this unchanged?) and a
// groundedness test (does every claim trace to a source?).

export type GroundedSource = {
  ref: number;
  id: string;
  kind: string;
  author: string | null;
  content: string;
};

export type GateResult = { pass: boolean; reason: string };

export type AuthenticCopy = {
  copy: AdCopy;
  citations: number[]; // refs of the sources actually used
  echoPhrases: string[]; // verbatim audience phrases carried into the copy
  gates: { swap: GateResult; groundedness: GateResult; platformFit: GateResult };
  attempts: number;
};

async function llmJson(
  system: string,
  user: string,
): Promise<Record<string, unknown> | null> {
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

function sourcesBlock(sources: GroundedSource[]): string {
  return sources
    .map(
      (s) =>
        `[${s.ref}] (${s.kind}${s.author ? `, by ${s.author}` : ""}) "${s.content.slice(0, 400)}"`,
    )
    .join("\n");
}

async function judgeCopy(input: {
  copy: AdCopy;
  sources: GroundedSource[];
  beliefs: string;
  productDescription: string;
  platformRules: string;
  styleCaution: string;
}): Promise<{ swap: GateResult; groundedness: GateResult; platformFit: GateResult } | null> {
  const system =
    "You are a strict advertising reviewer. Evaluate the ad against three tests and return strict JSON only: " +
    '{"swap_pass": boolean, "swap_reason": string, "grounded_pass": boolean, "grounded_reason": string, ' +
    '"platform_pass": boolean, "platform_reason": string}. ' +
    "SWAP TEST: fail if a direct competitor could ship this ad unchanged — generic praise, " +
    "interchangeable adjectives, no phrasing traceable to this brand's sources or beliefs. " +
    "GROUNDED TEST: fail if any factual claim, quote, or specific in the ad cannot be traced to " +
    "the numbered sources or the brand beliefs. Vague superlatives count as ungrounded. " +
    "PLATFORM TEST: fail if the ad violates the platform practices provided (wrong register for the " +
    "community, formula the evidence says fails, character limits exceeded, style caution ignored).";
  const user = [
    `AD:\nHeadline: ${input.copy.headline}\nBody: ${input.copy.body}\nCTA: ${input.copy.cta}`,
    `BRAND BELIEFS:\n${input.beliefs}`,
    `PRODUCT:\n${input.productDescription}`,
    `PLATFORM PRACTICES:\n${input.platformRules}`,
    input.styleCaution ? `STYLE CAUTION:\n${input.styleCaution}` : "",
    `SOURCES:\n${sourcesBlock(input.sources)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  const j = await llmJson(system, user);
  if (!j) return null;
  return {
    swap: { pass: j.swap_pass === true, reason: firstString(j.swap_reason) || "" },
    groundedness: { pass: j.grounded_pass === true, reason: firstString(j.grounded_reason) || "" },
    platformFit: { pass: j.platform_pass === true, reason: firstString(j.platform_reason) || "" },
  };
}

export async function generateAuthenticCopy(input: {
  brand: string;
  platform: string;
  productDescription: string;
  beliefs: string;
  proofPoints: string;
  neverSay: string;
  sources: GroundedSource[];
  styleRecipe?: string;
  styleCaution?: string;
  playbookRules?: string;
  limits?: { headlineMax: number; bodyMax: number };
}): Promise<AuthenticCopy | null> {
  if (!process.env.LLM_API_KEY) return null;

  const headlineMax = input.limits?.headlineMax || 60;
  const bodyMax = input.limits?.bodyMax || 0;
  const system =
    "You write advertising copy that is strictly grounded in verbatim source material: real audience " +
    "comments, a creator's actual spoken words, and phrases proven to convert. Rules: " +
    "(1) Build the copy from the audience's own language — reuse their exact words and phrasing where natural. " +
    "(2) Every claim must trace to a numbered source or to the brand beliefs. No unbacked statistics, no generic " +
    "marketing adjectives (avoid words like innovative, seamless, game-changing, revolutionary). " +
    "(3) Never write anything listed under NEVER SAY. " +
    "(4) The result must be something only this brand could publish — if a competitor could run it unchanged, rewrite. " +
    "(5) Follow the PLATFORM PRACTICES and the STYLE RECIPE exactly — the style controls structure and delivery, " +
    "while the sources and beliefs control substance. " +
    'Return strict JSON only: {"headline": string, "body": string, "cta": string, ' +
    '"citations": number[], "echo_phrases": string[]} where citations are the source numbers you drew from ' +
    "and echo_phrases are the verbatim audience phrases you carried into the copy. " +
    `${headlineMax > 0 ? `Headline under ${headlineMax} characters. ` : "No headline needed (single-post format) — put the post text in body and leave headline empty. "}` +
    `${bodyMax > 0 ? `Body under ${bodyMax} characters. ` : "Body two or three sentences. "}` +
    "CTA under 24 characters. No hyphens or dashes.";

  const baseUser = [
    `Brand: ${input.brand}`,
    `Target platform: ${input.platform}`,
    `Product: ${input.productDescription}`,
    input.playbookRules ? `PLATFORM PRACTICES (evidence-backed):\n${input.playbookRules}` : "",
    input.styleRecipe ? `STYLE RECIPE (structure to follow):\n${input.styleRecipe}` : "",
    input.styleCaution ? `STYLE CAUTION:\n${input.styleCaution}` : "",
    `BRAND BELIEFS (specific positions this brand holds):\n${input.beliefs}`,
    input.proofPoints ? `PROOF (decisions/facts that back the beliefs):\n${input.proofPoints}` : "",
    input.neverSay ? `NEVER SAY:\n${input.neverSay}` : "",
    `SOURCES (verbatim, numbered):\n${sourcesBlock(input.sources)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  let feedback = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const j = await llmJson(
      system,
      feedback ? `${baseUser}\n\nPREVIOUS ATTEMPT FAILED REVIEW:\n${feedback}\nRewrite to fix this.` : baseUser,
    );
    if (!j) return null;
    const copy: AdCopy = {
      headline: firstString(j.headline),
      body: firstString(j.body),
      cta: firstString(j.cta),
    };
    if (!copy.headline && !copy.body) return null;
    const citations = Array.isArray(j.citations)
      ? j.citations.filter((n): n is number => typeof n === "number")
      : [];
    const echoPhrases = Array.isArray(j.echo_phrases)
      ? j.echo_phrases.filter((s): s is string => typeof s === "string").slice(0, 8)
      : [];

    const gates = await judgeCopy({
      copy,
      sources: input.sources,
      beliefs: input.beliefs,
      productDescription: input.productDescription,
      platformRules: input.playbookRules ?? "",
      styleCaution: input.styleCaution ?? "",
    });
    // If the judge itself is unavailable, fail closed with an explicit reason
    // rather than shipping unreviewed copy.
    if (!gates) {
      return {
        copy,
        citations,
        echoPhrases,
        gates: {
          swap: { pass: false, reason: "Review unavailable" },
          groundedness: { pass: false, reason: "Review unavailable" },
          platformFit: { pass: false, reason: "Review unavailable" },
        },
        attempts: attempt,
      };
    }
    // Hard character-limit check is programmatic, not judged.
    if (input.limits) {
      if (input.limits.headlineMax > 0 && copy.headline.length > input.limits.headlineMax) {
        gates.platformFit = {
          pass: false,
          reason: `Headline over the ${input.limits.headlineMax}-character platform limit`,
        };
      }
      if (input.limits.bodyMax > 0 && copy.body.length > input.limits.bodyMax) {
        gates.platformFit = {
          pass: false,
          reason: `Body over the ${input.limits.bodyMax}-character platform limit`,
        };
      }
    }
    if (gates.swap.pass && gates.groundedness.pass && gates.platformFit.pass) {
      return { copy, citations, echoPhrases, gates, attempts: attempt };
    }
    feedback = [
      !gates.swap.pass ? `Swap test failed: ${gates.swap.reason}` : "",
      !gates.groundedness.pass ? `Groundedness failed: ${gates.groundedness.reason}` : "",
      !gates.platformFit.pass ? `Platform fit failed: ${gates.platformFit.reason}` : "",
    ]
      .filter(Boolean)
      .join(" ");
    if (attempt === 2) return { copy, citations, echoPhrases, gates, attempts: attempt };
  }
  return null;
}

// ── Imagery through the image API (fal.ai style) then Storage upload ─────────

export async function generateImage(input: {
  organizationId: string;
  adId: string;
  prompt: string;
}): Promise<{ path: string } | null> {
  const key = process.env.IMAGE_API_KEY;
  if (!key) return null;
  const base = process.env.IMAGE_API_BASE ?? "https://fal.run";
  const model = process.env.IMAGE_MODEL ?? "fal-ai/flux/schnell";

  try {
    const res = await fetch(`${base}/${model}`, {
      method: "POST",
      headers: { Authorization: `Key ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input.prompt, image_size: "square_hd", num_images: 1 }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      images?: Array<{ url?: string; content_type?: string }>;
    };
    const imageUrl = data.images?.[0]?.url;
    if (!imageUrl) return null;

    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;
    const contentType = imgRes.headers.get("content-type") ?? data.images?.[0]?.content_type ?? "image/png";
    const bytes = new Uint8Array(await imgRes.arrayBuffer());
    const ext = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
    const path = `${input.organizationId}/${input.adId}.${ext}`;

    const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, bytes, {
      contentType,
      upsert: true,
    });
    if (error) return null;
    return { path };
  } catch {
    return null;
  }
}

export async function signedImageUrl(path: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUrl(path, 3600);
    if (error) return null;
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
