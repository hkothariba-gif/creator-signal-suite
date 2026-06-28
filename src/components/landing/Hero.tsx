import { ArrowRight, Play, Star } from "lucide-react";
import { motion } from "framer-motion";
import { WordStagger } from "./words";
import { YouTubeIcon, RedditIcon, XIcon } from "./icons";

const platforms = [
  { Icon: YouTubeIcon, glow: "rgba(255,0,0,0.55)", bg: "rgba(255,0,0,0.12)", border: "rgba(255,0,0,0.4)" },
  { Icon: RedditIcon, glow: "rgba(255,69,0,0.55)", bg: "rgba(255,69,0,0.12)", border: "rgba(255,69,0,0.4)" },
  { Icon: (p: { size?: number }) => <XIcon size={p.size} bg="none" className="[&_path]:fill-white" />, glow: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.08)", border: "rgba(255,255,255,0.3)" },
];

export function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-brand-navy pt-28 pb-20 flex items-center">
      {/* drifting blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full blob-1"
          style={{ background: "radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-40 w-[800px] h-[800px] rounded-full blob-2"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,0.08), transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full blob-3"
          style={{ background: "radial-gradient(circle, rgba(255,69,0,0.06), transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-[900px] mx-auto px-6 text-center w-full">
        {/* Platform icons row */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {platforms.map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 14, delay: i * 0.2 }}
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center border"
              style={{ background: p.bg, borderColor: p.border, boxShadow: `0 0 32px ${p.glow}, inset 0 0 12px rgba(255,255,255,0.04)` }}
            >
              <p.Icon size={26} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-brand-green text-xs font-semibold uppercase tracking-[0.15em] mb-6"
        >
          YouTube · Reddit · X — Creator Intelligence
        </motion.div>

        <WordStagger
          as="h1"
          text="Find, Onboard and Scale with Creators That Actually Align with Your Audience"
          className="text-white font-display font-extrabold text-[44px] md:text-[64px] lg:text-[72px] leading-[1.04] tracking-[-0.04em]"
        />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-7 mx-auto max-w-[680px] text-brand-muted text-lg md:text-xl leading-[1.65]"
        >
          AspenReach maps brand-fit, reach, and buyer intent across YouTube, Reddit, and X. Stop guessing which
          creators convert. Start building partnerships that actually move product.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.05 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-2"
        >
          <a
            href="#cta"
            className="inline-flex items-center gap-2 rounded-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-lg h-14 px-8 transition-all hover:scale-[1.02]"
          >
            Get Early Access <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 text-white font-semibold text-lg h-14 px-8 hover:bg-white/5 transition-all hover:scale-[1.02]"
          >
            <Play className="w-4 h-4" /> Watch 2-min Demo
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-brand-muted"
        >
          <div className="flex -space-x-2">
            {["AK", "JM", "RS", "TL", "EC"].map((i, idx) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-brand-navy text-white text-[10px] font-bold flex items-center justify-center"
                style={{
                  background: ["#10B981", "#F59E0B", "#FF4500", "#3B82F6", "#8B5CF6"][idx],
                }}
              >
                {i}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-brand-amber text-brand-amber" />
              ))}
            </div>
            <span className="font-semibold text-white">4.9/5</span>
            <span>· Join 200+ growth teams on the waitlist</span>
          </div>
        </motion.div>

        {/* Hero visual: platform split card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.2 }}
          className="mt-16 max-w-[1100px] mx-auto"
        >
          <div className="glass-dark rounded-3xl p-6 md:p-8 text-left shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x divide-white/[0.08]">
              {/* YouTube */}
              <div className="px-0 md:px-6 first:pl-0 last:pr-0">
                <YouTubeIcon size={32} />
                <div className="mt-3 text-[#FF0000] font-bold text-sm">YouTube</div>
                <div className="mt-1 text-brand-muted text-xs">340K subscribers · 6.2% eng rate</div>
                <div className="mt-4 text-white text-sm font-semibold">TechWithMarcus</div>
                <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  Tech Reviews
                </span>
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] text-brand-muted uppercase tracking-wider mb-1">
                    <span>Brand-Fit Score</span>
                    <span className="text-brand-green font-bold">94%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "94%" }}
                      transition={{ duration: 1.4, delay: 1.8, ease: "easeOut" }}
                      className="h-full bg-brand-green"
                    />
                  </div>
                </div>
              </div>

              {/* Reddit */}
              <div className="px-0 md:px-6 md:-mt-3 md:shadow-[0_0_40px_rgba(16,185,129,0.15)] md:rounded-2xl">
                <RedditIcon size={32} />
                <div className="mt-3 text-[#FF4500] font-bold text-sm">Reddit</div>
                <div className="mt-1 text-brand-muted text-xs">r/homelab · 847K members</div>
                <div className="mt-3 p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-300 text-xs italic leading-relaxed">
                  "Just switched to [brand] and honestly the setup took 10 minutes..."
                </div>
                <span className="mt-3 inline-block text-[10px] font-bold px-2 py-1 rounded-full bg-brand-green/15 text-brand-green">
                  89% MATCH
                </span>
              </div>

              {/* X */}
              <div className="px-0 md:px-6">
                <XIcon size={32} bg="white" />
                <div className="mt-3 text-white font-bold text-sm">X / Twitter</div>
                <div className="mt-1 text-brand-muted text-xs">@buildinpublic_sara · 128K followers</div>
                <span className="mt-3 inline-block text-[10px] font-bold px-2 py-1 rounded-full bg-brand-green/15 text-brand-green">
                  FOLLOWER QUALITY 91
                </span>
                <div className="mt-3 text-slate-400 text-xs italic">
                  "Been using this for 3 weeks now and wow..."
                </div>
              </div>
            </div>

            {/* Budget cap dashed line */}
            <div className="mt-8 pt-6 border-t border-dashed border-brand-green/40 amber-line flex items-center justify-center gap-2">
              <span className="text-brand-amber text-xs font-bold uppercase tracking-[0.15em]">
                Budget Cap: $1,200 CPM
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
