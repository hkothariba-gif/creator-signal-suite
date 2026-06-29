const logos = ["NOTION", "TYPEFORM", "LOOM", "FIGMA", "LINEAR", "FRAMER"];

export function LogoWall() {
  return (
    <section style={{ background: "#05080F" }} className="py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center">
          <div className="section-eyebrow muted">TRUSTED BY GROWTH TEAMS AT</div>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-y-4">
          {logos.map((l) => (
            <span
              key={l}
              style={{
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: "#F0F4FF",
                opacity: 0.35,
                padding: "0 24px",
              }}
            >
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  {
    company: "Stacked Commerce",
    quote:
      "Before AspenReach we spent 3 weeks manually researching YouTube creators. Now we find 40+ qualified leads in an afternoon.",
    name: "Jordan Mills",
    title: "Head of Partnerships",
    seed: "jordan",
  },
  {
    company: "Growthloop",
    quote:
      "The Reddit intelligence feature is unlike anything we've seen. It takes our YouTube campaign data and tells us exactly which subreddits to target.",
    name: "Priya Nair",
    title: "Growth Lead",
    seed: "priya",
  },
];

export function ProofTestimonials() {
  return (
    <section style={{ background: "#05080F" }} className="py-16 md:py-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <h2
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#F0F4FF",
            textAlign: "center",
            letterSpacing: "-0.03em",
          }}
        >
          From teams who stopped guessing
        </h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="testimonial-card-large">
              <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#00D97E] mb-4">
                {t.company}
              </div>
              <p
                className="text-lg leading-relaxed"
                style={{ color: "#F0F4FF", fontWeight: 500 }}
              >
                "{t.quote}"
              </p>
              <div className="mt-6 flex items-center gap-3">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.seed}&backgroundColor=0C1222&radius=50`}
                  width={40}
                  height={40}
                  alt={t.name}
                  style={{ borderRadius: "50%" }}
                />
                <div>
                  <div className="text-sm font-bold" style={{ color: "#F0F4FF" }}>
                    {t.name}
                  </div>
                  <div className="text-xs" style={{ color: "#8892A4" }}>
                    {t.title}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
