import { useState } from "react";
import { FadeUp } from "./words";

// Each tab keeps its card chrome, but the preview panel shows no fabricated
// creators or metrics. Data appears only once a live integration is connected.

const tabs = [
  { id: "yt", label: "YouTube", dot: "#FF0000" },
  { id: "rd", label: "Reddit", dot: "#FF4500" },
  { id: "x", label: "X / Twitter", dot: "#ffffff" },
  { id: "li", label: "LinkedIn", dot: "#0A66C2" },
];

const content: Record<
  string,
  {
    eyebrow: string;
    title: string;
    bullets: string[];
    cta: string;
    mockTitle: string;
    mockMeta: string;
  }
> = {
  yt: {
    eyebrow: "YOUTUBE REVENUE TRACK",
    title: "Find creators. Email them directly.",
    bullets: [
      "Extract channel emails via the YouTube Data API",
      "Brand fit scoring ranks creators by audience overlap with your ICP",
      "Outreach cascade moves from email to website to X DM to Discord to LinkedIn to agency",
    ],
    cta: "Explore YouTube Track",
    mockTitle: "YouTube creator view",
    mockMeta: "Creator matches appear here once connected",
  },
  rd: {
    eyebrow: "REDDIT REVENUE TRACK",
    title: "Turn signals into promoted posts.",
    bullets: [
      "YouTube performance data seeds Reddit ad targeting",
      "Match your top videos to relevant subreddits automatically",
      "Launch Reddit Promoted Posts to audiences your campaigns already reached",
    ],
    cta: "Explore Reddit Track",
    mockTitle: "Reddit campaign view",
    mockMeta: "Promoted post previews appear here once connected",
  },
  x: {
    eyebrow: "X / TWITTER REVENUE TRACK",
    title: "DM creators. Whitelist their reach.",
    bullets: [
      "Identify X creators with open DMs whose audience mirrors your buyer persona",
      "Send personalized DM sequences drafted by AI",
      "Whitelist top posts as X Ads to scale what already works",
    ],
    cta: "Explore X Track",
    mockTitle: "X outreach view",
    mockMeta: "Creator conversations appear here once connected",
  },
  li: {
    eyebrow: "LINKEDIN REVENUE TRACK",
    title: "Work with professional voices. Convert B2B.",
    bullets: [
      "Target LinkedIn voices and industry analysts in your vertical",
      "Draft review posts with the creator so they read as credible",
      "Track which posts influence pipeline",
    ],
    cta: "Explore LinkedIn Track",
    mockTitle: "LinkedIn pipeline view",
    mockMeta: "Voice and post activity appears here once connected",
  },
};

export function PlatformRevenueTabs() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];
  const c = content[tab.id];

  return (
    <section id="platforms" className="platform-revenue-section">
      <FadeUp delay={0}>
        <p className="platform-revenue-eyebrow">YOUR REVENUE PLAYBOOK</p>
      </FadeUp>
      <FadeUp delay={0.08}>
        <h2 className="platform-revenue-headline">
          One platform. Four revenue channels.
        </h2>
      </FadeUp>

      <FadeUp delay={0.16}>
        <div className="platform-revenue-tabs">
          {tabs.map((t, i) => (
            <button
              key={t.id}
              className={`platform-revenue-tab ${t.id}${active === i ? " active" : ""}`}
              onClick={() => setActive(i)}
            >
              <span
                className="platform-revenue-tab-dot"
                style={{ background: t.dot }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </FadeUp>

      <FadeUp delay={0.32}>
        <div className={`platform-revenue-card ${tab.id}`}>
          <div className="platform-revenue-card-left">
            <p className="platform-revenue-card-eyebrow">{c.eyebrow}</p>
            <h3 className="platform-revenue-card-title">{c.title}</h3>
            <ul className="platform-revenue-card-bullets">
              {c.bullets.map((b, i) => (
                <li key={i} className="platform-revenue-card-bullet">
                  {b}
                </li>
              ))}
            </ul>
            <button className="platform-revenue-card-cta">{c.cta} →</button>
          </div>

          <div className="platform-revenue-card-right">
            <div className="prc-mock">
              <div className="prc-mock-header">
                <div className="prc-mock-info">
                  <div className="prc-mock-name">{c.mockTitle}</div>
                  <div className="prc-mock-meta">{c.mockMeta}</div>
                </div>
              </div>

              <div
                className="rounded-lg flex items-center justify-center text-center"
                style={{
                  minHeight: 200,
                  marginTop: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span className="text-sm font-semibold px-4" style={{ color: "#8892A4" }}>
                  Waiting for API connection
                </span>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
