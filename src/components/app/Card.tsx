import { type ReactNode } from "react";

// Extracted verbatim from components/app/AppShell.tsx, which was deleted once
// the AppShell and Wordmark exports proved to be rendered by no route. Card and
// StatCard were the only live exports in that file — /admin renders both, and
// AdsLibrary renders Card — so they moved here rather than going with it.
// Still on raw hex; the token migration happens in a later batch.

export function Card({ children, className = "", style, onClick }: { children: ReactNode; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div
      className={`bg-[#0C1222] border border-white/[0.07] rounded-xl ${className}`}
      style={style}
      onClick={onClick}
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
