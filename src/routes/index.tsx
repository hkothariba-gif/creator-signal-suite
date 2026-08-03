import { createFileRoute } from "@tanstack/react-router";
import AspenHome from "@/aspen/AspenHome";

// The Aspen design replaces the previous dark landing. The old section
// components that used to build this page (LandingNav, Hero, TrustBar,
// Pricing, LandingFooter, …) were deleted once nothing imported them; they
// are in git history if any of that copy is needed again. Only
// components/landing/icons survives — app.platforms and PlatformTrustBar
// still use it.
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aspen | The right signals. The right creators. Ads that convert." },
      {
        name: "description",
        content:
          "Find the creators your buyers already trust across YouTube, Reddit, X and LinkedIn, then turn what works into ads. Now in private early access.",
      },
      {
        property: "og:title",
        content: "Aspen | The right signals. The right creators. Ads that convert.",
      },
      {
        property: "og:description",
        content:
          "Find the creators your buyers already trust across YouTube, Reddit, X and LinkedIn, then turn what works into ads. Now in private early access.",
      },
    ],
  }),
  component: Landing,
});

// Wrapped rather than passed directly: TanStack's RouteComponent expects a
// function component, and AspenHome is a class (the design export is a class
// component). This also matches how the other routes here are written.
function Landing() {
  return <AspenHome />;
}
