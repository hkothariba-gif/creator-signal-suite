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
