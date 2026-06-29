import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { WorkflowTabs } from "@/components/landing/WorkflowTabs";
import { TrustBar } from "@/components/landing/TrustBar";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { LinkedInRevenue } from "@/components/landing/LinkedInRevenue";
import { StatsBar } from "@/components/landing/StatsBar";
import { LogoWall, ProofTestimonials } from "@/components/landing/LogoWall";
import { HeatMapSection } from "@/components/landing/HeatMapSection";
import { PlatformCards } from "@/components/landing/PlatformCards";
import { Testimonials } from "@/components/landing/Testimonials";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AspenReach — Creator Intelligence for YouTube, Reddit & X" },
      {
        name: "description",
        content:
          "AspenReach maps brand-fit, reach, and buyer intent across YouTube, Reddit, and X — so growth teams find creators who actually convert.",
      },
      { property: "og:title", content: "AspenReach — Creator Intelligence Platform" },
      {
        property: "og:description",
        content: "Stop paying for reach. Start paying for relevance.",
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
        <WorkflowTabs />
        <TrustBar />
        <ProblemSolution />
        <LinkedInRevenue />
        <StatsBar />
        <LogoWall />
        <ProofTestimonials />
        <HeatMapSection />
        <PlatformCards />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
