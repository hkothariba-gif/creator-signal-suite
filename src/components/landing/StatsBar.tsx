import { Counter } from "./words";

const stats = [
  { value: 6.2, prefix: "$", suffix: "", decimals: 2, label: "Average Creator ROI", sub: "Per $1 spent vs $3.69 on Meta ads" },
  { value: 97, prefix: "", suffix: "M+", decimals: 0, label: "Reddit Intent Signals/Day", sub: "Daily active users with purchase intent" },
  { value: 3, prefix: "", suffix: "x", decimals: 0, label: "YouTube vs Display Ads", sub: "Purchase intent lift from creator content" },
  { value: 49, prefix: "", suffix: "%", decimals: 0, label: "X Creator Engagement Lift", sub: "vs brand posts on X" },
];

export function StatsBar() {
  return (
    <section className="bg-brand-green-dark text-white">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 lg:grid-cols-4 gap-y-10 gap-x-6">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`px-4 ${i > 0 ? "lg:border-l border-white/15" : ""}`}
          >
            <div className="font-display font-bold text-5xl lg:text-6xl tracking-[-0.04em] leading-none">
              <Counter to={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
            </div>
            <div className="mt-3 text-emerald-100 font-semibold text-sm uppercase tracking-[0.1em]">
              {s.label}
            </div>
            <div className="mt-1 text-emerald-200/80 text-xs">{s.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
