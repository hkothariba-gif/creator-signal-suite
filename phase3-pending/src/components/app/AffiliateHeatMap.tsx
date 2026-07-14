import { useState } from "react";

// The heat map: each scored creator lands by Fit (x, alignment) and Reach
// (y, channel strength), coloured by overall score. Creators without reach data
// yet (before a creator source key is set) still appear in the ranked list
// below, so the panel is useful immediately and richer once keys exist.

export type HeatCreator = {
  id: string;
  name: string;
  overall: number;
  alignment: number | null;
  channel: number | null;
  content: number | null;
  comments: number | null;
  method: "llm" | "keyword";
  reach: number | null;
};

const colorFor = (score: number) =>
  score >= 70 ? "#00D97E" : score >= 40 ? "#F59E0B" : "#8892A4";

function fmtReach(n: number | null): string {
  if (n == null) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function AffiliateHeatMap({ creators }: { creators: HeatCreator[] }) {
  const [hover, setHover] = useState<string | null>(null);

  if (creators.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-[#0C1222] px-6 py-10 text-center">
        <p className="text-sm font-semibold text-[#8892A4]">No scored creators yet</p>
        <p className="mt-1 text-xs text-[#5A6478]">
          Add creators to this campaign and score them to see where they land.
        </p>
      </div>
    );
  }

  const W = 640;
  const H = 360;
  const pad = 44;
  const plotted = creators.filter((c) => c.channel != null && c.alignment != null);
  const x = (v: number) => pad + (v / 100) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / 100) * (H - pad * 2);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/[0.07] bg-[#0C1222] p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Affiliate fit and reach map">
          {/* quadrant fill */}
          <rect x={x(50)} y={pad} width={W - pad - x(50)} height={y(50) - pad} fill="#00D97E" opacity="0.05" />
          {/* axes */}
          <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#2A3444" strokeWidth="1" />
          <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#2A3444" strokeWidth="1" />
          {/* mid quadrant guides */}
          <line x1={x(50)} y1={pad} x2={x(50)} y2={H - pad} stroke="#1B2434" strokeDasharray="4 4" />
          <line x1={pad} y1={y(50)} x2={W - pad} y2={y(50)} stroke="#1B2434" strokeDasharray="4 4" />
          {/* axis labels */}
          <text x={W / 2} y={H - 12} textAnchor="middle" fill="#5A6478" fontSize="12">Fit (product alignment) →</text>
          <text x={16} y={H / 2} textAnchor="middle" fill="#5A6478" fontSize="12" transform={`rotate(-90 16 ${H / 2})`}>Reach & engagement →</text>
          {/* quadrant captions */}
          <text x={W - pad - 6} y={pad + 14} textAnchor="end" fill="#00D97E" fontSize="11" fontWeight="700">Best fit</text>
          <text x={pad + 6} y={pad + 14} fill="#4B5563" fontSize="11">Big reach, low fit</text>
          <text x={W - pad - 6} y={H - pad - 6} textAnchor="end" fill="#4B5563" fontSize="11">Great fit, small reach</text>
          {/* points */}
          {plotted.map((c) => {
            const cx = x(c.alignment as number);
            const cy = y(c.channel as number);
            const r = hover === c.id ? 9 : 6;
            return (
              <g key={c.id} onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                <circle cx={cx} cy={cy} r={r} fill={colorFor(c.overall)} opacity={hover && hover !== c.id ? 0.4 : 0.9} />
                <title>{`${c.name} — ${c.overall}% overall\nFit ${c.alignment}%, Reach ${c.channel}%${c.reach != null ? `, ${fmtReach(c.reach)} subs` : ""}`}</title>
                {hover === c.id && (
                  <text x={cx} y={cy - 12} textAnchor="middle" fill="#F0F4FF" fontSize="11" fontWeight="700">{c.name}</text>
                )}
              </g>
            );
          })}
        </svg>
        {plotted.length === 0 && (
          <p className="mt-2 text-center text-xs text-[#5A6478]">
            The reach axis fills in once a creator data source (YouTube or Phyllo) is connected. Fit scores are ranked below.
          </p>
        )}
      </div>

      {/* Ranked list, always available */}
      <div className="rounded-xl border border-white/[0.07] bg-[#0C1222] overflow-hidden">
        <div className="px-4 py-2 text-[11px] uppercase tracking-wider text-[#5A6478] font-semibold border-b border-white/[0.05]">
          Ranked by fit
        </div>
        <div className="divide-y divide-white/[0.04]">
          {creators.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="w-10 text-right tabular-nums font-bold" style={{ color: colorFor(c.overall) }}>
                {c.overall}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{c.name}</div>
                <div className="mt-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${c.overall}%`, background: colorFor(c.overall) }} />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-[#8892A4]">
                {c.alignment != null && <span className="px-1.5 py-0.5 rounded bg-white/[0.05]">Fit {c.alignment}</span>}
                {c.channel != null && <span className="px-1.5 py-0.5 rounded bg-white/[0.05]">Reach {c.channel}</span>}
                {c.comments != null && <span className="px-1.5 py-0.5 rounded bg-white/[0.05]">Comments {c.comments}</span>}
                <span className="px-1.5 py-0.5 rounded bg-white/[0.03] text-[#5A6478]">{c.method}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
