import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { PlatformRevenueTabs } from "@/components/landing/PlatformRevenueTabs";
import { TrustBar } from "@/components/landing/TrustBar";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { AdsIntelligence } from "@/components/landing/AdsIntelligence";
import { HeatMapSection } from "@/components/landing/HeatMapSection";

import { Pricing } from "@/components/landing/Pricing";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AspenReach | The Right Signals. The Right Creators. Ads That Convert." },
      {
        name: "description",
        content:
          "Finally, run influencer marketing and paid media from one seamless base. This is Aspen.",
      },
      { property: "og:title", content: "AspenReach | The Right Signals. The Right Creators. Ads That Convert." },
      {
        property: "og:description",
        content: "Finally, run influencer marketing and paid media from one seamless base. This is Aspen.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="font-display antialiased bg-brand-navy text-white">
      <LandingNav />
      <main>
        <Hero />
        <PlatformRevenueTabs />
        <TrustBar />
        <ProblemSolution />
        <AdsIntelligence />
        <HeatMapSection />
        <Pricing />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
