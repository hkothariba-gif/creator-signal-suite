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
    <section id="features" className="py-16 md:py-[100px]" style={{ background: "#F4F6F9" }}>
      <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <FadeUp from="left">
          <div
            className="h-full rounded-2xl p-8 bg-white relative overflow-hidden"
            style={{ border: "1px solid #FECACA" }}
          >
            <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: "#EF4444" }} />
            <div className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "#EF4444" }}>
              Without AspenReach
            </div>
            <h3 className="mt-3 font-display font-extrabold text-3xl tracking-[-0.03em]" style={{ color: "#0F172A" }}>
              The old way
            </h3>
            <ul className="mt-6 space-y-4">
              {oldWay.map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] leading-[1.55]" style={{ color: "#0F172A" }}>
                  <span
                    className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(239,68,68,0.12)" }}
                  >
                    <XMark className="w-3 h-3" style={{ color: "#EF4444" }} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </FadeUp>

        <FadeUp from="right">
          <div
            className="h-full rounded-2xl p-8 bg-white relative overflow-hidden"
            style={{ border: "1px solid #BBF7D0" }}
          >
            <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: "#00D97E" }} />
            <div className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "#00D97E" }}>
              With AspenReach
            </div>
            <h3 className="mt-3 font-display font-extrabold text-3xl tracking-[-0.03em]" style={{ color: "#0F172A" }}>
              The AspenReach way
            </h3>
            <ul className="mt-6 space-y-4">
              {newWay.map((t) => (
                <li key={t} className="flex items-start gap-3 text-[15px] leading-[1.55]" style={{ color: "#0F172A" }}>
                  <span
                    className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "rgba(0,217,126,0.12)" }}
                  >
                    <Check className="w-3 h-3" style={{ color: "#00D97E" }} />
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
