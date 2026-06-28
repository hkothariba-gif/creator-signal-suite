import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import { WordStagger } from "./words";
import { ScatterPlot } from "./ScatterPlot";

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-brand-navy pt-24 pb-16">
      <div className="absolute inset-0 mesh-bg" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.6))]" />

      <div className="relative max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-block text-[11px] font-semibold tracking-[0.15em] uppercase text-brand-green"
          >
            Creator Intelligence Platform
          </motion.span>

          <WordStagger
            as="h1"
            text="Find the creators already talking about what you sell."
            className="mt-5 text-white font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-[-0.04em]"
          />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-6 max-w-xl text-slate-300 text-lg leading-relaxed"
          >
            AspenReach maps brand-fit, reach, and audience intent across YouTube,
            Reddit, and X — so you stop guessing and start converting.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a
              href="#cta"
              className="inline-flex items-center gap-2 rounded-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-6 py-3 transition-colors shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)]"
            >
              Get Early Access <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 text-white font-semibold px-6 py-3 hover:bg-white/5 transition-colors"
            >
              <Play className="w-4 h-4" /> Watch Demo
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 1 }}
            className="mt-10 flex flex-wrap items-center gap-3 text-xs text-slate-400"
          >
            <span className="uppercase tracking-[0.15em]">
              Trusted by growth teams at
            </span>
            {["NORTHWIND", "LUMEN", "OAKBYTE"].map((n) => (
              <span
                key={n}
                className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 font-semibold tracking-wider"
              >
                {n}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Right: heat map preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative"
        >
          <div className="glass rounded-2xl p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-400 uppercase tracking-[0.15em]">
                Creator Heat Map
              </div>
              <div className="flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400/70" />
                <span className="w-2 h-2 rounded-full bg-amber-400/70" />
                <span className="w-2 h-2 rounded-full bg-emerald-400/70" />
              </div>
            </div>
            <ScatterPlot width={460} height={340} showTooltip />
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              "↑ 6.2x ROI vs paid social",
              "3 platforms, 1 dashboard",
              "Live signals, not stale lists",
            ].map((t, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.9 + i * 0.12 }}
                className="text-[11px] font-semibold text-slate-200 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-center"
              >
                {t}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
