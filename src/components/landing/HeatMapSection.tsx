import { useState } from "react";
import { motion } from "framer-motion";
import { Crosshair, Move, Sparkles, MousePointer2 } from "lucide-react";
import { WordStagger, FadeUp } from "./words";
import { YouTubeIcon, RedditIcon, XIcon } from "./icons";

type Tab = "heat" | "grid" | "hotlist";

type Creator = {
  x: number;
  y: number;
  name: string;
  platform: string;
  color: string;
  r: number;
  subs?: string;
};

const creators: Creator[] = [
  { x: 85, y: 92, name: "TechWithMarcus", platform: "YouTube", color: "#00D97E", r: 10, subs: "340K subs" },
  { x: 72, y: 88, name: "HomeLabPro", platform: "YouTube", color: "#00D97E", r: 9, subs: "210K subs" },
  { x: 60, y: 94, name: "r/homelab", platform: "Reddit", color: "#00D97E", r: 11, subs: "847K members" },
  { x: 90, y: 78, name: "BuildingWithSara", platform: "X", color: "#00D97E", r: 8, subs: "128K followers" },
  { x: 45, y: 85, name: "r/selfhosted", platform: "Reddit", color: "#00D97E", r: 9, subs: "412K members" },
  { x: 78, y: 65, name: "TechTalkDaily", platform: "YouTube", color: "#F59E0B", r: 8, subs: "190K subs" },
  { x: 55, y: 70, name: "@devops_dan", platform: "X", color: "#F59E0B", r: 7, subs: "62K followers" },
  { x: 30, y: 80, name: "r/sysadmin", platform: "Reddit", color: "#F59E0B", r: 8, subs: "920K members" },
  { x: 65, y: 55, name: "CloudNative", platform: "YouTube", color: "#F59E0B", r: 7, subs: "145K subs" },
  { x: 20, y: 60, name: "@cloudpunk", platform: "X", color: "#4A5568", r: 6, subs: "38K followers" },
  { x: 40, y: 40, name: "GenericTech", platform: "YouTube", color: "#4A5568", r: 6, subs: "88K subs" },
  { x: 15, y: 72, name: "r/linux", platform: "Reddit", color: "#4A5568", r: 7, subs: "1.2M members" },
  { x: 88, y: 50, name: "BigTechReview", platform: "YouTube", color: "#4A5568", r: 7, subs: "510K subs" },
  { x: 25, y: 35, name: "@random_tech", platform: "X", color: "#4A5568", r: 5, subs: "22K followers" },
  { x: 70, y: 30, name: "MassMarketYT", platform: "YouTube", color: "#4A5568", r: 8, subs: "1.8M subs" },
  { x: 50, y: 90, name: "r/homeautomation", platform: "Reddit", color: "#00D97E", r: 9, subs: "380K members" },
  { x: 82, y: 82, name: "NicheTechPro", platform: "YouTube", color: "#00D97E", r: 8, subs: "165K subs" },
  { x: 38, y: 75, name: "@buildinpublic", platform: "X", color: "#F59E0B", r: 7, subs: "78K followers" },
  { x: 62, y: 48, name: "r/programming", platform: "Reddit", color: "#4A5568", r: 7, subs: "5.8M members" },
  { x: 92, y: 70, name: "TopTierReach", platform: "YouTube", color: "#F59E0B", r: 9, subs: "720K subs" },
];

const bestMatchCount = creators.filter((c) => c.x >= 75 && c.y >= 75).length;

export function HeatMapSection() {
  const [tab, setTab] = useState<Tab>("heat");
  return (
    <section id="how" className="py-16 md:py-[100px]" style={{ background: "#05080F" }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center">
          <div className="text-brand-green text-xs font-bold uppercase tracking-[0.15em]">
            Creator Discovery Engine
          </div>
          <WordStagger
            text="See exactly which creators fit — before you spend a dollar"
            className="mt-4 mx-auto max-w-[820px] font-display font-extrabold text-4xl md:text-[52px] tracking-[-0.04em] leading-[1.05]"
            style={{ color: "#F0F4FF" }}
          />
        </div>

        <div className="mt-10 flex items-center justify-center gap-8" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {([
            ["heat", "Heat Map View"],
            ["grid", "Grid View"],
            ["hotlist", "Hotlist CRM"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                tab === id ? "text-white" : "text-[#8892A4] hover:text-white"
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
    <div className="grid grid-cols-1 md:grid-cols-[45fr_55fr] gap-10 items-center">
      <div className="space-y-5">
        {bullets.map((b, i) => (
          <FadeUp key={i} delay={i * 0.1}>
            <div className="flex items-start gap-4">
              <span className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                <b.Icon className="w-5 h-5 text-brand-green" />
              </span>
              <p className="text-lg leading-relaxed" style={{ color: "#F0F4FF" }}>{b.t}</p>
            </div>
          </FadeUp>
        ))}
      </div>

      <div>
        <ScatterPlot />
      </div>
    </div>
  );
}

function ScatterPlot() {
  const W = 560;
  const H = 380;
  const padL = 44;
  const padR = 20;
  const padT = 36;
  const padB = 36;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const px = (x: number) => padL + (x / 100) * plotW;
  const py = (y: number) => padT + (1 - y / 100) * plotH;

  const zoneX = px(75);
  const zoneY = py(100);
  const zoneW = px(100) - px(75);
  const zoneH = py(75) - py(100);
  const capY = py(72);

  return (
    <div className="rounded-2xl p-6 card-elevated shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
      <style>{`
        @keyframes dotPop { 0% { r: 0; opacity: 0; } 70% { opacity: 1; } 100% { opacity: 1; } }
        .scatter-dot { animation: dotPop 0.55s cubic-bezier(0.34,1.56,0.64,1) both; transform-origin: center; transition: filter 0.2s, transform 0.2s; cursor: pointer; }
        .scatter-dot:hover { filter: brightness(1.2) drop-shadow(0 0 8px currentColor); }
        @keyframes dashPulse { 0%,100% { opacity: 0.85; } 50% { opacity: 1; } }
        .budget-cap { animation: dashPulse 2.4s ease-in-out infinite; }
      `}</style>
      <div className="flex items-center justify-between text-[11px] text-brand-muted mb-3 uppercase tracking-[0.15em]">
        <span>Creator Heat Map</span>
        <span>↑ Brand Fit / Reach →</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
        {/* grid lines */}
        {[25, 50, 75].map((v) => (
          <g key={`g-${v}`}>
            <line x1={padL} x2={W - padR} y1={py(v)} y2={py(v)} stroke="rgba(255,255,255,0.06)" />
            <line y1={padT} y2={H - padB} x1={px(v)} x2={px(v)} stroke="rgba(255,255,255,0.06)" />
          </g>
        ))}
        {/* axes */}
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="rgba(255,255,255,0.15)" />
        <line x1={padL} x2={padL} y1={padT} y2={H - padB} stroke="rgba(255,255,255,0.15)" />
        <text x={W - padR} y={H - 10} fill="#94A3B8" fontSize="11" textAnchor="end" fontWeight="600">
          Reach →
        </text>
        <text x={padL} y={padT - 14} fill="#94A3B8" fontSize="11" fontWeight="600">
          ↑ Brand Fit
        </text>

        {/* best match zone */}
        <rect
          x={zoneX}
          y={zoneY}
          width={zoneW}
          height={zoneH}
          fill="rgba(0,217,126,0.10)"
          stroke="#00D97E"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          rx={10}
        />
        <text x={zoneX + 10} y={zoneY + 18} fill="#00D97E" fontSize="11" fontWeight="700" letterSpacing="1.2">
          BEST MATCH ZONE
        </text>

        {/* budget cap dashed */}
        <line
          x1={padL}
          x2={W - padR}
          y1={capY}
          y2={capY}
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeDasharray="6 6"
          className="budget-cap"
        />
        <text x={padL + 8} y={capY - 6} fill="#F59E0B" fontSize="10" fontWeight="700" letterSpacing="1.4">
          BUDGET CAP ⬍
        </text>
        <circle cx={W - padR} cy={capY} r="5" fill="#F59E0B" />

        {/* dots */}
        {creators.map((c, i) => (
          <circle
            key={c.name}
            cx={px(c.x)}
            cy={py(c.y)}
            r={c.r}
            fill={c.color}
            stroke="#ffffff"
            strokeWidth="2"
            className="scatter-dot"
            style={{ color: c.color, animationDelay: `${i * 80}ms` }}
          >
            <title>{`${c.name} · ${c.platform} · ${c.y}% brand fit · ${c.subs}`}</title>
          </circle>
        ))}
      </svg>

      <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full bg-brand-green/15 text-brand-green border border-brand-green/30">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-green" />
          Showing {bestMatchCount} creators in Best Match Zone
        </span>
        <div className="flex items-center gap-4 text-[11px] text-brand-muted">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-green" />High fit</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-amber" />Mid</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-500" />Low</span>
        </div>
      </div>
    </div>
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
          <div className="rounded-2xl p-6 h-full" style={{ background: "rgba(12,18,34,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="flex items-center justify-between">
              <c.Icon size={32} />
              <img
                className="creator-avatar-img"
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name)}&backgroundColor=0C1222&radius=50`}
                alt={c.name}
              />
            </div>
            <div className="mt-3 font-bold text-sm" style={{ color: c.color }}>
              {c.label}
            </div>
            <div className="mt-2 font-semibold" style={{ color: "#F0F4FF" }}>{c.name}</div>
            <div className="text-xs mt-0.5" style={{ color: "#8892A4" }}>{c.meta}</div>
            <div className="mt-5">
              <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1" style={{ color: "#8892A4" }}>
                <span>Brand Fit</span>
                <span className="text-brand-green font-bold">{c.fit}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
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
          <div className="rounded-xl p-3 h-full" style={{ background: "rgba(12,18,34,0.8)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div className="text-[10px] uppercase font-bold tracking-[0.15em] mb-3" style={{ color: "#8892A4" }}>
              {col.name}
            </div>
            <div className="space-y-2">
              {col.cards.map((c) => (
                <div key={c} className="rounded-lg p-2.5 flex items-center gap-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <img
                    className="creator-avatar-img sm"
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c)}&backgroundColor=0C1222&radius=50`}
                    alt={c}
                  />
                  <span className="text-sm font-semibold truncate" style={{ color: "#F0F4FF" }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      ))}
    </div>
  );
}
