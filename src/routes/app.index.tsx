import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, Card, StatCard } from "@/components/app/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Mail, DollarSign } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: HomePage,
});

const activity = [
  { color: "#00D97E", name: "TechWithMarcus", action: "Responded to outreach", time: "2h ago" },
  { color: "#FF4500", name: "r/homelab", action: "New brand mention detected", time: "5h ago" },
  { color: "#00D97E", name: "@buildinpublic_sara", action: "Accepted deal", time: "1d ago" },
  { color: "#FF0000", name: "GadgetReviewHub", action: "Posted sponsored video", time: "2d ago" },
  { color: "#FF4500", name: "r/SaaS", action: "New buyer intent signal", time: "2d ago" },
  { color: "#00D97E", name: "CodeWithChris", action: "Contract signed", time: "3d ago" },
];

const topCreators = [
  { name: "TechWithMarcus", platform: "YouTube", score: 94, color: "#00D97E" },
  { name: "r/homelab", platform: "Reddit", score: 89, color: "#00D97E" },
  { name: "@buildinpublic_sara", platform: "X", score: 82, color: "#F59E0B" },
];

function HomePage() {
  const { user } = useAuth();
  const firstName = (user?.email ?? "there").split("@")[0].split(/[._-]/)[0];
  const greeting = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <AppShell title="Home">
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Good morning, {greeting}</h2>
        <p className="text-[#8892A4] mt-1">Here's what's happening across your campaigns</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Campaigns" value="3" trend="↑ vs last month" />
        <StatCard label="Creators in Hotlist" value="47" trend="↑ 12 this week" />
        <StatCard label="Pending Outreach" value="12" trend="→ no change" trendColor="muted" />
        <StatCard label="Avg Brand-Fit Score" value="84%" trend="↑ from 79%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <Card className="lg:col-span-3 p-6">
          <h3 className="font-semibold mb-4">Recent Campaign Activity</h3>
          <ul className="space-y-3">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center gap-3 text-sm py-2 border-b border-white/[0.04] last:border-0">
                <span className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                <span className="font-semibold text-[#F0F4FF]">{a.name}</span>
                <span className="text-[#8892A4]">— {a.action}</span>
                <span className="ml-auto text-xs text-[#4B5563]">{a.time}</span>
              </li>
            ))}
          </ul>
          <a href="#" className="block mt-4 text-sm text-[#00D97E] hover:underline">View all activity →</a>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold mb-4">Top Creators by Brand Fit</h3>
          <ul className="space-y-4">
            {topCreators.map((c) => (
              <li key={c.name}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-xs text-[#8892A4]">{c.platform}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full" style={{ width: `${c.score}%`, background: c.color }} />
                  </div>
                  <span className="text-xs font-bold" style={{ color: c.color }}>{c.score}%</span>
                </div>
              </li>
            ))}
          </ul>
          <a href="#" className="block mt-5 text-sm text-[#00D97E] hover:underline">View →</a>
        </Card>
      </div>

      <h3 className="font-semibold mt-4 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction to="/app/campaigns" icon={<Plus className="w-5 h-5" />} label="New Campaign" />
        <QuickAction to="/app/discovery" icon={<Search className="w-5 h-5" />} label="Search Creators" />
        <QuickAction to="/app/outreach" icon={<Mail className="w-5 h-5" />} label="Send Outreach" />
        <QuickAction to="/app/affiliate" icon={<DollarSign className="w-5 h-5" />} label="View Payouts" />
      </div>
    </AppShell>
  );
}

function QuickAction({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="bg-[#0C1222] border border-white/[0.07] rounded-xl p-5 flex flex-col items-center text-center hover:border-[#00D97E]/30 hover:shadow-[0_0_20px_rgba(0,217,126,0.05)] transition-all"
    >
      <span className="w-10 h-10 rounded-full bg-[#00D97E]/15 text-[#00D97E] flex items-center justify-center mb-3">{icon}</span>
      <span className="font-semibold text-sm">{label}</span>
    </Link>
  );
}
