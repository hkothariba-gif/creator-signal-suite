import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth, type OrgRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";

/* SETTINGS — the `v.isSettings` block of src/aspen/AspenApp.tsx, on the live
   hooks the dark version used. Shell, header and title come from the /app
   layout route.

   The design lays this out as one page — Workspace, Team, Billing — instead of
   the old four tabs, and connector status now lives on the Platforms screen, so
   the Connectors tab is gone from here entirely. */

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

const ROLE_OPTIONS: OrgRole[] = ["admin", "editor", "reviewer"];

type MemberRow = { id: string; user_id: string; role: OrgRole; email: string; created_at: string };
type InviteRow = {
  id: string;
  email: string;
  role: OrgRole;
  status: string;
  created_at: string;
  expires_at: string;
};

const FIELD =
  "w-full box-border h-[46px] p-[0_14px] rounded-[12px] border-[1.5px] border-border bg-cream text-[14.5px] outline-none";
const READONLY =
  "h-[46px] flex items-center p-[0_14px] rounded-[12px] bg-sand text-[14.5px] text-muted";

function SettingsPage() {
  return (
    <div className="aspen-scope max-w-[760px] flex flex-col gap-[16px]">
      <WorkspaceCard />
      <TeamCard />
      <BillingCard />
    </div>
  );
}

/* ---------- Workspace (stored in Supabase, not localStorage) ---------- */

function WorkspaceCard() {
  const { user, update, canEdit } = useAuth();
  const [companyName, setCompanyName] = useState(user?.company_name ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCompanyName(user?.company_name ?? "");
  }, [user?.company_name]);

  const dirty = companyName !== (user?.company_name ?? "");

  const save = async () => {
    setSaving(true);
    const { error } = await update({ company_name: companyName });
    setSaving(false);
    if (error) toast.error(`Could not save: ${error}`);
    else toast.success("Saved", { duration: 2000 });
  };

  return (
    <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[24px]">
      <h3 className="font-heading font-bold text-[17px] m-[0_0_18px]">Workspace</h3>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[16px]">
        <div>
          <div className="text-[11.5px] font-bold tracking-[0.1em] text-subtle mb-[7px]">
            COMPANY NAME
          </div>
          {canEdit ? (
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
              className={FIELD}
            />
          ) : (
            <div className={READONLY}>{companyName || "—"}</div>
          )}
        </div>
        <div>
          <div className="text-[11.5px] font-bold tracking-[0.1em] text-subtle mb-[7px]">
            ACCOUNT EMAIL
          </div>
          <div className={READONLY}>{user?.email}</div>
        </div>
        <div>
          <div className="text-[11.5px] font-bold tracking-[0.1em] text-subtle mb-[7px]">
            ACCOUNT TYPE
          </div>
          <div className={`${READONLY} capitalize`}>{user?.accountType}</div>
        </div>
        <div>
          <div className="text-[11.5px] font-bold tracking-[0.1em] text-subtle mb-[7px]">
            YOUR ROLE
          </div>
          <div className={`${READONLY} capitalize`}>{user?.role ?? "No organization yet"}</div>
        </div>
      </div>
      {canEdit ? (
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="mt-[18px] border-0 bg-accent text-cream text-[13.5px] font-bold p-[11px_17px] rounded-[11px] cursor-pointer ah21 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      ) : (
        <p className="text-[12.5px] text-subtle mt-[14px] m-0">
          Reviewers have read-only access. Ask an admin to change workspace details.
        </p>
      )}
    </div>
  );
}

/* ---------- Team ---------- */

function TeamCard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const orgId = user?.organization?.id;
  const isAdmin = user?.role === "admin";
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgRole>("editor");
  const [inviting, setInviting] = useState(false);
  const [lastInviteLink, setLastInviteLink] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: ["org-members", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<MemberRow[]> => {
      const { data: members, error } = await supabase
        .from("organization_members")
        .select("id, user_id, role, created_at")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: true });
      if (error) throw new Error(error.message);
      const ids = (members ?? []).map((m) => m.user_id);
      const { data: profiles } = ids.length
        ? await supabase.from("profiles").select("id, email").in("id", ids)
        : { data: [] as { id: string; email: string | null }[] };
      const emailById = new Map((profiles ?? []).map((p) => [p.id, p.email ?? ""]));
      return (members ?? []).map((m) => ({
        ...m,
        role: m.role as OrgRole,
        email: emailById.get(m.user_id) || m.user_id,
      }));
    },
  });

  const invitesQuery = useQuery({
    queryKey: ["org-invites", orgId],
    enabled: !!orgId && isAdmin,
    queryFn: async (): Promise<InviteRow[]> => {
      const { data, error } = await supabase
        .from("invitations")
        .select("id, email, role, status, created_at, expires_at")
        .eq("organization_id", orgId!)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as InviteRow[];
    },
  });

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ["org-members", orgId] });
    queryClient.invalidateQueries({ queryKey: ["org-invites", orgId] });
  };

  const sendInvite = async () => {
    if (!orgId || !inviteEmail.trim()) return;
    setInviting(true);
    const { data, error } = await supabase.functions.invoke("invite-member", {
      body: { organizationId: orgId, email: inviteEmail.trim(), role: inviteRole },
    });
    setInviting(false);
    if (error || data?.error) {
      toast.error(`Invite failed: ${error?.message ?? data?.error}`);
      return;
    }
    setInviteEmail("");
    setLastInviteLink(data?.emailSent ? null : (data?.inviteUrl ?? null));
    toast.success(data?.emailSent ? "Invitation email sent" : "Invitation created");
    refetchAll();
  };

  const changeRole = async (memberId: string, role: OrgRole) => {
    const { error } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("id", memberId);
    if (error) toast.error(`Could not change role: ${error.message}`);
    else {
      toast.success("Role updated");
      refetchAll();
    }
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase.from("organization_members").delete().eq("id", memberId);
    if (error) toast.error(`Could not remove member: ${error.message}`);
    else {
      toast.success("Member removed");
      refetchAll();
    }
  };

  const revokeInvite = async (inviteId: string) => {
    const { error } = await supabase
      .from("invitations")
      .update({ status: "revoked" })
      .eq("id", inviteId);
    if (error) toast.error(`Could not revoke: ${error.message}`);
    else refetchAll();
  };

  if (!orgId) {
    return (
      <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[24px]">
        <h3 className="font-heading font-bold text-[17px] m-[0_0_10px]">Team</h3>
        <p className="text-[14px] text-muted m-0">
          Finish onboarding to create your organization, then invite teammates here.
        </p>
      </div>
    );
  }

  const initials = (email: string) => email.slice(0, 2).toUpperCase();
  const members = membersQuery.data ?? [];
  const invites = invitesQuery.data ?? [];

  return (
    <div className="bg-surface border-[1.5px] border-border rounded-[20px] p-[24px]">
      <div className="flex items-center justify-between gap-[12px] mb-[16px] flex-wrap">
        <h3 className="font-heading font-bold text-[17px] m-0">Team</h3>
        {isAdmin ? (
          <div className="flex gap-[9px] flex-wrap">
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              type="email"
              placeholder="teammate@company.com"
              className="h-[42px] p-[0_13px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] outline-none"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrgRole)}
              className="h-[42px] p-[0_12px] rounded-[11px] border-[1.5px] border-border bg-cream text-[14px] capitalize"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <button
              onClick={sendInvite}
              disabled={inviting || !inviteEmail.trim()}
              className="border-0 bg-accent text-cream text-[13.5px] font-bold p-[0_17px] h-[42px] rounded-[11px] cursor-pointer ah44 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {inviting ? "Inviting…" : "Invite"}
            </button>
          </div>
        ) : null}
      </div>

      {isAdmin ? (
        <p className="text-[12.5px] text-subtle m-[0_0_14px]">
          Admins manage the team. Editors can change campaigns and ads. Reviewers can view
          everything but cannot make changes.
        </p>
      ) : null}

      {lastInviteLink ? (
        <div className="bg-tint rounded-[13px] p-[12px_15px] mb-[14px]">
          <div className="text-[12.5px] font-bold text-accent-ink">
            Invite email could not be sent — share this link
          </div>
          <div className="text-[12.5px] text-accent-ink-soft mt-[4px] break-all">
            {lastInviteLink}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col">
        {membersQuery.isLoading ? (
          <div className="text-[13.5px] text-subtle p-[13px_0]">Loading…</div>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-[14px] p-[13px_0] border-t-[1px] border-border-soft"
            >
              <div className="w-[32px] h-[32px] rounded-[10px] bg-highlight text-dark grid place-items-center font-extrabold text-[12px] shrink-0">
                {initials(m.email)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-bold truncate">{m.email}</div>
                <div className="text-[12.5px] text-subtle">
                  Joined {new Date(m.created_at).toLocaleDateString()}
                </div>
              </div>
              {isAdmin && m.user_id !== user?.id ? (
                <>
                  <select
                    value={m.role}
                    onChange={(e) => changeRole(m.id, e.target.value as OrgRole)}
                    className="h-[34px] p-[0_10px] rounded-[9px] border-[1.5px] border-border bg-cream text-[12.5px] capitalize"
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeMember(m.id)}
                    className="border-0 bg-transparent text-[12.5px] font-bold text-subtle cursor-pointer ah20"
                  >
                    Remove
                  </button>
                </>
              ) : (
                <span className="text-[12px] font-bold text-muted capitalize">{m.role}</span>
              )}
            </div>
          ))
        )}

        {invites.map((i) => (
          <div
            key={i.id}
            className="flex items-center gap-[14px] p-[13px_0] border-t-[1px] border-border-soft"
          >
            <div className="w-[32px] h-[32px] rounded-[10px] bg-sand text-subtle grid place-items-center font-extrabold text-[12px] shrink-0">
              ?
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-bold truncate">{i.email}</div>
              <div className="text-[12.5px] text-subtle">
                Invitation sent {new Date(i.created_at).toLocaleDateString()}
              </div>
            </div>
            <span className="text-[12px] font-bold text-subtle capitalize">{i.role} · pending</span>
            {isAdmin ? (
              <button
                onClick={() => revokeInvite(i.id)}
                className="border-0 bg-transparent text-[12.5px] font-bold text-subtle cursor-pointer ah20"
              >
                Revoke
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Billing ---------- */
// Billing arrives with the payouts phase. Until Stripe is configured and the
// organization has connected billing, this surface waits.

function BillingCard() {
  const status = useConnectorStatus();
  const connected = status.data
    ? status.data.platform.stripe && status.data.account.billing
    : undefined;

  return (
    <div className="bg-tint rounded-[20px] p-[24px]">
      <h3 className="font-heading font-bold text-[17px] m-0 text-accent-ink">Billing</h3>
      <DataGate connected={connected} loading={status.isLoading} label="Stripe billing">
        <p className="text-[14.5px] leading-[1.6] text-accent-ink-soft m-[10px_0_0]">
          You're on early-access pricing — locked for 12 months after launch. Nothing is charged
          until your cohort opens.
        </p>
      </DataGate>
    </div>
  );
}
