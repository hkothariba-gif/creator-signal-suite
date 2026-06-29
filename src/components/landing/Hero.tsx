import { ArrowRight, Play, Star } from "lucide-react";
import { motion } from "framer-motion";
import { WordStagger } from "./words";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "./icons";

const platforms = [
  {
    Icon: YouTubeIcon,
    shadow: "0 0 0 1px rgba(255,0,0,0.4), 0 0 20px rgba(255,0,0,0.35), 0 0 40px rgba(255,0,0,0.15)",
  },
  {
    Icon: RedditIcon,
    shadow: "0 0 0 1px rgba(255,69,0,0.4), 0 0 20px rgba(255,69,0,0.35), 0 0 40px rgba(255,69,0,0.15)",
  },
  {
    Icon: (p: { size?: number }) => <XIcon size={p.size} bg="none" className="[&_path]:fill-white" />,
    shadow: "0 0 0 1px rgba(255,255,255,0.2), 0 0 20px rgba(255,255,255,0.15), 0 0 40px rgba(255,255,255,0.08)",
  },
  {
    Icon: LinkedInIcon,
    shadow: "0 0 0 1px rgba(10,102,194,0.45), 0 0 20px rgba(10,102,194,0.4), 0 0 40px rgba(10,102,194,0.18)",
  },
];

export function Hero() {
  return (
    <section
      className="noise-overlay relative min-h-screen w-full overflow-hidden pt-28 pb-20 flex items-center"
      style={{ background: "#05080F", position: "relative" }}
    >
      {/* Blob 1 — green, bottom-left */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 700,
          left: -150,
          bottom: -200,
          background: "radial-gradient(circle, rgba(0,217,126,0.55) 0%, rgba(0,217,126,0.0) 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Blob 2 — violet, top-right */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          right: -100,
          top: -100,
          background: "radial-gradient(circle, rgba(124,58,237,0.45) 0%, rgba(124,58,237,0.0) 70%)",
          filter: "blur(80px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Blob 3 — green secondary, center-top */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          left: "50%",
          top: 0,
          transform: "translateX(-50%)",
          background: "radial-gradient(circle, rgba(0,217,126,0.25) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div className="relative max-w-[900px] mx-auto px-6 text-center w-full" style={{ zIndex: 1 }}>
        {/* Platform icons row */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {platforms.map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 14, delay: i * 0.2 }}
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center"
              style={{
                background: "#131D2E",
                boxShadow: p.shadow,
              }}
            >
              <p.Icon size={26} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="eyebrow mb-6"
        >
          YouTube · Reddit · X · LinkedIn — Creator Intelligence
        </motion.div>

        <WordStagger
          as="h1"
          text="Find, Onboard and Scale with Creators That Actually Align with Your Audience"
          className="font-display font-extrabold leading-[1.04]"
          style={{ fontSize: "clamp(40px, 8vw, 72px)", color: "#F0F4FF", letterSpacing: "-0.04em" }}
        />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="mt-7 mx-auto max-w-[680px] text-lg md:text-xl leading-[1.65]"
          style={{ color: "#8892A4" }}
        >
          AspenReach maps brand-fit, reach, and buyer intent across YouTube, Reddit, and X. Stop guessing which
          creators convert. Start building partnerships that actually move product.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.05 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#cta"
            className="btn-primary-cta inline-flex items-center gap-2 rounded-full text-lg h-14 px-8"
          >
            Get Early Access <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#how"
            className="btn-secondary-cta inline-flex items-center gap-2 rounded-full font-semibold text-lg h-14 px-8"
          >
            <Play className="w-4 h-4" /> Watch 2-min Demo
          </a>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm"
          style={{ color: "#8892A4" }}
        >
          <div className="flex -space-x-2">
            {["AK", "JM", "RS", "TL", "EC"].map((i, idx) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 text-white text-[10px] font-bold flex items-center justify-center"
                style={{
                  borderColor: "#05080F",
                  background: ["#00D97E", "#F59E0B", "#FF4500", "#7C3AED", "#3B82F6"][idx],
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
            <span className="font-semibold" style={{ color: "#F0F4FF" }}>4.9/5</span>
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
          <div
            className="p-6 md:p-8 text-left rounded-2xl"
            style={{
              background: "rgba(19,29,46,0.7)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(0,217,126,0.06)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0 md:divide-x divide-white/[0.07]">
              {/* YouTube */}
              <div className="px-0 md:px-6 first:pl-0 last:pr-0">
                <YouTubeIcon size={32} />
                <div className="mt-3 text-[#FF0000] font-bold text-sm">YouTube</div>
                <div className="mt-1 text-xs" style={{ color: "#8892A4" }}>340K subscribers · 6.2% eng rate</div>
                <div className="mt-4 text-sm font-semibold" style={{ color: "#F0F4FF" }}>TechWithMarcus</div>
                <span className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full bg-white/10" style={{ color: "#8892A4" }}>
                  Tech Reviews
                </span>
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1" style={{ color: "#8892A4" }}>
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
              <div className="px-0 md:px-6 md:-mt-3 md:shadow-[0_0_40px_rgba(0,217,126,0.15)] md:rounded-2xl">
                <RedditIcon size={32} />
                <div className="mt-3 text-[#FF4500] font-bold text-sm">Reddit</div>
                <div className="mt-1 text-xs" style={{ color: "#8892A4" }}>r/homelab · 847K members</div>
                <div className="mt-3 p-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs italic leading-relaxed" style={{ color: "#8892A4" }}>
                  "Just switched to [brand] and honestly the setup took 10 minutes..."
                </div>
                <span className="mt-3 inline-block text-[10px] font-bold px-2 py-1 rounded-full bg-brand-green/15 text-brand-green">
                  89% MATCH
                </span>
              </div>

              {/* X */}
              <div className="px-0 md:px-6">
                <XIcon size={32} bg="white" />
                <div className="mt-3 font-bold text-sm" style={{ color: "#F0F4FF" }}>X / Twitter</div>
                <div className="mt-1 text-xs" style={{ color: "#8892A4" }}>@buildinpublic_sara · 128K followers</div>
                <span className="mt-3 inline-block text-[10px] font-bold px-2 py-1 rounded-full bg-brand-green/15 text-brand-green">
                  FOLLOWER QUALITY 91
                </span>
                <div className="mt-3 text-xs italic" style={{ color: "#8892A4" }}>
                  "Been using this for 3 weeks now and wow..."
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-brand-amber/40 amber-line flex items-center justify-center gap-2">
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
