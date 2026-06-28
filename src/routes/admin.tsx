import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, StatCard } from "@/components/app/AppShell";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (user.role !== "admin") navigate({ to: "/app" });
  }, [user, loading, navigate]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-[#05080F] text-[#F0F4FF]">
      <header className="h-[60px] bg-[#0C1222] border-b border-white/[0.07] px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold tracking-tight">
            Aspen<span className="text-[#00D97E]">Reach</span>
          </span>
          <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#7C3AED] text-white">Admin Panel</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#8892A4]">{user.email}</span>
          <button onClick={() => { logout(); navigate({ to: "/login" }); }} className="flex items-center gap-1.5 text-xs text-[#8892A4] hover:text-white">
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </header>

      <main className="p-8 max-w-[1400px] mx-auto">
        <h2 className="text-2xl font-bold mb-1">Platform Overview</h2>
        <p className="text-[#8892A4] mb-6">Beta workspace metrics across all tenants</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Workspaces" value="247" trend="↑ 18 this week" />
          <StatCard label="Active Campaigns" value="412" trend="↑ 6%" />
          <StatCard label="Tracked Creators" value="18.4K" trend="↑ 1.2K this week" />
          <StatCard label="Beta Waitlist" value="1,283" trend="↑ 47 today" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 p-6">
            <h3 className="font-semibold mb-4">Recent Signups</h3>
            <ul className="divide-y divide-white/[0.05]">
              {[
                { email: "growth@northforge.io", plan: "Trial", time: "2m ago" },
                { email: "team@brightlabs.co", plan: "Growth", time: "1h ago" },
                { email: "matt@solidgo.app", plan: "Trial", time: "3h ago" },
                { email: "ops@brewco.xyz", plan: "Trial", time: "6h ago" },
                { email: "founders@blockdaily.com", plan: "Scale", time: "1d ago" },
              ].map((u) => (
                <li key={u.email} className="py-3 flex items-center justify-between text-sm">
                  <span className="font-medium">{u.email}</span>
                  <span className="text-xs text-[#8892A4]">{u.plan}</span>
                  <span className="text-xs text-[#4B5563]">{u.time}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4">System Status</h3>
            <ul className="space-y-3 text-sm">
              {[
                ["API Gateway", "Operational"],
                ["YouTube Indexer", "Operational"],
                ["Reddit Crawler", "Operational"],
                ["X Stream", "Degraded"],
                ["Payouts (mock)", "Operational"],
              ].map(([k, v]) => (
                <li key={k} className="flex items-center justify-between">
                  <span className="text-[#8892A4]">{k}</span>
                  <span className={`text-xs font-semibold ${v === "Operational" ? "text-[#00D97E]" : "text-[#F59E0B]"}`}>
                    ● {v}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </main>
    </div>
  );
}
