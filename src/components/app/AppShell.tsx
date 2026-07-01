import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home, Megaphone, Search, Users, Mail, DollarSign, Radio, TrendingUp,
  Settings, LogOut, Bell, Sparkles, Layers,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ReactNode } from "react";

const NAV: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
  { to: "/app", label: "Home", icon: Home, exact: true },
  { to: "/app/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/app/discovery", label: "Discovery", icon: Search },
  { to: "/app/hotlist", label: "Hotlist CRM", icon: Users },
  { to: "/app/outreach", label: "Outreach", icon: Mail },
  { to: "/app/platforms", label: "Platforms", icon: Layers },
  { to: "/app/affiliate", label: "Affiliate", icon: DollarSign },
  { to: "/app/community", label: "Community", icon: Radio },
  { to: "/app/expansion", label: "Expansion", icon: TrendingUp },
  { to: "/app/settings", label: "Settings", icon: Settings },
];


export function Wordmark() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[18px] font-extrabold tracking-tight text-white">
        Aspen<span className="text-[#00D97E]">Reach</span>
      </span>
      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA] border border-[#7C3AED]/30">
        Beta
      </span>
    </div>
  );
}

export function AppShell({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const initials = (user?.email ?? "?").slice(0, 2).toUpperCase();

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="min-h-screen flex bg-[#05080F] text-[#F0F4FF]">
      <aside className="w-[240px] shrink-0 fixed inset-y-0 left-0 bg-[#0C1222] border-r border-white/[0.07] flex flex-col z-30">
        <div className="px-5 py-5"><Wordmark /></div>
        <div className="px-5 pb-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#4B5563]">Workspace</div>
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = isActive(to, exact);
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-[#00D97E]/10 text-[#00D97E] border-l-[3px] border-[#00D97E] pl-[13px]"
                    : "text-[#8892A4] hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/[0.07] p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#00D97E] text-[#05080F] flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#8892A4] truncate">{user?.email}</div>
            </div>
            <Link to="/app/settings" className="text-[#8892A4] hover:text-white"><Settings className="w-4 h-4" /></Link>
          </div>
          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="w-full flex items-center gap-2 text-xs text-[#8892A4] hover:text-white px-2 py-1.5 rounded"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-[240px] flex flex-col min-w-0">
        <header className="h-[60px] sticky top-0 z-20 bg-[#05080F] border-b border-white/[0.07] flex items-center justify-between px-8">
          <h1 className="text-[18px] font-semibold text-[#F0F4FF]">{title}</h1>
          <div className="flex items-center gap-3">
            {right}
            <button className="text-[#8892A4] hover:text-white relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#00D97E] rounded-full" />
            </button>
            <button className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-[#00D97E]/50 text-[#00D97E] hover:bg-[#00D97E]/10">
              <Sparkles className="w-3.5 h-3.5" /> Upgrade
            </button>
            <div className="w-8 h-8 rounded-full bg-[#00D97E] text-[#05080F] flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}

export function Card({ children, className = "", style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`bg-[#0C1222] border border-white/[0.07] rounded-xl ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, trend, trendColor = "green" }: {
  label: string; value: string; trend?: string; trendColor?: "green" | "amber" | "muted";
}) {
  const trendCls = trendColor === "green" ? "text-[#00D97E]" : trendColor === "amber" ? "text-[#F59E0B]" : "text-[#8892A4]";
  return (
    <Card className="px-6 py-5">
      <div className="text-[11px] uppercase tracking-wider text-[#8892A4] font-semibold">{label}</div>
      <div className="mt-2 text-[36px] font-extrabold tracking-tight leading-none text-[#F0F4FF]">{value}</div>
      {trend && <div className={`mt-3 text-xs ${trendCls}`}>{trend}</div>}
    </Card>
  );
}
