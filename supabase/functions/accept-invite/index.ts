// Supabase Edge Function: accept-invite
// Accepting an invitation runs on the service role. The signed in user's
// email must match the invitation. On success the user becomes a member of
// the organization with the invited role.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const caller = userData.user;

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }
  const inviteToken = body.token?.trim();
  if (!inviteToken) return json({ error: "token is required" }, 400);

  const { data: invitation } = await admin
    .from("invitations")
    .select("id, organization_id, email, role, status, expires_at")
    .eq("token", inviteToken)
    .maybeSingle();
  if (!invitation) return json({ error: "Invitation not found" }, 404);
  if (invitation.status !== "pending") return json({ error: "Invitation is no longer active" }, 410);

  if (new Date(invitation.expires_at).getTime() < Date.now()) {
    await admin.from("invitations").update({ status: "expired" }).eq("id", invitation.id);
    return json({ error: "Invitation has expired" }, 410);
  }

  const callerEmail = (caller.email ?? "").toLowerCase();
  if (callerEmail !== invitation.email.toLowerCase()) {
    return json({ error: "This invitation was sent to a different email address" }, 403);
  }

  const { error: memberError } = await admin
    .from("organization_members")
    .upsert(
      { organization_id: invitation.organization_id, user_id: caller.id, role: invitation.role },
      { onConflict: "organization_id,user_id" },
    );
  if (memberError) return json({ error: memberError.message }, 500);

  await admin.from("invitations").update({ status: "accepted" }).eq("id", invitation.id);

  const { data: org } = await admin
    .from("organizations")
    .select("id, name")
    .eq("id", invitation.organization_id)
    .single();

  return json({ ok: true, organization: org, role: invitation.role });
});
