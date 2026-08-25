import { useState } from "react";

/* The heat map: each scored creator lands by Fit (x, alignment) and Reach
   (y, channel strength), coloured by band. Creators without reach data yet
   (before a creator source key is set) still appear in the ranked list below,
   so the panel is useful immediately and richer once keys exist.

   Ported to Aspen per SCREENS-TO-PORT.md §4. This renders bare — no card of its
   own — because the Hotlist screen already supplies the "Fit & reach map" card
   around it, heading and "Score creators" button included.

   One thing in the spec has no data behind it: the `#FFD84D` dashed budget line
   the design draws at "$40 CPM". Nothing in the scored-creator record carries a
   cost, so the line is omitted rather than drawn at a made-up value, and
   in-range/out-of-range is read off the best-match quadrant (fit and reach both
   at or above 50) instead of off a budget. */

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

// Score bands, per the spec: strong / middling / weak.
const colorFor = (score: number) =>
  score >= 70
    ? "var(--color-accent)"
    : score >= 40
      ? "var(--color-warn-ink)"
      : "var(--color-subtle)";

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
      <div className="bg-cream rounded-[16px] px-[24px] py-[32px] text-center">
        <p className="text-[14px] font-semibold text-subtle m-0">No scored creators yet</p>
        <p className="text-[12.5px] text-sand-ink leading-[1.5] m-[6px_0_0]">
          Add creators to this campaign and score them to see where they land.
        </p>
      </div>
    );
  }

  const W = 640;
  const H = 340;
  const pad = 44;
  const plotted = creators.filter((c) => c.channel != null && c.alignment != null);
  const x = (v: number) => pad + (v / 100) * (W - pad * 2);
  const y = (v: number) => H - pad - (v / 100) * (H - pad * 2);
  const inRange = (c: HeatCreator) => (c.alignment ?? 0) >= 50 && (c.channel ?? 0) >= 50;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full block"
        role="img"
        aria-label="Creator fit and reach map"
      >
        {/* best-match quadrant */}
        <rect
          x={x(50)}
          y={pad}
          width={W - pad - x(50)}
          height={y(50) - pad}
          rx="12"
          className="fill-tint"
        />
        <text
          x={x(50) + 12}
          y={pad + 20}
          fontSize="11"
          fontWeight="700"
          className="fill-accent-ink"
        >
          BEST MATCH
        </text>

        {/* axes */}
        <line
          x1={pad}
          y1={H - pad}
          x2={W - pad}
          y2={H - pad}
          className="stroke-border"
          strokeWidth="1.5"
        />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} className="stroke-border" strokeWidth="1.5" />
        {/* mid guides */}
        <line
          x1={x(50)}
          y1={pad}
          x2={x(50)}
          y2={H - pad}
          className="stroke-border-soft"
          strokeDasharray="4 4"
        />
        <line
          x1={pad}
          y1={y(50)}
          x2={W - pad}
          y2={y(50)}
          className="stroke-border-soft"
          strokeDasharray="4 4"
        />

        {/* axis labels */}
        <text
          x={W / 2}
          y={H - 12}
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="700"
          className="fill-subtle"
        >
          BRAND FIT →
        </text>
        <text
          x={16}
          y={H / 2}
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="700"
          className="fill-subtle"
          transform={`rotate(-90 16 ${H / 2})`}
        >
          REACH →
        </text>

        {/* points */}
        {plotted.map((c) => {
          const cx = x(c.alignment as number);
          const cy = y(c.channel as number);
          const r = hover === c.id ? 9 : 6;
          return (
            <g
              key={c.id}
              onMouseEnter={() => setHover(c.id)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={r}
                className={inRange(c) ? "fill-accent" : "fill-sand-dark"}
                opacity={hover && hover !== c.id ? 0.45 : 1}
              />
              <title>
                {`${c.name} — ${c.overall}% overall\nFit ${c.alignment}%, Reach ${c.channel}%${
                  c.reach != null ? `, ${fmtReach(c.reach)} subs` : ""
                }`}
              </title>
              {hover === c.id && (
                <text
                  x={cx}
                  y={cy - 13}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  className="fill-dark"
                >
                  {c.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {plotted.length === 0 && (
        <p className="text-[12.5px] text-subtle text-center leading-[1.5] m-[4px_0_0]">
          The reach axis fills in once a creator data source (YouTube or Phyllo) is connected. Fit
          scores are ranked below.
        </p>
      )}

      {/* Ranked list, always available */}
      <div className="mt-[18px] pt-[16px] border-t-[1.5px] border-border-soft">
        <div className="text-[11.5px] font-bold tracking-[0.12em] text-subtle mb-[12px]">
          RANKED BY FIT
        </div>
        <div className="flex flex-col gap-[12px]">
          {creators.map((c) => {
            const band = colorFor(c.overall);
            const reach = fmtReach(c.reach);
            return (
              <div key={c.id} className="flex items-center gap-[10px]">
                <div
                  className="w-[30px] shrink-0 text-right font-heading font-extrabold text-[14.5px] tabular-nums"
                  style={{ color: band }}
                >
                  {c.overall}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-bold truncate">{c.name}</div>
                  <div className="h-[6px] rounded-full bg-border-soft mt-[5px] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.overall}%`, background: band }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-[6px] shrink-0">
                  {c.alignment != null && (
                    <span className="whitespace-nowrap text-[10.5px] font-bold bg-sand text-subtle rounded-[6px] px-[7px] py-[3px]">
                      Fit {c.alignment}
                    </span>
                  )}
                  {reach && (
                    <span className="whitespace-nowrap text-[10.5px] font-bold bg-sand text-subtle rounded-[6px] px-[7px] py-[3px]">
                      {reach}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
