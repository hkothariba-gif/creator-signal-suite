import { Check } from "lucide-react";
import { WordStagger, FadeUp } from "./words";

const tiers = [
  {
    name: "Starter",
    price: 99,
    features: [
      "Up to 50 creator searches/mo",
      "1 active campaign",
      "YouTube discovery",
      "Email outreach templates",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Growth",
    price: 299,
    features: [
      "Unlimited searches",
      "5 active campaigns",
      "YouTube + Reddit + X",
      "AI outreach sequences",
      "Affiliate & payout tracking",
      "Hotlist CRM (kanban)",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Scale",
    price: 799,
    features: [
      "Everything in Growth",
      "Admin dashboard",
      "Multi-team access",
      "Custom brand voice AI",
      "Priority support",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="bg-brand-gray-soft py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <WordStagger
            text="Simple pricing. Serious capability."
            className="font-display font-extrabold text-4xl lg:text-5xl tracking-[-0.04em] leading-[1.05] text-brand-navy"
          />
          <p className="mt-4 text-brand-text-muted text-lg">
            Choose a plan that scales with your campaigns.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.1}>
              <div
                className={`relative h-full rounded-2xl p-8 flex flex-col bg-white transition-transform ${
                  t.popular
                    ? "border-2 border-brand-green shadow-[0_30px_80px_-30px_rgba(16,185,129,0.45)] md:scale-[1.04]"
                    : "border border-slate-200"
                }`}
              >
                {t.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-green text-white text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                )}
                <div className="font-display font-bold text-xl text-brand-navy tracking-tight">
                  {t.name}
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display font-extrabold text-5xl text-brand-navy tracking-[-0.03em]">
                    ${t.price}
                  </span>
                  <span className="text-brand-text-muted text-sm">/mo</span>
                </div>

                <ul className="mt-6 space-y-3 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#cta"
                  className={`mt-8 inline-flex items-center justify-center rounded-full font-semibold px-5 py-3 transition-colors ${
                    t.popular
                      ? "bg-brand-green hover:bg-brand-green-dark text-white"
                      : "bg-brand-navy hover:bg-slate-800 text-white"
                  }`}
                >
                  {t.cta}
                </a>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
