import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FadeUp } from "./words";

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
    mockBadge: string;
    mockBadgeColor: string;
    mockStats: { label: string; value: string }[];
    mockBars: { label: string; pct: number; color: string }[];
    seed: string;
  }
> = {
  yt: {
    eyebrow: "YOUTUBE REVENUE TRACK",
    title: "Find creators. Email them directly.",
    bullets: [
      "Extract channel emails via YouTube Data API — no middleman",
      "Brand-Fit Score ranks creators by audience overlap with your ICP",
      "6-step outreach cascade: email → website → X DM → Discord → LinkedIn → agency",
    ],
    cta: "Explore YouTube Track",
    mockTitle: "TechReviewer Pro",
    mockMeta: "847K subscribers · Tech · 94% Brand-Fit",
    mockBadge: "Email Found",
    mockBadgeColor: "#00D97E",
    mockStats: [
      { label: "Avg Views", value: "312K" },
      { label: "Eng Rate", value: "6.2%" },
      { label: "CPM Est.", value: "$4.80" },
    ],
    mockBars: [
      { label: "Audience match", pct: 94, color: "#FF0000" },
      { label: "Content relevance", pct: 88, color: "#00D97E" },
      { label: "Reply likelihood", pct: 72, color: "#F59E0B" },
    ],
    seed: "TechReviewer",
  },
  rd: {
    eyebrow: "REDDIT REVENUE TRACK",
    title: "Turn signals into promoted posts.",
    bullets: [
      "Cross-platform intelligence: YouTube performance data seeds Reddit ad targeting",
      "Match top-performing videos to relevant subreddits automatically",
      "Launch Reddit Promoted Posts to audiences already proven to convert",
    ],
    cta: "Explore Reddit Track",
    mockTitle: "r/homelab · Promoted",
    mockMeta: "2.1M members · Matched from YouTube signal",
    mockBadge: "Ad Ready",
    mockBadgeColor: "#FF4500",
    mockStats: [
      { label: "Est. Reach", value: "180K" },
      { label: "CPC Est.", value: "$0.42" },
      { label: "Relevance", value: "91%" },
    ],
    mockBars: [
      { label: "Subreddit match", pct: 91, color: "#FF4500" },
      { label: "Audience overlap", pct: 83, color: "#00D97E" },
      { label: "Ad approval score", pct: 88, color: "#F59E0B" },
    ],
    seed: "RedditMod",
  },
  x: {
    eyebrow: "X / TWITTER REVENUE TRACK",
    title: "DM creators. Whitelist their reach.",
    bullets: [
      "Identify X creators with open DMs whose audience mirrors your buyer persona",
      "Send AI-personalized DM sequences with 40%+ open rates",
      "Whitelist top posts as X Ads to amplify organic-feeling content at scale",
    ],
    cta: "Explore X Track",
    mockTitle: "@devadvocate_",
    mockMeta: "128K followers · Open DMs · Verified",
    mockBadge: "DM Sent",
    mockBadgeColor: "#ffffff",
    mockStats: [
      { label: "Followers", value: "128K" },
      { label: "Eng Rate", value: "4.1%" },
      { label: "Open DM", value: "Yes" },
    ],
    mockBars: [
      { label: "Audience fit", pct: 87, color: "#ffffff" },
      { label: "DM open rate", pct: 76, color: "#00D97E" },
      { label: "Whitelist score", pct: 82, color: "#F59E0B" },
    ],
    seed: "XCreator",
  },
  li: {
    eyebrow: "LINKEDIN REVENUE TRACK",
    title: "Co-author thought leadership. Convert B2B.",
    bullets: [
      "Target LinkedIn Top Voices and industry analysts in your vertical",
      "Ghostwrite or co-author review posts that feel credible — not paid",
      "4.2× higher B2B conversion vs. cold outreach",
    ],
    cta: "Explore LinkedIn Track",
    mockTitle: "Sarah Chen · Top Voice",
    mockMeta: "SaaS Growth Advisor · 34K followers",
    mockBadge: "Brief Sent",
    mockBadgeColor: "#0A66C2",
    mockStats: [
      { label: "Followers", value: "34K" },
      { label: "Conversion", value: "4.2×" },
      { label: "Open Rate", value: "73%" },
    ],
    mockBars: [
      { label: "ICP alignment", pct: 96, color: "#0A66C2" },
      { label: "Content authority", pct: 91, color: "#00D97E" },
      { label: "Brief acceptance", pct: 78, color: "#F59E0B" },
    ],
    seed: "SarahChen",
  },
};

function AnimatedBar({
  bar,
  index,
}: {
  bar: { label: string; pct: number; color: string };
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <div ref={ref} className="prc-mock-bar-row">
      <span className="prc-mock-bar-label">{bar.label}</span>
      <div className="prc-mock-bar-track">
        <motion.div
          className="prc-mock-bar-fill"
          initial={{ width: "0%" }}
          animate={inView ? { width: `${bar.pct}%` } : { width: "0%" }}
          transition={{
            duration: 0.9,
            delay: index * 0.15,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ background: bar.color }}
        />
      </div>
      <span className="prc-mock-bar-pct">{bar.pct}%</span>
    </div>
  );
}

export function PlatformRevenueTabs() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];
  const c = content[tab.id];

  return (
    <section className="platform-revenue-section">
      <FadeUp delay={0}>
        <p className="platform-revenue-eyebrow">YOUR REVENUE PLAYBOOK</p>
      </FadeUp>
      <FadeUp delay={0.08}>
        <h2 className="platform-revenue-headline">
          One platform. Four revenue channels.
        </h2>
      </FadeUp>
      <FadeUp delay={0.16}>
        <p className="platform-revenue-subhead">
          Each platform has a distinct monetization strategy — AspenReach handles
          all four.
        </p>
      </FadeUp>

      <FadeUp delay={0.24}>
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
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.seed}&backgroundColor=0C1222&radius=50`}
                  alt=""
                  className="prc-mock-avatar"
                />
                <div className="prc-mock-info">
                  <div className="prc-mock-name">{c.mockTitle}</div>
                  <div className="prc-mock-meta">{c.mockMeta}</div>
                </div>
                <span
                  className="prc-mock-badge"
                  style={{
                    background: c.mockBadgeColor + "22",
                    color: c.mockBadgeColor,
                    border: `1px solid ${c.mockBadgeColor}44`,
                  }}
                >
                  {c.mockBadge}
                </span>
              </div>

              <div className="prc-mock-bars">
                {c.mockBars.map((bar, i) => (
                  <AnimatedBar key={i} bar={bar} index={i} />
                ))}
              </div>

              <div className="prc-mock-stats">
                {c.mockStats.map((s, i) => (
                  <div key={i} className="prc-mock-stat">
                    <div className="prc-mock-stat-value">{s.value}</div>
                    <div className="prc-mock-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </FadeUp>
    </section>
  );
}
