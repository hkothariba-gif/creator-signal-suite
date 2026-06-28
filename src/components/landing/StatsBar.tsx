import { Counter } from "./words";

const stats = [
  { value: 6.2, suffix: "x", decimals: 1, label: "Average ROI vs Meta Paid Ads" },
  { value: 97, suffix: "M+", decimals: 0, label: "Reddit Daily Active Users with Purchase Intent" },
  { value: 3, suffix: "x", decimals: 0, label: "YouTube Purchase Intent vs Display Ads" },
  { value: 49, suffix: "%", decimals: 0, label: "Higher Engagement on X Creator Posts" },
];

export function StatsBar() {
  return (
    <section
      className="noise-overlay text-white relative"
      style={{
        background: "linear-gradient(135deg, #00D97E 0%, #00b368 40%, #059669 70%, #047857 100%)",
        borderTop: "1px solid rgba(255,255,255,0.15)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 -1px 30px rgba(0,217,126,0.3)",
      }}
    >
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-[100px] grid grid-cols-2 md:grid-cols-4 gap-y-10">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`px-4 ${i > 0 ? "md:border-l" : ""}`}
            style={i > 0 ? { borderColor: "rgba(255,255,255,0.15)" } : undefined}
          >
            <div
              className="stat-number-glow font-display font-extrabold text-5xl md:text-[72px] lg:text-[80px] leading-none tracking-[-0.04em]"
            >
              <Counter to={s.value} suffix={s.suffix} decimals={s.decimals} duration={2000} />
            </div>
            <div className="mt-4 text-white/85 text-sm md:text-base leading-snug max-w-[240px]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
