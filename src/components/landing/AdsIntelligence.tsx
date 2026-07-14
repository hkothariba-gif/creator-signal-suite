import { motion } from "framer-motion";
import { TrendingUp, MessagesSquare, Megaphone, Heart, Activity, Sparkles } from "lucide-react";
import { WordStagger, FadeUp } from "./words";

const signals = [
  { Icon: TrendingUp, label: "Affiliate & influencer performance" },
  { Icon: MessagesSquare, label: "Social chatter" },
  { Icon: Megaphone, label: "Brand posts & creator uploads" },
  { Icon: Heart, label: "Comment sentiment & buyer intent" },
  { Icon: Activity, label: "Organic engagement velocity" },
];

const outputs = [
  { label: "Ad hook" },
  { label: "Creative angle" },
  { label: "Target segment" },
];

export function AdsIntelligence() {
  return (
    <section id="ads-intelligence" className="py-16 md:py-[100px] relative overflow-hidden" style={{ background: "#05080F" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: 640,
          height: 640,
          left: "50%",
          top: "40%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(0,217,126,0.18) 0%, rgba(0,217,126,0) 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
        }}
      />

      <div className="relative max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <div className="eyebrow mb-4">Ads Intelligence Engine</div>
          <WordStagger
            text="Ads built from real signals, not guesses."
            className="font-display font-extrabold text-4xl md:text-5xl tracking-[-0.04em] leading-[1.05] text-white"
          />
          <p className="mt-4 text-brand-muted text-lg">
            Aspen fuses affiliate performance, social chatter, and organic engagement into ad
            creative your audience is already primed to convert on.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-8 lg:gap-10 items-center">
          {/* Signals */}
          <div className="space-y-3">
            {signals.map((s, i) => (
              <FadeUp key={s.label} delay={i * 0.08} from="left">
                <div
                  className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.07] bg-[#131D2E]/70 backdrop-blur-sm"
                  style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(0,217,126,0.12)", color: "#00D97E" }}
                  >
                    <s.Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-[#F0F4FF] text-sm">{s.label}</div>
                    <div className="text-xs text-brand-muted mt-0.5">{s.desc}</div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Engine */}
          <FadeUp delay={0.3}>
            <div className="relative flex flex-col items-center justify-center py-6 lg:py-0">
              <motion.div
                animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="relative w-40 h-40 rounded-full flex items-center justify-center"
                style={{
                  background: "radial-gradient(circle, rgba(0,217,126,0.25) 0%, rgba(0,217,126,0) 70%)",
                  boxShadow:
                    "0 0 0 1px rgba(0,217,126,0.4), 0 0 40px rgba(0,217,126,0.35), inset 0 0 40px rgba(0,217,126,0.15)",
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 rounded-full border border-dashed"
                  style={{ borderColor: "rgba(0,217,126,0.35)" }}
                />
                <div className="text-center relative z-10">
                  <Sparkles className="w-6 h-6 mx-auto mb-1" style={{ color: "#00D97E" }} />
                  <div className="font-display font-extrabold text-lg text-white tracking-tight">
                    Aspen
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-muted">
                    Ad Engine
                  </div>
                </div>
              </motion.div>

              {/* connector arrows for mobile hint */}
              <div className="lg:hidden mt-4 text-brand-muted text-xs">↓ generates ↓</div>
            </div>
          </FadeUp>

          {/* Outputs */}
          <div className="space-y-3">
            {outputs.map((o, i) => (
              <FadeUp key={o.label} delay={0.4 + i * 0.1} from="right">
                <div
                  className="p-5 rounded-xl border border-white/[0.07] bg-[#131D2E]/70 backdrop-blur-sm"
                  style={{
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(0,217,126,0.06)",
                  }}
                >
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: "#00D97E" }}>
                    Output
                  </div>
                  <div className="font-display font-bold text-white text-lg mt-1 tracking-tight">
                    {o.label}
                  </div>
                  <div className="text-sm text-brand-muted mt-1">{o.desc}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-dashed border-brand-amber/40 text-center">
          <span className="text-brand-amber text-xs font-bold uppercase tracking-[0.15em]">
            Every draft is traceable back to the signal that inspired it
          </span>
        </div>
      </div>
    </section>
  );
}
