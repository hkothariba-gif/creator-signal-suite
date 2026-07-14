import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { WordStagger } from "./words";

export function FinalCTA() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  return (
    <section
      id="cta"
      className="noise-overlay relative text-white overflow-hidden min-h-screen flex items-center py-28"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(0,217,126,0.18) 0%, transparent 70%), #05080F",
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,217,126,0.15), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 text-center w-full">
        <WordStagger
          text="Find, Onboard and Scale with Creators That Actually Align"
          className="font-display font-extrabold text-4xl md:text-6xl lg:text-[72px] tracking-[-0.04em] leading-[1.05] text-white"
        />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email) navigate({ to: "/signup" });
          }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-3 max-w-xl mx-auto"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your work email"
            className="flex-1 w-full rounded-full bg-white/5 border border-white/15 px-6 h-14 text-white placeholder:text-brand-muted focus:outline-none focus:border-brand-green transition-colors"
          />
          <button
            type="submit"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-brand-green hover:bg-brand-green-dark text-white font-semibold px-7 h-14 transition-all hover:scale-[1.02]"
          >
            Get Early Access
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-6 text-[13px] text-brand-muted">
          No credit card required · Cancel anytime
        </p>
      </div>
    </section>
  );
}
