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
