import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Organization creation runs server side with the service role. The client
// side insert kept failing with an RLS violation whenever the live database
// drifted from the migrations (Lovable security passes have altered policies
// and grants out of band before), which left users onboarded without an
// organization. The service role bypasses that drift entirely. Every failure
// throws; nothing here fakes success.

export type BrandProfileJson = {
  category: string | null;
  age: string | null;
  gender: string | null;
  income: string | null;
  notes: string | null;
  platforms: string[];
};

export type EnsuredOrganization = {
  id: string;
  name: string;
  role: "admin" | "editor" | "reviewer";
};

export const ensureOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { name?: string; brand?: BrandProfileJson }) => data)
  .handler(async ({ data, context }): Promise<EnsuredOrganization> => {
    const userId = context.userId as string;
    if (!userId) throw new Error("Unauthorized: no user id");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const earliestMembership = async () => {
      const { data: row, error } = await supabaseAdmin
        .from("organization_members")
        .select("role, organization_id, organizations(id, name)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw new Error(`Could not read memberships: ${error.message}`);
      return row;
    };

    // Existing membership wins. A query error must not fall through to org
    // creation or every hiccup would mint a duplicate organization.
    const existing = await earliestMembership();
    if (existing) {
      const org = existing.organizations as { id: string; name: string } | null;
      const orgId = org?.id ?? existing.organization_id;
      if (data.brand && (existing.role === "admin" || existing.role === "editor")) {
        const { error } = await supabaseAdmin
          .from("organizations")
          .update({ brand_profile: data.brand })
          .eq("id", orgId);
        if (error) throw new Error(`Could not save brand profile: ${error.message}`);
      }
      return { id: orgId, name: org?.name ?? "", role: existing.role };
    }

    const orgName =
      data.name?.trim() || (context.claims?.email as string | undefined) || "My organization";
    const { data: created, error: createError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: orgName,
        created_by: userId,
        ...(data.brand ? { brand_profile: data.brand } : {}),
      })
      .select("id, name")
      .single();
    if (createError || !created) {
      throw new Error(`Could not create organization: ${createError?.message ?? "unknown error"}`);
    }

    // The AFTER INSERT trigger normally adds the creator as admin. Upsert so
    // this also holds if the trigger has drifted away on the live database.
    const { error: memberError } = await supabaseAdmin
      .from("organization_members")
      .upsert(
        { organization_id: created.id, user_id: userId, role: "admin" },
        { onConflict: "organization_id,user_id" },
      );
    if (memberError) {
      // Remove the just created org so retries do not accumulate orphans.
      await supabaseAdmin
        .from("organizations")
        .delete()
        .eq("id", created.id)
        .eq("created_by", userId);
      throw new Error(`Could not add you to the organization: ${memberError.message}`);
    }

    // Concurrent double submit safety: if another call created an earlier
    // organization for this user, adopt that one and remove ours.
    const winner = await earliestMembership();
    if (winner && winner.organization_id !== created.id) {
      await supabaseAdmin
        .from("organizations")
        .delete()
        .eq("id", created.id)
        .eq("created_by", userId);
      const org = winner.organizations as { id: string; name: string } | null;
      return {
        id: winner.organization_id,
        name: org?.name ?? "",
        role: winner.role,
      };
    }

    return { id: created.id, name: created.name, role: "admin" };
  });
