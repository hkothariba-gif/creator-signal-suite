import { Check, X as XMark } from "lucide-react";
import { FadeUp } from "./words";

const oldWay = [
  "Manually searching creator databases with outdated follower counts",
  "No idea if a creator's audience actually matches your ICP",
  "Spending weeks on outreach with 3% reply rates",
  "Paying for reach that doesn't convert",
  "Spreadsheets, DMs, and guesswork",
];

const newWay = [
  "Live data from YouTube, Reddit, and X — not stale lists",
  "Brand-Fit Score shows audience alignment before you reach out",
  "AI outreach sequences with 40%+ reply rates",
  "Only pay for creators whose audience matches your buyer",
  "One dashboard: discover → onboard → track → pay",
];

export function ProblemSolution() {
  return (
    <section id="features" className="bg-brand-navy py-28 md:py-32">
      <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <FadeUp from="left">
          <div className="h-full rounded-3xl p-8 border bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.3)]">
            <div className="text-red-400 text-xs font-bold uppercase tracking-[0.15em]">Without AspenReach</div>
            <h3 className="mt-3 text-white font-display font-extrabold text-3xl tracking-[-0.03em]">The old way</h3>
            <ul className="mt-6 space-y-4">
              {oldWay.map((t) => (
                <li key={t} className="flex items-start gap-3 text-slate-300 text-[15px] leading-[1.55]">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                    <XMark className="w-3 h-3 text-red-400" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </FadeUp>

        <FadeUp from="right">
          <div className="h-full rounded-3xl p-8 border bg-[rgba(16,185,129,0.04)] border-[rgba(16,185,129,0.3)]">
            <div className="text-brand-green text-xs font-bold uppercase tracking-[0.15em]">With AspenReach</div>
            <h3 className="mt-3 text-white font-display font-extrabold text-3xl tracking-[-0.03em]">
              The AspenReach way
            </h3>
            <ul className="mt-6 space-y-4">
              {newWay.map((t) => (
                <li key={t} className="flex items-start gap-3 text-slate-200 text-[15px] leading-[1.55]">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-brand-green/20 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-brand-green" />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
