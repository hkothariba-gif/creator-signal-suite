import { useState } from "react";

const workflowSteps = [
  { label: "Discover", desc: "Find creators by niche, audience & brand fit score" },
  { label: "Outreach", desc: "Multi-channel automated contact cascade" },
  { label: "Track", desc: "Monitor performance across all 4 platforms" },
  { label: "Scale", desc: "Cross-platform intelligence → Reddit & LinkedIn ads" },
];

export function WorkflowTabs() {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <section style={{ background: "#05080F" }} className="py-12 md:py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-center gap-2 md:gap-3 min-w-max mx-auto">
            {workflowSteps.map((s, i) => {
              const active = i === activeStep;
              return (
                <button
                  key={s.label}
                  onClick={() => setActiveStep(i)}
                  className="rounded-full font-bold text-sm transition-all px-5 py-2.5"
                  style={{
                    background: active ? "#00D97E" : "rgba(255,255,255,0.04)",
                    color: active ? "#05080F" : "#F0F4FF",
                    border: active ? "1px solid #00D97E" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: active ? "0 8px 24px rgba(0,217,126,0.25)" : "none",
                  }}
                >
                  {String(i + 1).padStart(2, "0")} · {s.label}
                </button>
              );
            })}
          </div>
        </div>
        <p
          className="text-center"
          style={{
            fontSize: 15,
            color: "#8892A4",
            maxWidth: 480,
            margin: "20px auto 0",
            lineHeight: 1.5,
          }}
        >
          {workflowSteps[activeStep].desc}
        </p>
        <div className="section-divider mt-12" />
      </div>
    </section>
  );
}
