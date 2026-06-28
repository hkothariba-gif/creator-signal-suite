import { Counter } from "./words";

const stats = [
  { value: 6.2, suffix: "x", decimals: 1, label: "Average ROI vs Meta Paid Ads" },
  { value: 97, suffix: "M+", decimals: 0, label: "Reddit Daily Active Users with Purchase Intent" },
  { value: 3, suffix: "x", decimals: 0, label: "YouTube Purchase Intent vs Display Ads" },
  { value: 49, suffix: "%", decimals: 0, label: "Higher Engagement on X Creator Posts" },
];

export function StatsBar() {
  return (
    <section className="stats-bar-bg noise-overlay text-white relative">
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
