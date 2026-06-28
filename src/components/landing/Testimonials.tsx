import { Star } from "lucide-react";
import { WordStagger, FadeUp } from "./words";

const items = [
  {
    quote:
      "We found 3 Reddit micro-influencers who already had threads about our product. First campaign did 8x ROAS.",
    role: "Head of Growth, DTC Brand",
    tag: "Reddit outreach",
  },
  {
    quote:
      "The heat map alone is worth it. I can see in 10 seconds which creators are in our budget AND actually fit.",
    role: "Performance Marketing Lead",
    tag: "YouTube campaign",
  },
  {
    quote:
      "Replaced our agency for creator scouting. AspenReach does in an hour what used to take a week.",
    role: "Founder, E-commerce Brand",
    tag: "X scouting",
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        <WordStagger
          text="Built for growth teams who are done guessing."
          className="font-display font-extrabold text-4xl lg:text-5xl tracking-[-0.04em] leading-[1.05] text-brand-navy max-w-3xl"
        />

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <FadeUp key={t.role} delay={i * 0.1}>
              <div className="glass-light rounded-2xl p-7 h-full shadow-[0_10px_40px_-20px_rgba(15,23,42,0.15)]">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="w-4 h-4 fill-brand-amber text-brand-amber" />
                  ))}
                </div>
                <p className="text-brand-navy text-lg leading-relaxed font-medium tracking-tight">
                  "{t.quote}"
                </p>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-brand-text-muted">
                    {t.role}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-1 rounded-full bg-brand-green/10 text-brand-green">
                    {t.tag}
                  </span>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
