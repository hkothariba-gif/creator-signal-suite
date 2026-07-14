import { useState, type ReactElement } from "react";
import { motion } from "framer-motion";
import { Crosshair, Move, Sparkles, MousePointer2 } from "lucide-react";
import { WordStagger, FadeUp } from "./words";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "./icons";

// Platform intelligence lives in one tabbed section: each tab shows the
// discovery lens for that network. No fabricated creators or metrics; mock
// panels show "Waiting for API connection" until a live integration is wired.

type PlatformTab = "youtube" | "reddit" | "x" | "linkedin";

const PLATFORM_TABS: {
  id: PlatformTab;
  label: string;
  color: string;
  Icon: (p: { size?: number }) => ReactElement;
}[] = [
  { id: "youtube", label: "YouTube", color: "#FF0000", Icon: (p) => <YouTubeIcon size={p.size} /> },
  { id: "reddit", label: "Reddit", color: "#FF4500", Icon: (p) => <RedditIcon size={p.size} /> },
  { id: "x", label: "X / Twitter", color: "#FFFFFF", Icon: (p) => <XIcon size={p.size} bg="white" /> },
  { id: "linkedin", label: "LinkedIn", color: "#0A66C2", Icon: (p) => <LinkedInIcon size={p.size} /> },
];

const PLATFORM_CONTENT: Record<
  PlatformTab,
  {
    title: string;
    desc: string;
    tags: string[];
    mockTitle: string;
    mockMeta: string;
  }
> = {
  youtube: {
    title: "YouTube Creator Matching",
    desc: "Match creators by topic clusters, audience demographics, and engagement signals. See how a channel fits your brand before you reach out.",
    tags: ["Topic Clusters", "Audience Fit", "Engagement Signals", "Contact Paths"],
    mockTitle: "YouTube signals",
    mockMeta: "Creator matches appear here",
  },
  reddit: {
    title: "Reddit Community Intelligence",
    desc: "AspenReach scans subreddits for people already discussing your product category. Why Flagged snippets show the exact posts that match your buyer journey.",
    tags: ["Subreddit Mapping", "Sentiment Signals", "Why Flagged Snippets", "Community Fit Score"],
    mockTitle: "Reddit signals",
    mockMeta: "Community matches appear here",
  },
  x: {
    title: "X Ad Publishing",
    desc: "Turn the hooks and selling points that work into paid posts on X. AspenReach drafts the creative and publishes it as a campaign.",
    tags: ["Ad Copy Drafts", "Creative Variants", "Audience Targeting", "Campaign Publishing"],
    mockTitle: "X campaigns",
    mockMeta: "Published ads appear here",
  },
  linkedin: {
    title: "LinkedIn B2B Authority Mapping",
    desc: "Surface professional voices whose followers match your buyer committee. Track the posts that influence pipeline and the engagement that comes from decision makers.",
    tags: ["ICP Audience Match", "Decision Maker Reach", "Pipeline Influence", "Thought Leader Score"],
    mockTitle: "LinkedIn signals",
    mockMeta: "Professional voices appear here",
  },
};

const DISCOVERY_BULLETS = [
  { Icon: Crosshair, t: "Plot every creator by reach and brand fit score on a scatter chart" },
  { Icon: Move, t: "Drag the amber budget cap line to filter creators instantly" },
  { Icon: Sparkles, t: "The best match zone highlights the creators most likely to convert" },
  { Icon: MousePointer2, t: "Hover any dot for name, platform, fit score, audience size, and CPM range" },
];

export function HeatMapSection() {
  const [tab, setTab] = useState<PlatformTab>("youtube");
  const active = PLATFORM_TABS.find((t) => t.id === tab)!;
  const content = PLATFORM_CONTENT[tab];

  return (
    <section id="how" className="py-16 md:py-[100px]" style={{ background: "#05080F" }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center">
          <div className="text-brand-green text-xs font-bold uppercase tracking-[0.15em]">
            Creator Discovery Engine
          </div>
          <WordStagger
            text="See which creators fit across YouTube, LinkedIn, Reddit, and X before you spend a dollar"
            className="mt-4 mx-auto max-w-[900px] font-display font-extrabold text-4xl md:text-[52px] tracking-[-0.04em] leading-[1.05]"
            style={{ color: "#F0F4FF" }}
          />
        </div>

        <div
          className="mt-10 flex items-center justify-center gap-6 md:gap-8 flex-wrap"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
        >
          {PLATFORM_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative pb-3 text-sm font-semibold transition-colors inline-flex items-center gap-2 ${
                tab === t.id ? "text-white" : "text-[#8892A4] hover:text-white"
              }`}
            >
              <t.Icon size={16} />
              {t.label}
              {tab === t.id && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute -bottom-px left-0 right-0 h-0.5 bg-brand-green"
                />
              )}
            </button>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-[45fr_55fr] gap-10 lg:gap-14 items-center">
          <div className="space-y-6">
            <FadeUp>
              <div>
                <h3 className="text-white font-display font-extrabold text-3xl md:text-[44px] tracking-[-0.03em] leading-[1.05]">
                  {content.title}
                </h3>
                <p className="mt-4 text-brand-muted text-lg md:text-[19px] leading-[1.65] max-w-xl">
                  {content.desc}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {content.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-semibold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border"
                      style={{
                        color: active.color === "#FFFFFF" ? "#94A3B8" : active.color,
                        borderColor: `${active.color === "#FFFFFF" ? "#94A3B8" : active.color}40`,
                        background: `${active.color === "#FFFFFF" ? "#94A3B8" : active.color}10`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </FadeUp>

            <div className="space-y-5 pt-4">
              {DISCOVERY_BULLETS.map((b, i) => (
                <FadeUp key={i} delay={i * 0.1}>
                  <div className="flex items-start gap-4">
                    <span className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
                      <b.Icon className="w-5 h-5 text-brand-green" />
                    </span>
                    <p className="text-lg leading-relaxed" style={{ color: "#F0F4FF" }}>
                      {b.t}
                    </p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>

          <FadeUp delay={0.2}>
            <PlatformMock platform={active} content={content} />
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function PlatformMock({
  platform,
  content,
}: {
  platform: (typeof PLATFORM_TABS)[number];
  content: (typeof PLATFORM_CONTENT)["youtube"];
}) {
  return (
    <div
      className="rounded-2xl p-6 md:p-8"
      style={{
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow:
          "0 0 0 1px rgba(0,217,126,0.08), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        background: "linear-gradient(145deg, #131D2E 0%, #0C1222 100%)",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: `${platform.color}20` }}
        >
          <platform.Icon size={24} />
        </div>
        <div>
          <div className="text-white font-bold">{content.mockTitle}</div>
          <div className="text-brand-muted text-xs">{content.mockMeta}</div>
        </div>
      </div>

      <div
        className="mt-6 rounded-lg flex items-center justify-center text-center"
        style={{
          minHeight: 220,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span className="text-sm font-semibold px-4" style={{ color: "#8892A4" }}>
          Waiting for API connection
        </span>
      </div>
    </div>
  );
}
