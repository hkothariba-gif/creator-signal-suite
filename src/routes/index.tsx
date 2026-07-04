import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { PlatformRevenueTabs } from "@/components/landing/PlatformRevenueTabs";
import { TrustBar } from "@/components/landing/TrustBar";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { LinkedInRevenue } from "@/components/landing/LinkedInRevenue";
import { HeatMapSection } from "@/components/landing/HeatMapSection";
import { PlatformCards } from "@/components/landing/PlatformCards";
import { Pricing } from "@/components/landing/Pricing";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AspenReach | Creator Intelligence for YouTube, LinkedIn, and Reddit" },
      {
        name: "description",
        content:
          "Run affiliate marketing programs to build better advertising and ads. AspenReach learns from YouTube, LinkedIn, and Reddit, then publishes ads to Reddit, X, and YouTube.",
      },
      { property: "og:title", content: "AspenReach | Creator Intelligence Platform" },
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
        <PlatformRevenueTabs />
        <TrustBar />
        <ProblemSolution />
        <LinkedInRevenue />
        <HeatMapSection />
        <PlatformCards />
        <Pricing />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
