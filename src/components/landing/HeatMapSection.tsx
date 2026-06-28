import { Target, DollarSign, CheckCircle2 } from "lucide-react";
import { WordStagger, FadeUp } from "./words";
import { ScatterPlot } from "./ScatterPlot";

const features = [
  {
    icon: Target,
    title: "2D Brand-Fit Scatter Plot",
    body: "Every creator is plotted by Reach (X-axis) and Brand-Fit Score (Y-axis), calculated from audience overlap, topic relevance, and engagement quality.",
  },
  {
    icon: DollarSign,
    title: "Draggable Budget Cap Line",
    body: "Drag the amber line to your CPM limit. The chart instantly filters to creators within your budget — no spreadsheet required.",
  },
  {
    icon: CheckCircle2,
    title: "Best Match Zone",
    body: "The green quadrant shows creators with both high reach AND high brand-fit. These are your highest-probability partnerships.",
  },
];

export function HeatMapSection() {
  return (
    <section id="how" className="bg-white py-24">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-green">
            Creator Discovery
          </div>
          <WordStagger
            text="Stop searching. Start seeing who fits."
            className="mt-4 font-display font-extrabold text-4xl lg:text-5xl tracking-[-0.04em] leading-[1.05] text-brand-navy"
          />
          <p className="mt-5 text-brand-text-muted text-lg leading-relaxed">
            A spreadsheet of 500 creators is not a strategy. AspenReach renders
            your entire creator universe in a single, decision-ready chart.
          </p>

          <div className="mt-10 space-y-6">
            {features.map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.1}>
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center shrink-0">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-brand-navy tracking-tight">
                      {f.title}
                    </h3>
                    <p className="mt-1 text-brand-text-muted leading-relaxed">
                      {f.body}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>

        <FadeUp>
          <div className="rounded-3xl bg-brand-navy p-6 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.5)]">
            <ScatterPlot width={520} height={400} animate />
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-green/15 text-brand-green px-3 py-1.5 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
              Currently showing 47 creators in budget
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
