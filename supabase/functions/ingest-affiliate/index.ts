// Supabase Edge Function: ingest-affiliate
// Server to server conversion postbacks from affiliate networks. Verifies a
// shared secret, resolves the organization and link from our slug (subid) or
// the first party click reference, and stores an idempotent event. Attribution
// is last click within thirty days. Deploy without JWT verification; the shared
// secret is the gate.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PROVIDERS = ["impact", "partnerstack", "rakuten", "cj", "amazon", "generic"];
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const num = (v: unknown): number => {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const secret = Deno.env.get("AFFILIATE_POSTBACK_SECRET");
  const url = new URL(req.url);
  const provided = req.headers.get("x-postback-secret") ?? url.searchParams.get("secret") ?? "";
  if (!secret || provided !== secret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "Not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const externalId = typeof body.external_id === "string" ? body.external_id : "";
  if (!externalId) {
    return new Response(JSON.stringify({ error: "external_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const provider = PROVIDERS.includes(String(body.provider)) ? String(body.provider) : "generic";
  const type = body.type === "click" ? "click" : "conversion";
  const occurredAt = typeof body.occurred_at === "string" ? body.occurred_at : new Date().toISOString();
  const currency = (typeof body.currency === "string" && body.currency.length === 3
    ? body.currency
    : "USD"
  ).toUpperCase();
  const revenueMinor = Math.round(num(body.revenue) * 100);

  // Resolve organization and link. Prefer our slug, then the click reference.
  let organizationId: string | null = null;
  let linkId: string | null = null;

  const slug = typeof body.slug === "string" ? body.slug : "";
  const clickRef = typeof body.click_ref === "string" ? body.click_ref : "";

  if (slug) {
    const { data: link } = await supabase
      .from("affiliate_links")
      .select("id, organization_id")
      .eq("slug", slug)
      .maybeSingle();
    if (link) {
      organizationId = link.organization_id;
      linkId = link.id;
    }
  }
  if (!organizationId && clickRef) {
    const { data: click } = await supabase
      .from("affiliate_events")
      .select("organization_id, link_id, occurred_at")
      .eq("click_ref", clickRef)
      .eq("type", "click")
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (click) {
      organizationId = click.organization_id;
      // Last click within thirty days keeps the link attribution; older clicks
      // still count for the organization but drop the link association.
      const within = Date.now() - new Date(click.occurred_at).getTime() <= THIRTY_DAYS_MS;
      linkId = within ? click.link_id : null;
    }
  }

  if (!organizationId) {
    return new Response(
      JSON.stringify({ error: "Could not resolve organization from slug or click_ref" }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );
  }

  const { error } = await supabase.from("affiliate_events").upsert(
    {
      organization_id: organizationId,
      link_id: linkId,
      provider,
      type,
      external_id: externalId,
      click_ref: clickRef || null,
      revenue_minor: revenueMinor,
      currency,
      occurred_at: occurredAt,
      metadata: (body.metadata as Record<string, unknown>) ?? {},
    },
    { onConflict: "organization_id,provider,external_id", ignoreDuplicates: false },
  );
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  await supabase.rpc("recompute_affiliate_daily", { p_org: organizationId });

  return new Response(JSON.stringify({ ok: true, attributed: linkId !== null }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
