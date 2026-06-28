import { createFileRoute } from "@tanstack/react-router";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { StatsBar } from "@/components/landing/StatsBar";
import { HeatMapSection } from "@/components/landing/HeatMapSection";
import { PlatformCards } from "@/components/landing/PlatformCards";
import { HotlistPreview } from "@/components/landing/HotlistPreview";
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
          "AspenReach maps brand-fit, reach, and audience intent across YouTube, Reddit, and X so growth teams find creators who actually convert.",
      },
      { property: "og:title", content: "AspenReach — Creator Intelligence Platform" },
      {
        property: "og:description",
        content:
          "Stop guessing. See which creators are already talking about what you sell — and which ones convert.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="font-display antialiased bg-white text-brand-navy">
      <LandingNav />
      <main>
        <Hero />
        <StatsBar />
        <HeatMapSection />
        <PlatformCards />
        <HotlistPreview />
        <Testimonials />
        <Pricing />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
