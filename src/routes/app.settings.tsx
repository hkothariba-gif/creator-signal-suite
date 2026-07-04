import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app/AppShell";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type OrgRole } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { DataGate, useConnectorStatus, WAITING_COPY } from "@/components/app/DataGate";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

type TabId = "profile" | "team" | "connectors" | "billing";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "team", label: "Team" },
  { id: "connectors", label: "Connectors" },
  { id: "billing", label: "Billing" },
];

function SettingsPage() {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <AppShell title="Settings">
      <div className="max-w-4xl">
        <div className="flex gap-6 border-b border-white/[0.07] mb-8">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="pb-3 text-sm font-medium transition-colors"
                style={{
                  color: active ? "#00D97E" : "#8892A4",
                  borderBottom: active ? "2px solid #00D97E" : "2px solid transparent",
                  marginBottom: "-1px",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "profile" && <ProfileTab />}
        {tab === "team" && <TeamTab />}
        {tab === "connectors" && <ConnectorsTab />}
        {tab === "billing" && <BillingTab />}
      </div>
    </AppShell>
  );
}

/* ---------- Profile (stored in Supabase, not localStorage) ---------- */

function ProfileTab() {
  const { user, update, canEdit } = useAuth();
  const [companyName, setCompanyName] = useState(user?.company_name ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCompanyName(user?.company_name ?? "");
  }, [user?.company_name]);

  const save = async () => {
    setSaving(true);
    const { error } = await update({ company_name: companyName });
    setSaving(false);
    if (error) toast.error(`Could not save: ${error}`);
    else toast.success("Saved", { duration: 2000 });
  };

  return (
    <Card className="p-6 space-y-5">
      <Field label="Company name">
        <TextInput value={companyName} onChange={setCompanyName} placeholder="Acme Inc." />
      </Field>
      <Field label="Account email">
        <div className="text-sm text-[#F0F4FF]">{user?.email}</div>
      </Field>
      <Field label="Account type">
        <div className="text-sm text-[#F0F4FF] capitalize">{user?.accountType}</div>
      </Field>
      <Field label="Your role">
        <div className="text-sm text-[#F0F4FF] capitalize">{user?.role ?? "No organization yet"}</div>
      </Field>
      {canEdit ? (
        <div>
          <PrimaryButton onClick={save} disabled={saving}>
            {saving ? "Saving" : "Save changes"}
          </PrimaryButton>
        </div>
      ) : (
        <p className="text-xs text-[#8892A4]">Reviewers have read only access. Ask an admin to change profile details.</p>
      )}
    </Card>
  );
}

/* ---------- Team ---------- */

type MemberRow = {
  id: string;
  user_id: string;
  role: OrgRole;
  email: string;
  created_at: string;
};

type InviteRow = {
  id: string;
  email: string;
  role: OrgRole;
  status: string;
  created_at: string;
  expires_at: string;
};

const ROLE_OPTIONS: OrgRole[] = ["admin", "editor", "reviewer"];

function TeamTab() {
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
    const { error } = await supabase.from("organization_members").update({ role }).eq("id", memberId);
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
    const { error } = await supabase.from("invitations").update({ status: "revoked" }).eq("id", inviteId);
    if (error) toast.error(`Could not revoke: ${error.message}`);
    else refetchAll();
  };

  if (!orgId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-[#8892A4]">
          Finish onboarding to create your organization, then invite teammates here.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Card className="p-6">
          <h3 className="font-semibold text-[#F0F4FF] mb-1">Invite a teammate</h3>
          <p className="text-xs text-[#8892A4] mb-4">
            Admins manage the team. Editors can change campaigns and ads. Reviewers can view everything but cannot make changes.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <TextInput value={inviteEmail} onChange={setInviteEmail} placeholder="teammate@company.com" type="email" />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OrgRole)}
              className="rounded-lg px-3 py-2.5 text-sm text-white outline-none"
              style={{ background: "#131D2E", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <PrimaryButton onClick={sendInvite} disabled={inviting || !inviteEmail.trim()}>
              {inviting ? "Sending" : "Send invite"}
            </PrimaryButton>
          </div>
          {lastInviteLink && (
            <div className="mt-3 text-xs text-[#8892A4] break-all">
              Email delivery is not configured. Share this link directly:{" "}
              <span className="text-[#00D97E]">{lastInviteLink}</span>
            </div>
          )}
        </Card>
      )}

      <Card className="p-6">
        <h3 className="font-semibold text-[#F0F4FF] mb-4">Members</h3>
        {membersQuery.isLoading ? (
          <p className="text-sm text-[#8892A4]">Loading</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {(membersQuery.data ?? []).map((m) => (
              <li key={m.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-[#F0F4FF] truncate">{m.email}</span>
                {isAdmin && m.user_id !== user?.id ? (
                  <span className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => changeRole(m.id, e.target.value as OrgRole)}
                      className="rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                      style={{ background: "#131D2E", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => removeMember(m.id)} className="text-xs text-[#8892A4] hover:text-white">
                      Remove
                    </button>
                  </span>
                ) : (
                  <span className="text-xs text-[#8892A4] capitalize">{m.role}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {isAdmin && (
        <Card className="p-6">
          <h3 className="font-semibold text-[#F0F4FF] mb-4">Pending invitations</h3>
          {(invitesQuery.data ?? []).length === 0 ? (
            <p className="text-sm text-[#8892A4]">No pending invitations.</p>
          ) : (
            <ul className="divide-y divide-white/[0.05]">
              {(invitesQuery.data ?? []).map((i) => (
                <li key={i.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-[#F0F4FF] truncate">{i.email}</span>
                  <span className="text-xs text-[#8892A4] capitalize">{i.role}</span>
                  <button onClick={() => revokeInvite(i.id)} className="text-xs text-[#8892A4] hover:text-white">
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

/* ---------- Connectors ---------- */
// Keys live as environment variables on the server or in Supabase Edge
// Function secrets. The browser only ever sees booleans.

const CONNECTOR_ROWS: { key: string; label: string; desc: string }[] = [
  { key: "listening", label: "Social listening", desc: "Chatter and sentiment across the web" },
  { key: "creatorPerformance", label: "Creator performance", desc: "How content performs for creators in your space" },
  { key: "youtube", label: "YouTube Data API", desc: "Video stats and comments" },
  { key: "x", label: "X API", desc: "Posts and search" },
  { key: "reddit", label: "Reddit Data API", desc: "Posts and comments" },
  { key: "trends", label: "Trends", desc: "Search interest over time" },
  { key: "llm", label: "Ad copy model", desc: "Generates ad copy from ranked hooks" },
  { key: "image", label: "Ad imagery", desc: "Generates ad images" },
  { key: "email", label: "Team invite email", desc: "Delivers invitation emails" },
  { key: "adsMiddleware", label: "Ads middleware", desc: "Publishes paid campaigns to Reddit, X, and YouTube" },
  { key: "stripe", label: "Stripe", desc: "Brand billing" },
  { key: "paypal", label: "PayPal Payouts", desc: "Affiliate cash out" },
  { key: "identity", label: "Identity and tax", desc: "Verification before payout" },
];

function ConnectorsTab() {
  const status = useConnectorStatus();
  const platform = status.data?.platform as Record<string, boolean> | undefined;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <p className="text-sm text-[#8892A4]">
          Integration keys are configured on the server by the platform team. They are never stored in the browser.
          Panels that depend on an integration show {'"'}
          {WAITING_COPY}
          {'"'} until it is configured.
        </p>
      </Card>
      {status.isLoading ? (
        <Card className="p-6">
          <p className="text-sm text-[#8892A4]">Loading</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CONNECTOR_ROWS.map((row) => {
            const connected = platform?.[row.key] === true;
            return (
              <Card key={row.key} className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-[#F0F4FF]">{row.label}</div>
                  <StatusBadge connected={connected} />
                </div>
                <div className="text-sm text-[#8892A4] mt-1">{row.desc}</div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  if (connected) {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md"
        style={{ background: "rgba(0,217,126,0.12)", color: "#00D97E" }}
      >
        <Check size={12} /> Configured
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center text-xs font-medium px-2 py-1 rounded-md"
      style={{ background: "rgba(136,146,164,0.12)", color: "#8892A4" }}
    >
      Not configured
    </span>
  );
}

/* ---------- Billing ---------- */
// Billing arrives with the payouts phase. Until Stripe is configured and the
// organization has connected billing, this surface waits.

function BillingTab() {
  const status = useConnectorStatus();
  const connected = status.data ? status.data.platform.stripe && status.data.account.billing : undefined;

  return (
    <DataGate connected={connected} loading={status.isLoading} label="Stripe billing">
      <Card className="p-6">
        <p className="text-sm text-[#8892A4]">Billing details will appear here.</p>
      </Card>
    </DataGate>
  );
}

/* ---------- Shared UI ---------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm text-[#8892A4] mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none"
      style={{ background: "#131D2E", border: "1px solid rgba(255,255,255,0.1)" }}
    />
  );
}

function PrimaryButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-4 py-2.5 rounded-lg text-sm font-semibold text-black hover:opacity-90 transition-opacity disabled:opacity-50"
      style={{ background: "#00D97E" }}
    >
      {children}
    </button>
  );
}
