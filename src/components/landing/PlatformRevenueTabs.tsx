import { useState } from "react";

type Key = "yt" | "rd" | "x" | "li";

type Bar = { label: string; value: number };
type Stat = { val: string; lbl: string };

type TabData = {
  key: Key;
  label: string;
  platform: string;
  title: string;
  bullets: string[];
  cta: string;
  mock: {
    avatar: { type: "dicebear" | "text"; seed?: string; text?: string; bg?: string };
    name: string;
    meta: string;
    badge: string;
    rows: Array<
      | { kind: "label-value"; label: string; value: string; italic?: boolean }
      | { kind: "bar"; bar: Bar }
      | { kind: "stats"; stats: Stat[] }
    >;
    actions: { primary: string; secondary: string };
  };
};

const TABS: TabData[] = [
  {
    key: "yt",
    label: "YouTube",
    platform: "YouTube",
    title: "Creator outreach at scale",
    bullets: [
      "YouTube API extracts verified contact emails from channel About tab",
      "Brand-Fit Score filters by niche, engagement rate & audience match",
      "AI sequences hit 40%+ reply rates vs 3% cold email average",
    ],
    cta: "Explore YouTube →",
    mock: {
      avatar: { type: "dicebear", seed: "marcus" },
      name: "TechWithMarcus",
      meta: "340K subs · Tech Reviews",
      badge: "94% FIT",
      rows: [
        { kind: "label-value", label: "OUTREACH STATUS", value: "Email sent · Awaiting reply" },
        { kind: "bar", bar: { label: "Brand Fit", value: 94 } },
        { kind: "stats", stats: [{ val: "340K", lbl: "Subscribers" }, { val: "6.2%", lbl: "Eng. Rate" }] },
      ],
      actions: { primary: "View Profile", secondary: "Skip" },
    },
  },
  {
    key: "rd",
    label: "Reddit",
    platform: "Reddit",
    title: "Reddit Ads from YouTube data",
    bullets: [
      "YouTube campaign signals auto-generate Reddit Promoted Post copy",
      "AI matches your ICP to the top 3 subreddits by conversion intent",
      "Launch Reddit Ads without a single manual step",
    ],
    cta: "Explore Reddit →",
    mock: {
      avatar: { type: "text", text: "r/", bg: "#FF4500" },
      name: "r/homelab",
      meta: "847K members · Tech & DIY",
      badge: "89% MATCH",
      rows: [
        { kind: "label-value", label: "AD DRAFT", value: "\u201CTired of managing 6 tools? We built one that\u2026\u201D", italic: true },
        { kind: "label-value", label: "TARGETING", value: "r/homelab · r/selfhosted · r/devops" },
      ],
      actions: { primary: "Launch Ad →", secondary: "Edit Copy" },
    },
  },
  {
    key: "x",
    label: "X / Twitter",
    platform: "X",
    title: "Amplify through X creators",
    bullets: [
      "DM creators with open DMs — AI drafts personalised pitches per creator",
      "Whitelist deal: run your ad through their handle for 3x conversion",
      "X Ads amplification boosts winning posts to lookalike audiences",
    ],
    cta: "Explore X →",
    mock: {
      avatar: { type: "dicebear", seed: "sara" },
      name: "@buildinpublic_sara",
      meta: "128K followers · Build-in-public",
      badge: "FOLLOWER QUALITY 91",
      rows: [
        { kind: "label-value", label: "DM STATUS", value: "Sent 2h ago · Opened" },
        { kind: "bar", bar: { label: "Audience Match", value: 88 } },
        { kind: "stats", stats: [{ val: "128K", lbl: "Followers" }, { val: "4.1%", lbl: "Eng. Rate" }] },
      ],
      actions: { primary: "Send DM", secondary: "Whitelist" },
    },
  },
  {
    key: "li",
    label: "LinkedIn",
    platform: "LinkedIn",
    title: "B2B revenue through professional voices",
    bullets: [
      "Target LinkedIn Top Voices, industry analysts & Director+ decision makers",
      "Ghostwritten or co-authored posts reach 4.2x higher B2B conversion",
      "73% open rate on cold briefs sent to matched reviewers",
    ],
    cta: "Explore LinkedIn →",
    mock: {
      avatar: { type: "dicebear", seed: "priya" },
      name: "Priya Nair",
      meta: "Growth Lead · SaaS & GTM",
      badge: "TOP VOICE",
      rows: [
        { kind: "label-value", label: "BRIEF STATUS", value: "Sent · Replied in 4h" },
        { kind: "bar", bar: { label: "ICP Match", value: 91 } },
        { kind: "stats", stats: [{ val: "4.2x", lbl: "B2B Conv." }, { val: "73%", lbl: "Open Rate" }] },
      ],
      actions: { primary: "View Brief", secondary: "Co-author" },
    },
  },
];

function Avatar({ avatar }: { avatar: TabData["mock"]["avatar"] }) {
  if (avatar.type === "dicebear") {
    return (
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar.seed}&backgroundColor=0C1222&radius=50`}
        className="prc-mock-avatar"
        alt=""
      />
    );
  }
  return (
    <div
      className="prc-mock-avatar"
      style={{ background: avatar.bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
    >
      {avatar.text}
    </div>
  );
}

export function PlatformRevenueTabs() {
  const [activeTab, setActiveTab] = useState(0);
  const tab = TABS[activeTab];

  return (
    <section className="platform-revenue-section">
      <div className="platform-revenue-eyebrow">YOUR REVENUE PLAYBOOK</div>
      <h2 className="platform-revenue-headline">One platform. Four revenue channels.</h2>
      <p className="platform-revenue-subhead">
        Each platform has a distinct monetization strategy. Here's how AspenReach activates all four.
      </p>

      <div className="platform-revenue-tabs" role="tablist">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === i}
            onClick={() => setActiveTab(i)}
            className={`platform-revenue-tab ${t.key}${activeTab === i ? " active" : ""}`}
          >
            <span className="platform-revenue-tab-dot"></span>
            {t.label}
          </button>
        ))}
      </div>

      <div className={`platform-revenue-card ${tab.key}`}>
        <div className="platform-revenue-card-left">
          <div className="platform-revenue-card-platform">{tab.platform}</div>
          <h3 className="platform-revenue-card-title">{tab.title}</h3>
          <ul className="platform-revenue-card-bullets">
            {tab.bullets.map((b) => (
              <li key={b} className="platform-revenue-card-bullet">{b}</li>
            ))}
          </ul>
          <button className="platform-revenue-card-cta">{tab.cta}</button>
        </div>

        <div className="platform-revenue-card-right">
          <div className="prc-mock">
            <div className="prc-mock-header">
              <Avatar avatar={tab.mock.avatar} />
              <div className="prc-mock-identity">
                <div className="prc-mock-creator-name">{tab.mock.name}</div>
                <div className="prc-mock-creator-meta">{tab.mock.meta}</div>
              </div>
              <span className={`prc-mock-badge ${tab.key}`}>{tab.mock.badge}</span>
            </div>

            {tab.mock.rows.map((row, idx) => {
              if (row.kind === "label-value") {
                return (
                  <div key={idx} className="prc-mock-row">
                    <div className="prc-mock-label">{row.label}</div>
                    <div className="prc-mock-value" style={row.italic ? { fontStyle: "italic", color: "#8892A4" } : undefined}>
                      {row.value}
                    </div>
                  </div>
                );
              }
              if (row.kind === "bar") {
                return (
                  <div key={idx} className="prc-mock-bar-row">
                    <div className="prc-mock-bar-label">
                      <span>{row.bar.label}</span>
                      <span>{row.bar.value}%</span>
                    </div>
                    <div className="prc-mock-bar-track">
                      <div className="prc-mock-bar-fill" style={{ width: `${row.bar.value}%` }} />
                    </div>
                  </div>
                );
              }
              return (
                <div key={idx} className="prc-mock-stat-grid">
                  {row.stats.map((s) => (
                    <div key={s.lbl} className="prc-mock-stat">
                      <div className="prc-mock-stat-val">{s.val}</div>
                      <div className="prc-mock-stat-lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>
              );
            })}

            <div className="prc-mock-action-row">
              <button className="prc-mock-btn primary">{tab.mock.actions.primary}</button>
              <button className="prc-mock-btn secondary">{tab.mock.actions.secondary}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
