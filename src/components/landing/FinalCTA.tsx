import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { WordStagger } from "./words";

export function FinalCTA() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  return (
    <section
      id="cta"
      className="relative bg-brand-navy text-white overflow-hidden py-28"
    >
      <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_120%,rgba(16,185,129,0.45),transparent_70%)]" />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <WordStagger
          text="Find the people already talking about what you sell."
          className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl tracking-[-0.04em] leading-[1.05]"
        />
        <p className="mt-6 text-slate-300 text-lg">
          Stop paying for reach. Start paying for relevance.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) setSubmitted(true);
          }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@brand.com"
            className="flex-1 w-full rounded-full bg-white/5 border border-white/15 px-6 py-3.5 text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-green transition-colors"
          />
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-6 py-3.5 transition-colors shadow-[0_8px_30px_-8px_rgba(16,185,129,0.6)]"
          >
            {submitted ? "You're on the list" : "Get Early Access"}
            {!submitted && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-400">
          No credit card required · Setup in 5 minutes · Cancel anytime
        </p>
      </div>
    </section>
  );
}
