import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import { WordStagger } from "./words";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "./icons";
import { PromptBar } from "./PromptBar";

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

const heroPanels = [
  { name: "YouTube", color: "#FF0000", Icon: YouTubeIcon },
  { name: "LinkedIn", color: "#0A66C2", Icon: LinkedInIcon },
  { name: "Reddit", color: "#FF4500", Icon: RedditIcon },
];

export function Hero() {
  return (
    <section
      className="noise-overlay relative min-h-screen w-full overflow-hidden pt-28 pb-20 flex items-center"
      style={{ background: "#05080F", position: "relative" }}
    >
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
          Affiliate data, social chatter, and scanners in one platform
        </motion.div>

        <WordStagger
          as="h1"
          text="Run affiliate marketing programs to build better advertising and ads."
          className="font-display font-extrabold leading-[1.04]"
          style={{ fontSize: "clamp(32px, 5.5vw, 52px)", color: "#F0F4FF", letterSpacing: "-0.03em" }}
        />

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9 }}
          className="hero-subtext-short mt-5"
        >
          AspenReach reads your affiliate performance, social chatter, and content scanners to find the hooks and
          messaging that convert, then builds the ads for you.
        </motion.p>

        <div className="mt-9">
          <div className="hero-search-halo">
            <PromptBar />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.05 }}
          className="mt-2 flex flex-wrap items-center justify-center gap-3"
        >
          <a
            href="#cta"
            className="btn-primary-cta inline-flex items-center gap-2 rounded-full text-lg h-14 px-8"
          >
            Start building ads <ArrowRight className="w-5 h-5" />
          </a>
          <a
            href="#how"
            className="btn-secondary-cta inline-flex items-center gap-2 rounded-full font-semibold text-lg h-14 px-8"
          >
            <Play className="w-4 h-4" /> See how it works
          </a>
        </motion.div>

        {/* Hero visual: platform intelligence card. Panels light up when the
            data integrations behind them are connected. No fabricated data. */}
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
              {heroPanels.map(({ name, color, Icon }) => (
                <div key={name} className="px-0 md:px-6 first:pl-0 last:pr-0">
                  <Icon size={32} />
                  <div className="mt-3 font-bold text-sm" style={{ color }}>
                    {name}
                  </div>
                  <div
                    className="mt-4 p-4 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs"
                    style={{ color: "#8892A4" }}
                  >
                    Waiting for API connection
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-brand-amber/40 amber-line flex items-center justify-center gap-2">
              <span className="text-brand-amber text-xs font-bold uppercase tracking-[0.15em]">
                Signals from your campaigns appear here once connected
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
