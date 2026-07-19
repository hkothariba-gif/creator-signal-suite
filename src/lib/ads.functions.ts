import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { AdIntelligence } from "@/lib/intelligence";
import type { AdCopy } from "@/lib/ad-generation.server";

// Phase 1 server functions. External API keys stay on the server. Every write
// verifies the caller can edit the organization, so reviewers cannot mutate.
// Reads rely on row level security through the caller's own Supabase client.

async function assertCanEdit(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc("can_edit_org", { org: organizationId });
  if (error || data !== true) throw new Error("Forbidden: editor access required");
}

// ── Collect signals from live sources into the organization ──────────────────

export const collectSignals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { organizationId: string; query: string }) => data)
  .handler(async ({ data, context }): Promise<{ inserted: number; bySource: Record<string, number> }> => {
    const query = data.query?.trim();
    if (!data.organizationId || !query) throw new Error("organizationId and query are required");
    await assertCanEdit(context.supabase, data.organizationId);

    const { collectAllSignals } = await import("@/lib/signal-sources.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const raw = await collectAllSignals(query);
    const bySource: Record<string, number> = {};
    for (const r of raw) bySource[r.source] = (bySource[r.source] ?? 0) + 1;
    if (raw.length === 0) return { inserted: 0, bySource };

    const rows = raw.map((r) => ({ ...r, organization_id: data.organizationId }));
    const { data: upserted, error } = await supabaseAdmin
      .from("signals")
      .upsert(rows, { onConflict: "organization_id,source,external_id", ignoreDuplicates: false })
      .select("id");
    if (error) throw new Error(error.message);
    return { inserted: upserted?.length ?? 0, bySource };
  });

// ── Rank hooks, phrases, and themes from stored signals ──────────────────────

export const getAdIntelligence = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { organizationId: string }) => data)
  .handler(async ({ data, context }): Promise<AdIntelligence> => {
    if (!data.organizationId) throw new Error("organizationId is required");
    // RLS scopes this select to organizations the caller belongs to.
    const { data: signals, error } = await context.supabase
      .from("signals")
      .select("source,title,content,sentiment,metrics")
      .eq("organization_id", data.organizationId)
      .order("collected_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    // Affiliate angles: links that actually converted feed generation as the
    // "informed by affiliate performance" input. RLS scopes both reads.
    const [{ data: daily }, { data: links }] = await Promise.all([
      context.supabase
        .from("affiliate_daily")
        .select("link_id,conversions,revenue_minor")
        .eq("organization_id", data.organizationId),
      context.supabase
        .from("affiliate_links")
        .select("id,slug,label")
        .eq("organization_id", data.organizationId),
    ]);
    const labelOf = new Map((links ?? []).map((l) => [l.id, l.label || l.slug]));
    const perLink = new Map<string, { conversions: number; revenueMinor: number }>();
    for (const row of daily ?? []) {
      if (!row.link_id) continue;
      const acc = perLink.get(row.link_id) ?? { conversions: 0, revenueMinor: 0 };
      acc.conversions += Number(row.conversions);
      acc.revenueMinor += Number(row.revenue_minor);
      perLink.set(row.link_id, acc);
    }
    const affiliateAngles = [...perLink.entries()]
      .filter(([, v]) => v.conversions > 0)
      .map(([id, v]) => ({
        text: (labelOf.get(id) ?? "Affiliate link") as string,
        conversions: v.conversions,
        revenueMinor: v.revenueMinor,
      }));

    const { buildIntelligence } = await import("@/lib/intelligence");
    return buildIntelligence(
      (signals ?? []).map((s) => ({
        source: s.source as string,
        title: s.title,
        content: s.content,
        sentiment: s.sentiment,
        metrics: (s.metrics ?? {}) as Record<string, number>,
      })),
      affiliateAngles,
    );
  });

// ── Generate ad copy through the LLM API ─────────────────────────────────────

export const generateAdCopy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      organizationId: string;
      brand: string;
      brief: string;
      tone: string;
      platform: string;
      themes: string[];
      hooks: string[];
    }) => data,
  )
  .handler(async ({ data, context }): Promise<AdCopy> => {
    if (!data.organizationId || !data.brief?.trim()) {
      throw new Error("organizationId and brief are required");
    }
    await assertCanEdit(context.supabase, data.organizationId);
    const { generateCopy } = await import("@/lib/ad-generation.server");
    const copy = await generateCopy({
      brand: data.brand || "the brand",
      brief: data.brief,
      tone: data.tone || "confident",
      platform: data.platform || "reddit",
      themes: data.themes ?? [],
      hooks: data.hooks ?? [],
    });
    if (!copy) throw new Error("Copy generation is not configured or returned nothing");
    return copy;
  });

// ── Phase 5A: authentic (grounded) ad generation ─────────────────────────────

export type AuthenticAdResult = {
  adId: string;
  headline: string;
  body: string;
  cta: string;
  passed: boolean;
  gates: {
    swap: { pass: boolean; reason: string };
    groundedness: { pass: boolean; reason: string };
    platformFit: { pass: boolean; reason: string };
  };
  sourcesUsed: Array<{ kind: string; author: string | null; quote: string }>;
  styleId: string | null;
};

export const generateAuthenticAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      organizationId: string;
      campaignId: string;
      platform: string;
      brand: string;
      styleId?: string;
    }) => data,
  )
  .handler(async ({ data, context }): Promise<AuthenticAdResult> => {
    if (!data.organizationId || !data.campaignId) {
      throw new Error("organizationId and campaignId are required");
    }
    await assertCanEdit(context.supabase, data.organizationId);
    if (!process.env.LLM_API_KEY) throw new Error("Connect the LLM key to generate ads");

    const { data: campaign, error } = await context.supabase
      .from("campaigns")
      .select("id,name,product_description,brand_beliefs,proof_points,never_say")
      .eq("id", data.campaignId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!campaign) throw new Error("Campaign not found");
    if (!campaign.brand_beliefs?.trim()) {
      throw new Error(
        "Write the campaign belief doc first — beliefs are what make the copy impossible to swap",
      );
    }

    // The grounding corpus: strongest audience comments, spoken-word excerpts,
    // and everything that actually converted.
    const { data: corpus, error: cErr } = await context.supabase
      .from("ad_corpus")
      .select("id,kind,author,content,metrics")
      .eq("campaign_id", data.campaignId);
    if (cErr) throw new Error(cErr.message);
    const rows = corpus ?? [];
    if (rows.length < 3) {
      throw new Error("Collect the grounding corpus first (need at least 3 real quotes)");
    }
    const score = (m: unknown) => {
      const mm = (m ?? {}) as Record<string, number>;
      return Number(mm.likes ?? 0) + Number(mm.ups ?? 0) + Number(mm.conversions ?? 0) * 10;
    };
    const pick = [
      ...rows
        .filter((r) => r.kind === "comment")
        .sort((a, b) => score(b.metrics) - score(a.metrics))
        .slice(0, 12),
      ...rows.filter((r) => r.kind === "transcript").slice(0, 4),
      ...rows.filter((r) => r.kind === "conversion_phrase").slice(0, 4),
      ...rows.filter((r) => r.kind === "brand_doc").slice(0, 4),
    ];
    const sources = pick.map((r, i) => ({
      ref: i + 1,
      id: r.id as string,
      kind: r.kind as string,
      author: r.author as string | null,
      content: r.content as string,
    }));

    const { generateAuthenticCopy } = await import("@/lib/ad-generation.server");
    const { getPlaybook, getStyle } = await import("@/lib/ad-playbooks");
    const playbook = getPlaybook(data.platform || "reddit");
    const style = data.styleId ? getStyle(data.styleId) : undefined;
    const result = await generateAuthenticCopy({
      brand: data.brand || "the brand",
      platform: data.platform || "reddit",
      productDescription: campaign.product_description ?? campaign.name,
      beliefs: campaign.brand_beliefs,
      proofPoints: campaign.proof_points ?? "",
      neverSay: campaign.never_say ?? "",
      sources,
      styleRecipe: style ? `${style.label}: ${style.recipe}` : undefined,
      styleCaution: style?.caution,
      playbookRules: [
        `Audience mindset: ${playbook.audienceMindset}`,
        `Do: ${playbook.rules.join("; ")}`,
        `Avoid: ${playbook.avoid.join("; ")}`,
        playbook.benchmarks,
      ].join("\n"),
      limits: playbook.limits,
    });
    if (!result) throw new Error("Generation is not configured or returned nothing");

    const cited = sources.filter((s) => result.citations.includes(s.ref));
    const sourcesUsed = (cited.length ? cited : sources.slice(0, 5)).map((s) => ({
      kind: s.kind,
      author: s.author,
      quote: s.content.slice(0, 200),
    }));
    const passed =
      result.gates.swap.pass && result.gates.groundedness.pass && result.gates.platformFit.pass;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: ad, error: insErr } = await supabaseAdmin
      .from("ads")
      .insert({
        organization_id: data.organizationId,
        campaign_id: data.campaignId,
        name: result.copy.headline ? result.copy.headline.slice(0, 60) : "Authentic ad",
        headline: result.copy.headline,
        body: result.copy.body,
        cta: result.copy.cta,
        target_platform: data.platform,
        informed_by_affiliate: cited.some((s) => s.kind === "conversion_phrase"),
        status: "draft",
        insights: { echo_phrases: result.echoPhrases },
        provenance: {
          mode: "authentic",
          corpus: (cited.length ? cited : sources.slice(0, 5)).map((s) => ({
            id: s.id,
            kind: s.kind,
            author: s.author,
            quote: s.content.slice(0, 200),
          })),
          gates: result.gates,
          attempts: result.attempts,
          beliefs_used: true,
          style: style?.id ?? null,
          playbook: playbook.platform,
        },
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (insErr) throw new Error(insErr.message);

    return {
      adId: ad.id,
      headline: result.copy.headline,
      body: result.copy.body,
      cta: result.copy.cta,
      passed,
      gates: result.gates,
      sourcesUsed,
      styleId: style?.id ?? null,
    };
  });

// ── Generate ad imagery, store it, attach it to an existing ad ───────────────

export const generateAdImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { organizationId: string; adId: string; prompt: string }) => data)
  .handler(async ({ data, context }): Promise<{ path: string; url: string | null }> => {
    if (!data.organizationId || !data.adId || !data.prompt?.trim()) {
      throw new Error("organizationId, adId, and prompt are required");
    }
    await assertCanEdit(context.supabase, data.organizationId);

    const { generateImage, signedImageUrl } = await import("@/lib/ad-generation.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const result = await generateImage({
      organizationId: data.organizationId,
      adId: data.adId,
      prompt: data.prompt.trim(),
    });
    if (!result) throw new Error("Image generation is not configured or returned nothing");

    const { error } = await supabaseAdmin
      .from("ads")
      .update({ image_path: result.path, image_prompt: data.prompt.trim() })
      .eq("id", data.adId)
      .eq("organization_id", data.organizationId);
    if (error) throw new Error(error.message);

    const url = await signedImageUrl(result.path);
    return { path: result.path, url };
  });
