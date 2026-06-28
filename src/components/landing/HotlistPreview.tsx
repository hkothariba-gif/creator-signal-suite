import { ArrowRight, CheckCircle2 } from "lucide-react";
import { WordStagger, FadeUp } from "./words";
import { YouTubeIcon, RedditIcon, XIcon } from "./PlatformCards";

type Card = {
  name: string;
  platform: "YouTube" | "Reddit" | "X";
  fit: number;
  badge?: { kind: "status" | "money" | "check"; text: string };
};

const cols: { title: string; cards: Card[] }[] = [
  {
    title: "Discovered",
    cards: [
      { name: "Marcus Chen", platform: "YouTube", fit: 92 },
      { name: "r/skincare mod", platform: "Reddit", fit: 88 },
    ],
  },
  {
    title: "Contacted",
    cards: [
      { name: "Lena Park", platform: "X", fit: 85, badge: { kind: "status", text: "Awaiting reply" } },
    ],
  },
  {
    title: "Negotiating",
    cards: [
      { name: "DevWithDan", platform: "YouTube", fit: 90, badge: { kind: "money", text: "$1.2K CPM" } },
    ],
  },
  {
    title: "Onboarded",
    cards: [
      { name: "r/coffee top user", platform: "Reddit", fit: 94, badge: { kind: "check", text: "Live campaign" } },
    ],
  },
];

function PlatformBadge({ p }: { p: Card["platform"] }) {
  if (p === "YouTube") return <YouTubeIcon className="w-4 h-4 text-[#FF0000]" />;
  if (p === "Reddit") return <RedditIcon className="w-4 h-4 text-[#FF4500]" />;
  return <XIcon className="w-3.5 h-3.5 text-white" />;
}

export function HotlistPreview() {
  return (
    <section className="bg-brand-navy py-24 text-white">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 items-center">
        <div>
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-green">
            Hotlist CRM
          </div>
          <WordStagger
            text="Your creator pipeline, organized."
            className="mt-4 font-display font-extrabold text-4xl lg:text-5xl tracking-[-0.04em] leading-[1.05]"
          />
          <p className="mt-5 text-slate-300 text-lg leading-relaxed">
            Move creators from Discovered → Contacted → Onboarded in a visual
            kanban. Every card shows rate, platform, brand-fit score, and your
            last outreach date. No more lost threads in email.
          </p>
          <a
            href="#cta"
            className="mt-8 inline-flex items-center gap-2 text-brand-green hover:text-emerald-300 font-semibold"
          >
            See all features <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <FadeUp>
          <div className="rounded-2xl glass p-4 overflow-x-auto">
            <div className="grid grid-cols-4 gap-3 min-w-[640px]">
              {cols.map((col) => (
                <div key={col.title} className="flex flex-col gap-2">
                  <div className="text-[11px] uppercase tracking-[0.15em] font-semibold text-slate-400 px-2 py-1">
                    {col.title}
                  </div>
                  {col.cards.map((c) => (
                    <div
                      key={c.name}
                      className="rounded-lg bg-white/5 border border-white/10 p-3 hover:border-brand-green/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-semibold text-white truncate">
                          {c.name}
                        </div>
                        <PlatformBadge p={c.platform} />
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{c.platform}</div>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-green/15 text-brand-green">
                          {c.fit}% fit
                        </span>
                        {c.badge && (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              c.badge.kind === "money"
                                ? "bg-amber-500/15 text-amber-400"
                                : c.badge.kind === "check"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-slate-500/15 text-slate-300"
                            }`}
                          >
                            {c.badge.kind === "check" && <CheckCircle2 className="w-2.5 h-2.5" />}
                            {c.badge.text}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
