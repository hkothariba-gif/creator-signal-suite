import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { DataGate, useConnectorStatus } from "@/components/app/DataGate";
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
  label: string;
}[] = [
  {
    klass: "yt",
    icon: <YouTubeIcon size={22} />,
    title: "YouTube Creator Partnerships",
    subtitle: "Video sponsorships and integrations",
    tag: "Video",
    label: "Loads from the YouTube connection",
  },
  {
    klass: "rd",
    icon: <RedditIcon size={22} />,
    title: "Reddit Audience Intelligence",
    subtitle: "Ad targeting from community signals",
    tag: "Ads",
    label: "Loads from the Reddit connection",
  },
  {
    klass: "x",
    icon: <XIcon size={22} bg="none" className="[&_path]:fill-white" />,
    title: "X Creator Amplification",
    subtitle: "DM outreach, whitelisting, and paid reach",
    tag: "Social",
    label: "Loads from the X connection",
  },
  {
    klass: "li",
    icon: <LinkedInIcon size={22} />,
    title: "LinkedIn Professional Reviews",
    subtitle: "B2B thought leadership and product advocacy",
    tag: "B2B",
    label: "Loads once the LinkedIn connection is available",
  },
];

function PlatformsPage() {
  const status = useConnectorStatus();
  const p = status.data?.platform;

  const connectedFor = (klass: Klass): boolean | undefined => {
    if (!status.data) return undefined;
    if (klass === "yt") return p!.youtube;
    if (klass === "rd") return p!.reddit;
    if (klass === "x") return p!.x;
    return false;
  };

  return (
    <AppShell title="Platforms">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Platform Monetization Hub</h2>
        <p className="text-[#8892A4] mt-1">Each panel activates when its platform connection is configured</p>
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
              <DataGate
                connected={connectedFor(c.klass)}
                empty
                loading={status.isLoading}
                label={c.label}
              >
                <></>
              </DataGate>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
