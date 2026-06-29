import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "@/components/landing/icons";
import type { ReactNode } from "react";

export const Route = createFileRoute("/app/platforms")({
  component: PlatformsPage,
});

type Klass = "yt" | "rd" | "x" | "li";

const cards: {
  klass: Klass;
  icon: ReactNode;
  title: string;
  subtitle: string;
  tag: string;
  steps: string[];
  cta: string;
}[] = [
  {
    klass: "yt",
    icon: <YouTubeIcon size={22} />,
    title: "YouTube Creator Partnerships",
    subtitle: "Video sponsorships & integrations",
    tag: "Video",
    steps: [
      "Discover creators by niche, subscriber count & engagement rate",
      "Analyze last 90 days of video performance & audience overlap",
      "Send templated outreach email via YouTube About API",
      "Negotiate deal terms inside AspenReach campaign brief",
      "Track video live date, views, and affiliate conversions",
    ],
    cta: "Find YouTube Creators →",
  },
  {
    klass: "rd",
    icon: <RedditIcon size={22} />,
    title: "Reddit Audience Intelligence",
    subtitle: "Cross-platform ad targeting from real signals",
    tag: "Ads",
    steps: [
      "AspenReach maps which subreddits discuss your product category",
      "Pulls top-performing content hooks from YouTube campaigns",
      "Generates Reddit Ad copy using proven messaging angles",
      "One-click launch Reddit Promoted Post targeting matched subreddits",
      "Monitor CPM, CTR, and conversions from the Campaigns view",
    ],
    cta: "Launch Reddit Ad →",
  },
  {
    klass: "x",
    icon: <XIcon size={22} bg="none" className="[&_path]:fill-white" />,
    title: "X Creator Amplification",
    subtitle: "DM outreach, whitelisting & paid reach",
    tag: "Social",
    steps: [
      "Find X creators by topic, follower count & recent post engagement",
      "Send DM to accounts with open DMs via X API (public accounts only)",
      "Negotiate creator whitelisting — run ads through their handle",
      "AspenReach converts your best YouTube hooks into X-native ad copy",
      "Launch X Promoted Posts and Amplify Pre-roll from one dashboard",
    ],
    cta: "Find X Creators →",
  },
  {
    klass: "li",
    icon: <LinkedInIcon size={22} />,
    title: "LinkedIn Professional Reviews",
    subtitle: "B2B thought leadership & product advocacy",
    tag: "B2B",
    steps: [
      "Identify LinkedIn 'Top Voice' contributors in your product's niche",
      "Match by industry, role level (Director+), and post engagement rate",
      "Send personalised outreach brief via LinkedIn message or found email",
      "Co-author or ghost-write LinkedIn article / product review post",
      "Track impressions, profile clicks, and inbound leads from post",
    ],
    cta: "Find LinkedIn Reviewers →",
  },
];

function PlatformsPage() {
  return (
    <AppShell title="Platforms">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Platform Monetization Hub</h2>
        <p className="text-[#8892A4] mt-1">How AspenReach helps you grow on every channel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((c) => (
          <div key={c.klass} className={`platform-mono-card ${c.klass}`}>
            <div className="platform-card-logo-banner">
              <div className="platform-card-logo-icon">{c.icon}</div>
              <div>
                <div className="platform-card-logo-title">{c.title}</div>
                <div className="platform-card-logo-sub">{c.subtitle}</div>
              </div>
              <span className="platform-card-tag">{c.tag}</span>
            </div>
            <div className="platform-card-body">
              <ul className="platform-step-list">
                {c.steps.map((s, i) => (
                  <li key={i} className="platform-step-item">
                    <span className="platform-step-num">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
              <button
                className="platform-card-cta"
                onClick={() =>
                  window.alert("Coming soon — this integration is in beta. Join our early access list.")
                }
              >
                {c.cta}
              </button>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
