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
      className="text-white"
      style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-2 lg:grid-cols-4 gap-y-10">
        {stats.map((s, i) => (
          <div key={s.label} className={`px-4 ${i > 0 ? "lg:border-l border-white/20" : ""}`}>
            <div className="font-display font-extrabold text-5xl lg:text-[80px] leading-none tracking-[-0.04em]">
              <Counter to={s.value} suffix={s.suffix} decimals={s.decimals} />
            </div>
            <div className="mt-4 text-white/85 text-sm md:text-base leading-snug max-w-[240px]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
