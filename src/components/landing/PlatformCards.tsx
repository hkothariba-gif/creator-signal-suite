import type { ReactElement } from "react";
import { WordStagger, FadeUp } from "./words";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "./icons";

// Each platform card keeps its visual frame, but no fabricated creators,
// metrics, or quotes. Data areas show Waiting for API connection until a
// live integration is wired up.

const mockFrameStyle = {
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 0 0 1px rgba(0,217,126,0.08), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
  background: "linear-gradient(145deg, #131D2E 0%, #0C1222 100%)",
} as const;

function WaitingPanel() {
  return (
    <div
      className="mt-5 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-center px-4"
      style={{ minHeight: 180 }}
    >
      <span className="text-sm font-semibold" style={{ color: "#8892A4" }}>
        Waiting for API connection
      </span>
    </div>
  );
}

function PlatformMock({
  icon,
  name,
  meta,
  iconBg,
}: {
  icon: ReactElement;
  name: string;
  meta: string;
  iconBg?: string;
}) {
  return (
    <div className="rounded-2xl p-6" style={mockFrameStyle}>
      <div className="flex items-center gap-3">
        {iconBg ? (
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: iconBg }}>
            {icon}
          </div>
        ) : (
          icon
        )}
        <div>
          <div className="text-white font-bold">{name}</div>
          <div className="text-brand-muted text-xs">{meta}</div>
        </div>
      </div>
      <WaitingPanel />
    </div>
  );
}

function YouTubeMock() {
  return (
    <PlatformMock
      icon={<YouTubeIcon size={24} />}
      iconBg="rgba(255,0,0,0.2)"
      name="YouTube signals"
      meta="Creator matches appear here"
    />
  );
}

function RedditMock() {
  return (
    <PlatformMock
      icon={<RedditIcon size={24} />}
      iconBg="rgba(255,69,0,0.2)"
      name="Reddit signals"
      meta="Community matches appear here"
    />
  );
}

function XMock() {
  return (
    <PlatformMock
      icon={<XIcon size={36} bg="white" />}
      name="X campaigns"
      meta="Published ads appear here"
    />
  );
}

function LinkedInMock() {
  return (
    <PlatformMock
      icon={<LinkedInIcon size={26} />}
      iconBg="rgba(10,102,194,0.2)"
      name="LinkedIn signals"
      meta="Professional voices appear here"
    />
  );
}

function Pills({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      {items.map((t) => (
        <span
          key={t}
          className="text-[11px] font-semibold uppercase tracking-[0.1em] px-3 py-1.5 rounded-full border"
          style={{ color, borderColor: `${color}40`, background: `${color}10` }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

const cards = [
  {
    side: "left" as const,
    cls: "yt",
    color: "#FF0000",
    Icon: YouTubeIcon,
    title: "YouTube Creator Matching",
    desc: "Match creators by topic clusters, audience demographics, and engagement signals. See how a channel fits your brand before you reach out.",
    tags: ["Topic Clusters", "Audience Fit", "Engagement Signals", "Contact Paths"],
    Mock: YouTubeMock,
  },
  {
    side: "right" as const,
    cls: "rd",
    color: "#FF4500",
    Icon: RedditIcon,
    title: "Reddit Community Intelligence",
    desc: "AspenReach scans subreddits for people already discussing your product category. Why Flagged snippets show you the exact posts that match your buyer journey.",
    tags: ["Subreddit Mapping", "Sentiment Signals", "Why Flagged Snippets", "Community Fit Score"],
    Mock: RedditMock,
  },
  {
    side: "left" as const,
    cls: "x",
    color: "#FFFFFF",
    Icon: (props: { size?: number }) => <XIcon size={props.size} bg="white" />,
    title: "X Ad Publishing",
    desc: "Turn the hooks and selling points that work into paid posts on X. AspenReach drafts the creative and publishes it as a campaign.",
    tags: ["Ad Copy Drafts", "Creative Variants", "Audience Targeting", "Campaign Publishing"],
    Mock: XMock,
  },
  {
    side: "right" as const,
    cls: "li",
    color: "#0A66C2",
    Icon: LinkedInIcon,
    title: "LinkedIn B2B Authority Mapping",
    desc: "Surface professional voices whose followers match your buyer committee. Track the posts that influence pipeline and the engagement that comes from decision makers.",
    tags: ["ICP Audience Match", "Decision Maker Reach", "Pipeline Influence", "Thought Leader Score"],
    Mock: LinkedInMock,
  },
];

export function PlatformCards() {
  return (
    <section id="platforms" className="bg-brand-navy py-16 md:py-[100px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center">
          <div className="text-brand-green text-xs font-bold uppercase tracking-[0.15em]">
            Intelligence In. Ads Out.
          </div>
          <WordStagger
            text="Learn from YouTube, LinkedIn, and Reddit. Publish ads to Reddit, X, and YouTube."
            className="mt-4 mx-auto max-w-[820px] text-white font-display font-extrabold text-4xl md:text-[52px] tracking-[-0.04em] leading-[1.05]"
          />
        </div>

        <div className="mt-16 md:mt-20 divide-y divide-white/[0.06]">
          {cards.map((c) => (
            <FadeUp key={c.title} delay={0.05}>
              <div
                className={`platform-strategy-block ${c.cls} grid grid-cols-1 md:grid-cols-[45fr_55fr] gap-10 md:gap-14 items-center py-14 md:py-20 md:min-h-[500px] ${
                  c.side === "right" ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${c.color}20` }}>
                    <c.Icon size={36} />
                  </div>
                  <h3 className="mt-5 text-white font-display font-extrabold text-3xl md:text-[44px] tracking-[-0.03em] leading-[1.05]">
                    {c.title}
                  </h3>
                  <p className="mt-5 text-brand-muted text-lg md:text-[19px] leading-[1.65] max-w-xl">{c.desc}</p>
                  <Pills items={c.tags} color={c.color === "#FFFFFF" ? "#94A3B8" : c.color} />
                </div>
                <c.Mock />
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
