import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "@/components/landing/icons";
import type { ReactNode } from "react";

export const Route = createFileRoute("/app/platforms")({
  component: PlatformsPage,
});

function PlatformsPage() {
  return (
    <AppShell title="Platforms">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Platform Monetization Hub</h2>
        <p className="text-[#8892A4] mt-1">How AspenReach helps you grow on every channel</p>
      </div>

      <div className="monetization-grid">
        <MonoCard
          klass="yt"
          icon={<YouTubeIcon size={22} />}
          title="YouTube Creator Partnerships"
          subtitle="Video sponsorships & integrations"
          steps={[
            "Discover creators by niche, subscriber count & engagement rate",
            "Analyze last 90 days of video performance & audience overlap",
            "Send templated outreach email via YouTube About API",
            "Negotiate deal terms inside AspenReach campaign brief",
            "Track video live date, views, and affiliate conversions",
          ]}
          cta="Find YouTube Creators →"
        />

        <MonoCard
          klass="rd"
          icon={<RedditIcon size={22} />}
          title="Reddit Audience Intelligence"
          subtitle="Cross-platform ad targeting from real signals"
          steps={[
            "AspenReach maps which subreddits discuss your product category",
            "Pulls top-performing content hooks from YouTube campaigns",
            "Generates Reddit Ad copy using proven messaging angles",
            "One-click launch Reddit Promoted Post targeting matched subreddits",
            "Monitor CPM, CTR, and conversions from the Campaigns view",
          ]}
          cta="Launch Reddit Ad →"
          extra={
            <div className="reddit-intel-card mt-4">
              {[
                { name: "r/homelab", meta: "284K members · High engagement" },
                { name: "r/SaaS", meta: "127K members · Strong buyer intent" },
                { name: "r/Entrepreneur", meta: "892K members · Broad reach" },
              ].map((r) => (
                <div key={r.name} className="reddit-subreddit-row">
                  <div>
                    <div className="text-sm font-semibold text-[#F0F4FF]">{r.name}</div>
                    <div className="text-[11px] text-[#8892A4]">{r.meta}</div>
                  </div>
                  <button
                    title="Coming Soon"
                    onClick={() => window.alert("Coming soon — this integration is in beta. Join our early access list.")}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-md border border-[#FF4500]/30 text-[#FF6B35] hover:bg-[#FF4500]/10"
                  >
                    Launch Ad
                  </button>
                </div>
              ))}
            </div>
          }
        />

        <MonoCard
          klass="x"
          icon={<XIcon size={20} bg="black" />}
          title="X Creator Amplification"
          subtitle="DM outreach, whitelisting & paid reach"
          steps={[
            "Find X creators by topic, follower count & recent post engagement",
            "Send DM to accounts with open DMs via X API (public accounts only)",
            "Negotiate creator whitelisting — run ads through their handle",
            "AspenReach converts your best YouTube hooks into X-native ad copy",
            "Launch X Promoted Posts and Amplify Pre-roll from one dashboard",
          ]}
          cta="Find X Creators →"
        />

        <MonoCard
          klass="li"
          icon={<LinkedInIcon size={22} />}
          title="LinkedIn Professional Reviews"
          subtitle="B2B thought leadership & product advocacy"
          steps={[
            "Identify LinkedIn 'Top Voice' contributors in your product's niche",
            "Match by industry, role level (Director+), and post engagement rate",
            "Send personalised outreach brief via LinkedIn message or found email",
            "Co-author or ghost-write LinkedIn article / product review post",
            "Track impressions, profile clicks, and inbound leads from post",
          ]}
          cta="Find LinkedIn Reviewers →"
        />
      </div>
    </AppShell>
  );
}

function MonoCard({
  klass, icon, title, subtitle, steps, cta, extra,
}: {
  klass: "yt" | "rd" | "x" | "li";
  icon: ReactNode; title: string; subtitle: string; steps: string[]; cta: string; extra?: ReactNode;
}) {
  return (
    <div className={`mono-card ${klass}`}>
      <div className="mono-card-header">
        <div className="mono-card-icon">{icon}</div>
        <div>
          <div className="mono-card-title">{title}</div>
          <div className="mono-card-subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="mono-flow">
        {steps.map((s, i) => (
          <div key={i} className="mono-flow-step">
            <span className="mono-flow-step-num">{i + 1}</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
      {extra}
      <button
        className="mono-cta"
        onClick={() => window.alert("Coming soon — this integration is in beta. Join our early access list.")}
      >
        {cta}
      </button>
    </div>
  );
}
