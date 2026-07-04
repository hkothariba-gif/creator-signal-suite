import { useState } from "react";
import { motion } from "framer-motion";
import { Crosshair, Move, Sparkles, MousePointer2 } from "lucide-react";
import { WordStagger, FadeUp } from "./words";
import { YouTubeIcon, RedditIcon, LinkedInIcon } from "./icons";

// The heat map works across YouTube, LinkedIn, and Reddit. Points come from
// live integrations only. Until a data source is connected each heat map
// shows Waiting for API connection. No fabricated points, ever.

type PlatformTab = "youtube" | "linkedin" | "reddit";

const PLATFORM_TABS: { id: PlatformTab; label: string; color: string; Icon: (p: { size?: number }) => JSX.Element }[] = [
  { id: "youtube", label: "YouTube", color: "#FF0000", Icon: (p) => <YouTubeIcon size={p.size} /> },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", Icon: (p) => <LinkedInIcon size={p.size} /> },
  { id: "reddit", label: "Reddit", color: "#FF4500", Icon: (p) => <RedditIcon size={p.size} /> },
];

export function HeatMapSection() {
  const [tab, setTab] = useState<PlatformTab>("youtube");
  const active = PLATFORM_TABS.find((t) => t.id === tab)!;

  return (
    <section id="how" className="py-16 md:py-[100px]" style={{ background: "#05080F" }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center">
          <div className="text-brand-green text-xs font-bold uppercase tracking-[0.15em]">
            Creator Discovery Engine
          </div>
          <WordStagger
            text="See which creators fit across YouTube, LinkedIn, and Reddit before you spend a dollar"
            className="mt-4 mx-auto max-w-[820px] font-display font-extrabold text-4xl md:text-[52px] tracking-[-0.04em] leading-[1.05]"
            style={{ color: "#F0F4FF" }}
          />
        </div>

        <div
          className="mt-10 flex items-center justify-center gap-8"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          {PLATFORM_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative pb-3 text-sm font-semibold transition-colors ${
                tab === t.id ? "text-white" : "text-[#8892A4] hover:text-white"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute -bottom-px left-0 right-0 h-0.5 bg-brand-green"
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-12">
          <HeatMapView platform={active} />
        </div>
      </div>
    </section>
  );
}

function HeatMapView({ platform }: { platform: (typeof PLATFORM_TABS)[number] }) {
  const bullets = [
    { Icon: Crosshair, t: "Plot every creator by reach and brand fit score on a scatter chart" },
    { Icon: Move, t: "Drag the amber budget cap line to filter creators instantly" },
    { Icon: Sparkles, t: "The best match zone highlights the creators most likely to convert" },
    { Icon: MousePointer2, t: "Hover any dot for name, platform, fit score, audience size, and CPM range" },
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
              <p className="text-lg leading-relaxed" style={{ color: "#F0F4FF" }}>
                {b.t}
              </p>
            </div>
          </FadeUp>
        ))}
      </div>

      <div>
        <ScatterPlot platform={platform} />
      </div>
    </div>
  );
}

function ScatterPlot({ platform }: { platform: (typeof PLATFORM_TABS)[number] }) {
  const W = 560;
  const H = 380;
  const padL = 44;
  const padR = 20;
  const padT = 36;
  const padB = 36;
  const px = (x: number) => padL + (x / 100) * (W - padL - padR);
  const py = (y: number) => padT + (1 - y / 100) * (H - padT - padB);

  const zoneX = px(75);
  const zoneY = py(100);
  const zoneW = px(100) - px(75);
  const zoneH = py(75) - py(100);

  return (
    <div className="rounded-2xl p-6 card-elevated shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between text-[11px] text-brand-muted mb-3 uppercase tracking-[0.15em]">
        <span className="inline-flex items-center gap-2">
          <platform.Icon size={16} /> {platform.label} heat map
        </span>
        <span>↑ Brand Fit / Reach →</span>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          {[25, 50, 75].map((v) => (
            <g key={`g-${v}`}>
              <line x1={padL} x2={W - padR} y1={py(v)} y2={py(v)} stroke="rgba(255,255,255,0.06)" />
              <line y1={padT} y2={H - padB} x1={px(v)} x2={px(v)} stroke="rgba(255,255,255,0.06)" />
            </g>
          ))}
          <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke="rgba(255,255,255,0.15)" />
          <line x1={padL} x2={padL} y1={padT} y2={H - padB} stroke="rgba(255,255,255,0.15)" />
          <text x={W - padR} y={H - 10} fill="#94A3B8" fontSize="11" textAnchor="end" fontWeight="600">
            Reach →
          </text>
          <text x={padL} y={padT - 14} fill="#94A3B8" fontSize="11" fontWeight="600">
            ↑ Brand Fit
          </text>
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
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ background: "rgba(5,8,15,0.85)", color: "#8892A4", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            Waiting for API connection
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end flex-wrap gap-3">
        <div className="flex items-center gap-4 text-[11px] text-brand-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-green" />
            High fit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-amber" />
            Mid
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            Low
          </span>
        </div>
      </div>
    </div>
  );
}
