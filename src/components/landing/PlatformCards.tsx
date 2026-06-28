import { Play } from "lucide-react";
import { WordStagger, FadeUp } from "./words";

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.4.5A3 3 0 0 0 .5 6.2C0 8 0 12 0 12s0 4 .5 5.8a3 3 0 0 0 2.1 2.1c1.8.5 9.4.5 9.4.5s7.6 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 16 24 12 24 12s0-4-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
    </svg>
  );
}
function RedditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="12" r="11" />
      <circle cx="8.5" cy="12.5" r="1.4" fill="#fff" />
      <circle cx="15.5" cy="12.5" r="1.4" fill="#fff" />
      <path d="M8.5 15.5c1 1 2.2 1.5 3.5 1.5s2.5-.5 3.5-1.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="19" cy="8" r="1.6" fill="#fff" />
      <line x1="19" y1="8" x2="13" y2="6.2" stroke="#fff" strokeWidth="1" />
      <circle cx="13" cy="6" r="0.8" fill="#fff" />
    </svg>
  );
}
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2H21.5l-7.5 8.57L23 22h-6.84l-5.36-7.01L4.5 22H1.24l8.04-9.19L1 2h7.02l4.84 6.4L18.244 2Zm-1.2 18h1.86L7.05 4H5.08L17.044 20Z" />
    </svg>
  );
}

const cards = [
  {
    Icon: YouTubeIcon,
    color: "#FF0000",
    title: "YouTube Creator Matching",
    stats: "2B+ monthly users · Avg 8 min watch time · 3x purchase intent",
    body: "Match to YouTube creators based on subscriber count, topic clusters, CPM ranges, and audience demographics. See engagement rate, estimated reach, and rate cards — all in one card.",
    tags: ["Subscriber tiers", "CPM ranges", "Engagement rate", "Demographic fit"],
  },
  {
    Icon: RedditIcon,
    color: "#FF4500",
    title: "Reddit Community Intelligence",
    stats: "97M+ DAU · 2x trust vs other platforms · Purchase-intent signals",
    body: "AspenReach scans subreddits for people already discussing your product category. 'Why Flagged' snippets show you the exact posts and comments that match your buyer journey — before you reach out.",
    tags: ["Subreddit mapping", "Sentiment signals", "Why Flagged snippets", "Community fit score"],
  },
  {
    Icon: XIcon,
    color: "#0F172A",
    title: "X Conversation Mapping",
    stats: "49% higher creator engagement · Real-time signals · Niche authority",
    body: "Find niche X voices whose followers match your ICP. AspenReach surfaces engagement rate, follower quality score, and recent brand mentions — so you know who's already in your orbit.",
    tags: ["Follower quality", "ICP match", "Brand mention tracking", "Niche authority"],
  },
];

export function PlatformCards() {
  return (
    <section id="features" className="bg-brand-gray-soft py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-3xl">
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-brand-green">
            Platform Intelligence
          </div>
          <WordStagger
            text="Three platforms. One intelligence layer."
            className="mt-4 font-display font-extrabold text-4xl lg:text-5xl tracking-[-0.04em] leading-[1.05] text-brand-navy"
          />
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <FadeUp key={c.title} delay={i * 0.1}>
              <div className="group h-full rounded-2xl bg-white border border-slate-200/80 p-7 hover:-translate-y-1 hover:shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)] transition-all duration-300">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: `${c.color}15`, color: c.color }}
                >
                  <c.Icon className="w-6 h-6" />
                </div>
                <h3 className="mt-5 font-display font-bold text-xl tracking-tight text-brand-navy">
                  {c.title}
                </h3>
                <div className="mt-2 text-xs font-semibold text-brand-text-muted">
                  {c.stats}
                </div>
                <p className="mt-4 text-brand-text-muted leading-relaxed text-sm">
                  {c.body}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

export { YouTubeIcon, RedditIcon, XIcon, Play };
