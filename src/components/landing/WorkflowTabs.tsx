import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Send, BarChart3, TrendingUp } from "lucide-react";

const workflowSteps = [
  { label: "Discover", desc: "Find creators by niche, audience & brand fit score", Icon: Search },
  { label: "Outreach", desc: "Multi-channel automated contact cascade", Icon: Send },
  { label: "Track", desc: "Monitor performance across all 4 platforms", Icon: BarChart3 },
  { label: "Scale", desc: "Cross-platform intelligence → Reddit & LinkedIn ads", Icon: TrendingUp },
];

export function WorkflowTabs() {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <section className="bg-bg-base py-12 md:py-16">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-center gap-2 md:gap-3 min-w-max mx-auto">
            {workflowSteps.map((s, i) => {
              const active = i === activeStep;
              return (
                <button
                  key={s.label}
                  onClick={() => setActiveStep(i)}
                  className={`inline-flex items-center gap-2 rounded-full font-bold text-sm transition-all px-5 py-2.5 ${
                    active ? "btn-primary-cta" : "btn-secondary-cta"
                  }`}
                >
                  <s.Icon className="w-4 h-4" />
                  {String(i + 1).padStart(2, "0")} · {s.label}
                </button>
              );
            })}
          </div>
        </div>
        <motion.p
          key={activeStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mt-5 text-brand-muted text-[15px] max-w-[480px] mx-auto leading-relaxed"
        >
          {workflowSteps[activeStep].desc}
        </motion.p>
        <div className="section-divider mt-12" />
      </div>
    </section>
  );
}
