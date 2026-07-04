// Supabase Edge Function: invite-member
// An organization admin invites a teammate by email with a chosen role.
// Runs on the service role. Sends the invite email through the email
// provider when EMAIL_API_KEY is configured; otherwise returns the invite
// link for manual sharing.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_ROLES = new Set(["admin", "editor", "reviewer"]);

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

  // Identify the caller from the JWT.
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Unauthorized" }, 401);
  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const caller = userData.user;

  let body: { organizationId?: string; email?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const organizationId = body.organizationId?.trim();
  const email = body.email?.trim().toLowerCase();
  const role = body.role?.trim();
  if (!organizationId || !email || !role) {
    return json({ error: "organizationId, email, and role are required" }, 400);
  }
  if (!VALID_ROLES.has(role)) return json({ error: "Role must be admin, editor, or reviewer" }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Invalid email" }, 400);

  // Caller must be an admin of the organization.
  const { data: membership } = await admin
    .from("organization_members")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", caller.id)
    .maybeSingle();
  if (membership?.role !== "admin") return json({ error: "Only organization admins can invite" }, 403);

  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

  // Revoke any prior pending invitation for the same address.
  await admin
    .from("invitations")
    .update({ status: "revoked" })
    .eq("organization_id", organizationId)
    .eq("email", email)
    .eq("status", "pending");

  const { data: invitation, error: inviteError } = await admin
    .from("invitations")
    .insert({ organization_id: organizationId, email, role, invited_by: caller.id })
    .select("id, token, expires_at")
    .single();
  if (inviteError || !invitation) {
    return json({ error: inviteError?.message ?? "Could not create invitation" }, 500);
  }

  const origin = Deno.env.get("APP_ORIGIN") ?? req.headers.get("origin") ?? "";
  const inviteUrl = `${origin}/invite/${invitation.token}`;

  let emailSent = false;
  const emailKey = Deno.env.get("EMAIL_API_KEY");
  if (emailKey) {
    const from = Deno.env.get("EMAIL_FROM") ?? "AspenReach <invites@aspenreach.app>";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${emailKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [email],
        subject: `You are invited to ${org?.name ?? "an AspenReach workspace"}`,
        html: `<p>You have been invited to join <strong>${org?.name ?? "a workspace"}</strong> on AspenReach as ${role}.</p><p><a href="${inviteUrl}">Accept the invitation</a></p><p>This invitation expires on ${new Date(invitation.expires_at).toUTCString()}.</p>`,
      }),
    });
    emailSent = res.ok;
  }

  return json({ ok: true, invitationId: invitation.id, inviteUrl, emailSent });
});
