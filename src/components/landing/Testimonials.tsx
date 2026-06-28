import { Star } from "lucide-react";
import { WordStagger, FadeUp } from "./words";

const items = [
  {
    quote: "We found Reddit micro-influencers who already had threads about our product. First campaign: 8x ROAS.",
    role: "Head of Growth · DTC Skincare Brand",
    tag: "Reddit Campaign",
    color: "#FF4500",
  },
  {
    quote:
      "The heat map alone is worth it. I can see in 10 seconds which YouTube creators are in budget AND actually fit our audience.",
    role: "Performance Marketing Lead · SaaS Company",
    tag: "YouTube Campaign",
    color: "#FF0000",
  },
  {
    quote:
      "Replaced our influencer agency for scouting. AspenReach does in one hour what used to take a week of back-and-forth.",
    role: "Founder · E-commerce Brand",
    tag: "Multi-Platform",
    color: "#10B981",
  },
];

export function Testimonials() {
  return (
    <section className="bg-brand-off-white py-16 md:py-[100px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <WordStagger
            text="Growth teams are done guessing"
            className="font-display font-extrabold text-4xl md:text-5xl tracking-[-0.04em] leading-[1.05] text-brand-navy"
          />
          <p className="mt-4 text-brand-text-muted text-lg">
            Real results from real campaigns on YouTube, Reddit, and X
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((t, i) => (
            <FadeUp key={t.role} delay={i * 0.1}>
              <div className="h-full rounded-3xl p-8 bg-white border border-black/[0.06] shadow-lg">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, k) => (
                    <Star key={k} className="w-4 h-4 fill-brand-amber text-brand-amber" />
                  ))}
                </div>
                <p className="text-brand-navy text-lg leading-relaxed font-medium tracking-tight">"{t.quote}"</p>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-brand-text-muted">{t.role}</div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-1 rounded-full"
                    style={{ background: `${t.color}18`, color: t.color }}
                  >
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
