import { Check } from "lucide-react";
import { WordStagger, FadeUp } from "./words";

const tiers = [
  {
    name: "Starter",
    price: 99,
    features: ["50 creator searches/mo", "1 active campaign", "YouTube discovery", "Email outreach templates"],
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
      "Hotlist CRM kanban",
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
    <section id="pricing" className="py-16 md:py-[100px]" style={{ background: "#05080F" }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto">
          <WordStagger
            text="Simple pricing. Serious capability."
            className="font-display font-extrabold text-4xl md:text-5xl tracking-[-0.04em] leading-[1.05] text-white"
          />
          <p className="mt-4 text-brand-muted text-lg">No setup fees. No contracts. Cancel anytime.</p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {tiers.map((t, i) => (
            <FadeUp key={t.name} delay={i * 0.1}>
              <div
                className={`relative h-full p-8 flex flex-col transition-all ${
                  t.popular
                    ? "md:scale-[1.04] gradient-border-popular shadow-[0_0_40px_rgba(0,217,126,0.18)]"
                    : "card-elevated"
                }`}
              >
                {t.popular && (
                  <span
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full z-10"
                    style={{ background: "#00D97E", color: "#020A06" }}
                  >
                    Most Popular
                  </span>
                )}

                <div className="font-display font-bold text-xl text-white tracking-tight">{t.name}</div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display font-extrabold text-5xl text-white tracking-[-0.03em]">${t.price}</span>
                  <span className="text-brand-muted text-sm">/mo</span>
                </div>

                <ul className="mt-6 space-y-3 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-200">
                      <Check className="w-4 h-4 text-brand-green mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#cta"
                  className={`mt-8 inline-flex items-center justify-center rounded-full font-semibold px-5 py-3 transition-all hover:scale-[1.02] ${
                    t.popular
                      ? "bg-brand-green hover:bg-brand-green-dark text-white"
                      : "border border-white/30 text-white hover:bg-white/5"
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
