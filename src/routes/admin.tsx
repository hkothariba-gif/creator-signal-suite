import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, StatCard } from "@/components/app/AppShell";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

// The admin gate reads the real role from organization_members through
// useAuth. Row level security enforces the same rule at the database, so
// this client check is a convenience, not the boundary.
function AdminPage() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const orgId = user?.organization?.id;

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (user.role !== "admin") navigate({ to: "/app" });
  }, [user, loading, navigate]);

  const stats = useQuery({
    queryKey: ["admin-org-stats", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const [members, invites, projects] = await Promise.all([
        supabase
          .from("organization_members")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!),
        supabase
          .from("invitations")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!)
          .eq("status", "pending"),
        supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId!),
      ]);
      return {
        members: members.count ?? 0,
        pendingInvites: invites.count ?? 0,
        projects: projects.count ?? 0,
      };
    },
  });

  const connectors = useConnectorStatus();

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#05080F] text-[#F0F4FF]">
      <header className="h-[60px] bg-[#0C1222] border-b border-white/[0.07] px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold tracking-tight">
            Aspen<span className="text-[#00D97E]">Reach</span>
          </span>
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#7C3AED] text-white">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#8892A4]">{user.email}</span>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="flex items-center gap-1.5 text-xs text-[#8892A4] hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </header>

      <main className="p-8 max-w-[1400px] mx-auto">
        <h2 className="text-2xl font-bold mb-1">{user.organization?.name ?? "Organization"}</h2>
        <p className="text-[#8892A4] mb-6">Workspace overview</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="Team members" value={stats.data ? String(stats.data.members) : "…"} trend="" />
          <StatCard label="Pending invitations" value={stats.data ? String(stats.data.pendingInvites) : "…"} trend="" />
          <StatCard label="Projects" value={stats.data ? String(stats.data.projects) : "…"} trend="" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Integration status</h3>
            {connectors.isLoading ? (
              <p className="text-sm text-[#8892A4]">Loading</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {Object.entries(connectors.data?.platform ?? {}).map(([key, ok]) => (
                  <li key={key} className="flex items-center justify-between">
                    <span className="capitalize">{key.replace(/([A-Z])/g, " $1").toLowerCase()}</span>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-md"
                      style={{
                        background: ok ? "rgba(0,217,126,0.12)" : "rgba(136,146,164,0.12)",
                        color: ok ? "#00D97E" : "#8892A4",
                      }}
                    >
                      {ok ? "Configured" : "Not configured"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Activity</h3>
            <DataGate connected={true} empty={true}>
              <span />
            </DataGate>
          </Card>
        </div>
      </main>
    </div>
  );
}
