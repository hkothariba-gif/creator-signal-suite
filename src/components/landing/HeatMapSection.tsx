import { useState } from "react";
import { motion } from "framer-motion";
import { Crosshair, Move, Sparkles, MousePointer2 } from "lucide-react";
import { WordStagger, FadeUp } from "./words";
import { YouTubeIcon, RedditIcon, XIcon } from "./icons";

type Tab = "heat" | "grid" | "hotlist";

const dots = [
  // [x%, y%, color]
  ...Array.from({ length: 7 }).map((_, i) => ({
    x: 65 + Math.random() * 30,
    y: 15 + Math.random() * 30,
    c: "#10B981",
  })),
  ...Array.from({ length: 7 }).map((_, i) => ({
    x: 30 + Math.random() * 40,
    y: 35 + Math.random() * 30,
    c: "#F59E0B",
  })),
  ...Array.from({ length: 6 }).map((_, i) => ({
    x: 8 + Math.random() * 50,
    y: 60 + Math.random() * 30,
    c: "#64748B",
  })),
];

export function HeatMapSection() {
  const [tab, setTab] = useState<Tab>("heat");
  return (
    <section id="how" className="bg-brand-off-white py-28 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center">
          <div className="text-brand-green text-xs font-bold uppercase tracking-[0.15em]">
            Creator Discovery Engine
          </div>
          <WordStagger
            text="See exactly which creators fit — before you spend a dollar"
            className="mt-4 mx-auto max-w-[760px] font-display font-extrabold text-4xl md:text-5xl lg:text-[56px] tracking-[-0.04em] leading-[1.05] text-brand-navy"
          />
        </div>

        <div className="mt-10 flex items-center justify-center gap-8 border-b border-slate-200">
          {([
            ["heat", "Heat Map View"],
            ["grid", "Grid View"],
            ["hotlist", "Hotlist CRM"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                tab === id ? "text-brand-navy" : "text-brand-text-muted hover:text-slate-700"
              }`}
            >
              {label}
              {tab === id && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute -bottom-px left-0 right-0 h-0.5 bg-brand-green"
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-12">
          {tab === "heat" && <HeatMapView />}
          {tab === "grid" && <GridView />}
          {tab === "hotlist" && <HotlistView />}
        </div>
      </div>
    </section>
  );
}

function HeatMapView() {
  const bullets = [
    { Icon: Crosshair, t: "Plot every creator by Reach vs Brand-Fit Score on a 2D scatter chart" },
    { Icon: Move, t: "Drag the amber Budget Cap line to filter creators instantly" },
    { Icon: Sparkles, t: "The Best Match Zone highlights your highest-probability creators" },
    { Icon: MousePointer2, t: "Hover any dot for name, platform, fit score, subs, CPM range" },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-10 items-center">
      <div className="space-y-5">
        {bullets.map((b, i) => (
          <FadeUp key={i} delay={i * 0.1}>
            <div className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                <b.Icon className="w-5 h-5 text-brand-green" />
              </span>
              <p className="text-brand-navy text-lg leading-relaxed">{b.t}</p>
            </div>
          </FadeUp>
        ))}
      </div>

      <FadeUp delay={0.2}>
        <div className="rounded-3xl p-6 bg-brand-navy shadow-[0_30px_80px_-20px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between text-xs text-brand-muted mb-4">
            <span className="uppercase tracking-[0.15em]">Creator Heat Map</span>
            <span className="uppercase tracking-[0.15em]">↑ Brand Fit / Reach →</span>
          </div>
          <ScatterSVG />
        </div>
      </FadeUp>
    </div>
  );
}

function ScatterSVG() {
  const W = 560,
    H = 380;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* grid */}
      {Array.from({ length: 5 }).map((_, i) => (
        <line
          key={`h${i}`}
          x1={0}
          x2={W}
          y1={(H / 5) * (i + 1)}
          y2={(H / 5) * (i + 1)}
          stroke="rgba(255,255,255,0.06)"
        />
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <line
          key={`v${i}`}
          y1={0}
          y2={H}
          x1={(W / 6) * (i + 1)}
          x2={(W / 6) * (i + 1)}
          stroke="rgba(255,255,255,0.06)"
        />
      ))}

      {/* best match zone */}
      <rect
        x={W * 0.62}
        y={0}
        width={W * 0.38}
        height={H * 0.42}
        fill="rgba(16,185,129,0.15)"
        rx={12}
      />
      <text x={W * 0.64} y={24} fill="#10B981" fontSize="11" fontWeight="700" letterSpacing="1.5">
        BEST MATCH ZONE
      </text>

      {/* budget cap dashed line */}
      <line
        x1={0}
        x2={W}
        y1={H * 0.55}
        y2={H * 0.55}
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeDasharray="6 6"
        className="amber-line"
      />
      <text x={12} y={H * 0.55 - 6} fill="#F59E0B" fontSize="10" fontWeight="700" letterSpacing="1.5">
        BUDGET CAP
      </text>
      <circle cx={W - 16} cy={H * 0.55} r="6" fill="#F59E0B" />

      {/* dots */}
      {dots.map((d, i) => (
        <motion.circle
          key={i}
          cx={(d.x / 100) * W}
          cy={(d.y / 100) * H}
          r={d.c === "#10B981" ? 7 : 5}
          fill={d.c}
          opacity={d.c === "#64748B" ? 0.4 : 0.9}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: d.c === "#64748B" ? 0.4 : 0.9 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05, duration: 0.4 }}
          style={{ transformOrigin: `${(d.x / 100) * W}px ${(d.y / 100) * H}px` }}
        />
      ))}

      {/* highlighted */}
      <circle cx={W * 0.78} cy={H * 0.18} r="9" fill="#10B981" stroke="#fff" strokeWidth="2" />
      <g transform={`translate(${W * 0.5}, ${H * 0.05})`}>
        <rect width="220" height="58" rx="10" fill="rgba(255,255,255,0.96)" />
        <text x="12" y="22" fontSize="12" fontWeight="700" fill="#0F172A">
          TechWithMarcus · YouTube
        </text>
        <text x="12" y="40" fontSize="11" fill="#475569">
          94% fit · 340K subs · $900 CPM
        </text>
        <line x1="12" y1="48" x2="208" y2="48" stroke="#E2E8F0" />
      </g>
    </svg>
  );
}

function GridView() {
  const cards = [
    { Icon: YouTubeIcon, color: "#FF0000", label: "YouTube", name: "TechWithMarcus", meta: "340K subs · 6.2% eng", fit: 94 },
    { Icon: RedditIcon, color: "#FF4500", label: "Reddit", name: "r/homelab", meta: "847K members", fit: 89 },
    { Icon: () => <XIcon size={32} bg="black" />, color: "#000", label: "X / Twitter", name: "@buildinpublic_sara", meta: "128K followers", fit: 91 },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {cards.map((c, i) => (
        <FadeUp key={i} delay={i * 0.08}>
          <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-sm h-full">
            <c.Icon size={32} />
            <div className="mt-3 font-bold text-sm" style={{ color: c.color }}>
              {c.label}
            </div>
            <div className="mt-2 text-brand-navy font-semibold">{c.name}</div>
            <div className="text-brand-text-muted text-xs mt-0.5">{c.meta}</div>
            <div className="mt-5">
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-text-muted mb-1">
                <span>Brand Fit</span>
                <span className="text-brand-green font-bold">{c.fit}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-brand-green" style={{ width: `${c.fit}%` }} />
              </div>
            </div>
          </div>
        </FadeUp>
      ))}
    </div>
  );
}

function HotlistView() {
  const cols = [
    { name: "Sourced", cards: ["TechWithMarcus", "r/homelab"] },
    { name: "Contacted", cards: ["@buildinpublic_sara"] },
    { name: "Negotiating", cards: ["DevDoodles"] },
    { name: "Live", cards: ["r/SaaS"] },
    { name: "Closed", cards: ["@growthstack"] },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cols.map((col, i) => (
        <FadeUp key={col.name} delay={i * 0.06}>
          <div className="rounded-xl bg-white border border-slate-200 p-3 h-full">
            <div className="text-[10px] uppercase font-bold tracking-[0.15em] text-brand-text-muted mb-3">
              {col.name}
            </div>
            <div className="space-y-2">
              {col.cards.map((c) => (
                <div key={c} className="rounded-lg bg-brand-off-white border border-slate-100 p-3 text-sm font-semibold text-brand-navy">
                  {c}
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      ))}
    </div>
  );
}
