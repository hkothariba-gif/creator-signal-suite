import { WordStagger, FadeUp } from "./words";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "./icons";

function LinkedInMock() {
  return (
    <div className="rounded-2xl p-6" style={{
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 0 0 1px rgba(0,217,126,0.08), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        background: "linear-gradient(145deg, #131D2E 0%, #0C1222 100%)",
      }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#0A66C2]/20 flex items-center justify-center">
          <LinkedInIcon size={26} />
        </div>
        <div>
          <div className="text-white font-bold">Priya Raman</div>
          <div className="text-brand-muted text-xs">VP Growth · 64K followers · 7.1% eng</div>
        </div>
      </div>
      <div className="mt-5 rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
        <div className="text-sm text-slate-200 leading-snug">
          "Spent 3 months evaluating creator platforms. Here's what actually moved pipeline for our B2B funnel…"
        </div>
        <div className="mt-2 flex items-center gap-3 text-[11px] text-brand-muted">
          <span>👍 1.2K</span><span>💬 184</span><span>🔁 96</span>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 text-center">
        {[["82%", "ICP Match"], ["B2B SaaS", "Audience"]].map(([v, l]) => (
          <div key={l} className="rounded-lg bg-white/[0.04] p-3">
            <div className="text-white font-bold text-sm">{v}</div>
            <div className="text-[10px] text-brand-muted uppercase tracking-wider">{l}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 inline-block text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#0A66C2]/15 text-[#4A9EFF]">
        PIPELINE INFLUENCE: HIGH
      </div>
    </div>
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

function YouTubeMock() {
  return (
    <div className="rounded-2xl p-6" style={{
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 0 0 1px rgba(0,217,126,0.08), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        background: "linear-gradient(145deg, #131D2E 0%, #0C1222 100%)",
      }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#FF0000]/20 flex items-center justify-center">
          <YouTubeIcon size={24} />
        </div>
        <div>
          <div className="text-white font-bold">TechWithMarcus</div>
          <div className="text-brand-muted text-xs">340K subscribers · 6.2% engagement</div>
        </div>
      </div>
      <div className="mt-5">
        <div className="flex justify-between text-[10px] uppercase tracking-wider text-brand-muted mb-1.5">
          <span>Brand Fit</span>
          <span className="text-brand-green font-bold">94%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-brand-green" style={{ width: "94%" }} />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        {["The best home server setup for 2026", "Why I switched my whole stack", "Live: building a dev rig"].map((t) => (
          <div key={t} className="flex items-center gap-3 text-sm text-slate-300">
            <div className="w-14 h-9 rounded bg-white/10" />
            <span className="truncate">{t}</span>
          </div>
        ))}
      </div>
      <div className="mt-5 inline-block text-[11px] font-bold px-2.5 py-1 rounded-md bg-brand-amber/15 text-brand-amber">
        CPM RANGE: $14 – $32
      </div>
    </div>
  );
}

function RedditMock() {
  return (
    <div className="rounded-2xl p-6" style={{
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 0 0 1px rgba(0,217,126,0.08), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        background: "linear-gradient(145deg, #131D2E 0%, #0C1222 100%)",
      }}>
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#FF4500]/20 flex items-center justify-center">
          <RedditIcon size={24} />
        </div>
        <div>
          <div className="text-white font-bold">r/homelab</div>
          <div className="text-brand-muted text-xs">847K members · 12K online</div>
        </div>
      </div>
      <div className="mt-5 space-y-3">
        {[
          { title: "Which platform actually helps you find creators?", flag: "Buyer journey" },
          { title: "Anyone tried AspenReach? Honest review inside", flag: "Brand mention" },
        ].map((p) => (
          <div key={p.title} className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
            <div className="text-sm text-slate-200 leading-snug">{p.title}</div>
            <span className="mt-2 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FF4500]/15 text-[#FF4500]">
              Why Flagged · {p.flag}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 inline-block text-[11px] font-bold px-2.5 py-1 rounded-md bg-brand-green/15 text-brand-green">
        COMMUNITY FIT: 89%
      </div>
    </div>
  );
}

function XMock() {
  return (
    <div className="rounded-2xl p-6" style={{
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 0 0 1px rgba(0,217,126,0.08), 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)",
        background: "linear-gradient(145deg, #131D2E 0%, #0C1222 100%)",
      }}>
      <div className="flex items-center gap-3">
        <XIcon size={36} bg="white" />
        <div>
          <div className="text-white font-bold">@buildinpublic_sara</div>
          <div className="text-brand-muted text-xs">128K followers · 4.8% eng</div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          ["91", "Quality"],
          ["4.8%", "Eng"],
          ["12", "Mentions"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-lg bg-white/[0.04] p-3">
            <div className="text-white font-bold text-lg">{v}</div>
            <div className="text-[10px] text-brand-muted uppercase tracking-wider">{l}</div>
          </div>
        ))}
      </div>
      <div className="mt-5 space-y-2">
        {["Been using this for 3 weeks now and wow...", "Hot take: most influencer tools are dead."].map((t) => (
          <div key={t} className="text-sm text-slate-300 italic">
            "{t}"
          </div>
        ))}
      </div>
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
    desc: "Match to creators based on subscriber count, topic clusters, CPM ranges, and audience demographics. See engagement rate, estimated reach, and rate cards — all before you reach out.",
    tags: ["Subscriber Tiers", "CPM Ranges", "Engagement Rate", "Demographic Fit"],
    Mock: YouTubeMock,
  },
  {
    side: "right" as const,
    cls: "rd",
    color: "#FF4500",
    Icon: RedditIcon,
    title: "Reddit Community Intelligence",
    desc: "AspenReach scans subreddits for people already discussing your product category. 'Why Flagged' snippets show you the exact posts that match your buyer journey.",
    tags: ["Subreddit Mapping", "Sentiment Signals", "Why Flagged Snippets", "Community Fit Score"],
    Mock: RedditMock,
  },
  {
    side: "left" as const,
    cls: "x",
    color: "#FFFFFF",
    Icon: (props: { size?: number }) => <XIcon size={props.size} bg="white" />,
    title: "X Conversation Mapping",
    desc: "Find niche X voices whose followers match your ICP. Surface engagement rate, follower quality score, and recent brand mentions.",
    tags: ["Follower Quality", "ICP Match", "Brand Mention Tracking", "Niche Authority"],
    Mock: XMock,
  },
  {
    side: "right" as const,
    cls: "li",
    color: "#0A66C2",
    Icon: LinkedInIcon,
    title: "LinkedIn B2B Authority Mapping",
    desc: "Surface thought leaders whose followers match your buyer committee. Track pipeline-influencing posts, ICP match, and engagement quality from decision-makers — not vanity reach.",
    tags: ["ICP Audience Match", "Decision-Maker Reach", "Pipeline Influence", "Thought-Leader Score"],
    Mock: LinkedInMock,
  },
];

export function PlatformCards() {
  return (
    <section id="platforms" className="bg-brand-navy py-16 md:py-[100px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center">
          <div className="text-brand-green text-xs font-bold uppercase tracking-[0.15em]">
            Three Platforms. One Intelligence Layer.
          </div>
          <WordStagger
            text="Built for the platforms where real conversations happen"
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
