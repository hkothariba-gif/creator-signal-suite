type Dot = { x: number; y: number; r: number; color: "green" | "amber" | "gray"; glow?: boolean };

export function ScatterPlot({
  width = 480,
  height = 360,
  animate = false,
  showTooltip = false,
}: {
  width?: number;
  height?: number;
  animate?: boolean;
  showTooltip?: boolean;
}) {
  const pad = { l: 56, r: 24, t: 24, b: 48 };
  const w = width - pad.l - pad.r;
  const h = height - pad.t - pad.b;

  const dots: Dot[] = [
    { x: 0.85, y: 0.92, r: 9, color: "green", glow: true },
    { x: 0.78, y: 0.86, r: 8, color: "green", glow: true },
    { x: 0.72, y: 0.78, r: 7, color: "green", glow: true },
    { x: 0.65, y: 0.82, r: 7, color: "green", glow: true },
    { x: 0.55, y: 0.72, r: 6, color: "green" },
    { x: 0.48, y: 0.68, r: 6, color: "green" },
    { x: 0.42, y: 0.55, r: 5, color: "amber" },
    { x: 0.38, y: 0.48, r: 6, color: "amber" },
    { x: 0.55, y: 0.42, r: 5, color: "amber" },
    { x: 0.62, y: 0.5, r: 6, color: "amber" },
    { x: 0.7, y: 0.45, r: 5, color: "amber" },
    { x: 0.28, y: 0.35, r: 5, color: "amber" },
    { x: 0.2, y: 0.22, r: 4, color: "gray" },
    { x: 0.15, y: 0.3, r: 4, color: "gray" },
    { x: 0.32, y: 0.18, r: 4, color: "gray" },
    { x: 0.45, y: 0.25, r: 4, color: "gray" },
    { x: 0.58, y: 0.2, r: 4, color: "gray" },
    { x: 0.75, y: 0.28, r: 5, color: "gray" },
  ];

  const colorMap = { green: "#10B981", amber: "#F59E0B", gray: "#475569" };
  // Best Match Zone: x>0.6, y>0.6
  const zoneX = pad.l + 0.6 * w;
  const zoneY = pad.t + (1 - 1) * h;
  const zoneW = 0.4 * w;
  const zoneH = 0.4 * h;
  // Budget cap line at y=0.65 (top portion)
  const capY = pad.t + (1 - 0.65) * h;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="zoneGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={`gx${g}`}
          x1={pad.l + g * w}
          y1={pad.t}
          x2={pad.l + g * w}
          y2={pad.t + h}
          stroke="rgba(148,163,184,0.12)"
          strokeDasharray="2 4"
        />
      ))}
      {[0.25, 0.5, 0.75].map((g) => (
        <line
          key={`gy${g}`}
          x1={pad.l}
          y1={pad.t + g * h}
          x2={pad.l + w}
          y2={pad.t + g * h}
          stroke="rgba(148,163,184,0.12)"
          strokeDasharray="2 4"
        />
      ))}

      {/* Best Match Zone */}
      <rect
        x={zoneX}
        y={zoneY + pad.t}
        width={zoneW}
        height={zoneH}
        fill="url(#zoneGrad)"
        stroke="#10B981"
        strokeOpacity="0.4"
        strokeDasharray="4 4"
        rx="6"
      />
      <text
        x={zoneX + zoneW / 2}
        y={pad.t + 18}
        textAnchor="middle"
        fontSize="10"
        fontWeight="600"
        fill="#10B981"
        letterSpacing="0.1em"
      >
        BEST MATCH ZONE
      </text>

      {/* Axes */}
      <line x1={pad.l} y1={pad.t + h} x2={pad.l + w} y2={pad.t + h} stroke="rgba(148,163,184,0.4)" />
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + h} stroke="rgba(148,163,184,0.4)" />

      {/* Budget cap line */}
      <line
        x1={pad.l}
        y1={capY}
        x2={pad.l + w}
        y2={capY}
        stroke="#F59E0B"
        strokeWidth="2"
        strokeDasharray="6 4"
        className="amber-line"
      />
      <text x={pad.l + w - 6} y={capY - 6} textAnchor="end" fontSize="10" fill="#F59E0B" fontWeight="600">
        Budget Cap
      </text>

      {/* Axis labels */}
      <text x={pad.l + w / 2} y={height - 12} textAnchor="middle" fontSize="11" fill="#94A3B8" letterSpacing="0.1em">
        REACH →
      </text>
      <text
        x={-(pad.t + h / 2)}
        y={16}
        transform="rotate(-90)"
        textAnchor="middle"
        fontSize="11"
        fill="#94A3B8"
        letterSpacing="0.1em"
      >
        BRAND-FIT SCORE →
      </text>

      {/* Dots */}
      {dots.map((d, i) => {
        const cx = pad.l + d.x * w;
        const cy = pad.t + (1 - d.y) * h;
        const style = animate
          ? { animationDelay: `${i * 0.1}s` }
          : undefined;
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={d.r}
            fill={colorMap[d.color]}
            className={`${animate ? "dot-pop" : ""} ${d.glow ? "green-glow" : ""}`}
            style={style}
          />
        );
      })}

      {/* Tooltip */}
      {showTooltip && (() => {
        const t = dots[0];
        const cx = pad.l + t.x * w;
        const cy = pad.t + (1 - t.y) * h;
        return (
          <g>
            <line x1={cx} y1={cy} x2={cx + 30} y2={cy - 30} stroke="#10B981" strokeWidth="1" />
            <rect x={cx + 28} y={cy - 70} width="180" height="46" rx="6" fill="#0F172A" stroke="#10B981" strokeOpacity="0.5" />
            <text x={cx + 38} y={cy - 50} fontSize="11" fill="#10B981" fontWeight="700">92% brand fit</text>
            <text x={cx + 38} y={cy - 34} fontSize="10" fill="#CBD5E1">340K subs · $800–1,200 CPM</text>
          </g>
        );
      })()}
    </svg>
  );
}
