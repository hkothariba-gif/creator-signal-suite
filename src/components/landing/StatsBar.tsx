import { motion } from "framer-motion";

const stats = [
  { display: "5.4x", label: "Average ROI vs Meta Paid Ads" },
  { display: "85M+", label: "Reddit Daily Active Users with Purchase Intent" },
  { display: "3x", label: "YouTube Purchase Intent vs Display Ads" },
  { display: "43%", label: "Higher Engagement on X Creator Posts" },
];

export function StatsBar() {
  return (
    <section className="noise-overlay text-white relative stats-bar-bg">
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-[100px] grid grid-cols-2 md:grid-cols-4 gap-y-10">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className={`px-4 ${i > 0 ? "md:border-l" : ""}`}
            style={i > 0 ? { borderColor: "rgba(255,255,255,0.15)" } : undefined}
          >
            <div className="stat-number-glow font-display font-extrabold text-5xl md:text-[72px] lg:text-[80px] leading-none tracking-[-0.04em]">
              {s.display}
            </div>
            <div className="mt-4 text-white/85 text-sm md:text-base leading-snug max-w-[240px]">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
