// Supabase Edge Function: r
// First party affiliate redirect. Serves /functions/v1/r/<slug>, records a
// click with the service role, then forwards to the link destination with a
// click reference appended so the network can echo it back on conversion.
// Deploy without JWT verification so anyone following the link reaches it.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  const slug = last && last !== "r" ? last : (url.searchParams.get("s") ?? "");

  const notFound = () =>
    new Response("Link not found", { status: 404, headers: { "Content-Type": "text/plain" } });

  if (!slug) return notFound();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response("Not configured", { status: 500 });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: link } = await supabase
    .from("affiliate_links")
    .select("id, organization_id, destination_url")
    .eq("slug", slug)
    .maybeSingle();
  if (!link) return notFound();

  const clickRef = crypto.randomUUID();
  await supabase.from("affiliate_events").insert({
    organization_id: link.organization_id,
    link_id: link.id,
    provider: "generic",
    type: "click",
    external_id: clickRef,
    click_ref: clickRef,
    metadata: {
      ua: req.headers.get("user-agent") ?? null,
      referer: req.headers.get("referer") ?? null,
    },
  });
  await supabase.rpc("recompute_affiliate_daily", { p_org: link.organization_id });

  let destination: string;
  try {
    const dest = new URL(link.destination_url);
    dest.searchParams.set("aff_click", clickRef);
    destination = dest.toString();
  } catch {
    destination = link.destination_url;
  }

  return new Response(null, {
    status: 302,
    headers: { Location: destination, "Cache-Control": "no-store" },
  });
});
