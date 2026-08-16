import { ThumbsUp, MessageSquare, Repeat2, Heart, ArrowBigUp, ArrowBigDown, Play } from "lucide-react";

// Ads Engine v2: platform-true preview frames. Renders generated copy (and an
// optional image) inside a realistic LinkedIn / X / Reddit / YouTube ad shell
// so brands see how the creative will actually land. Pure presentation.

/* These reproduce YouTube's and Reddit's own ad chrome — the surfaces, badges
   and CTA fills those products actually ship. They are content, not theme: if
   YouTube restyles its ad slot these change with it, and they must NOT track
   the Aspen palette. So they stay literal rather than becoming design tokens,
   collected here so a hex sweep finds them in one place instead of scattered
   through the JSX. Aspen's own colours in this file (the brand-green avatar,
   the LinkedIn mark) are tokenised normally. */
const PLATFORM_CHROME = {
  linkedinInk: "#1a1a1a",
  ytSurface: "#0f0f0f",
  ytThumb: "#1f1f1f",
  ytAdBadge: "#FCC934",
  ytCta: "#3ea6ff",
  redditSurface: "#0b1416",
  redditCta: "#d93a00",
} as const;

export function AdPreviewFrame({
  platform,
  brand,
  headline,
  body,
  cta,
  imageUrl,
}: {
  platform: string;
  brand: string;
  headline: string;
  body: string;
  cta: string;
  imageUrl?: string | null;
}) {
  const avatar = (
    <div className="w-9 h-9 rounded-full bg-brand-green/20 text-brand-green flex items-center justify-center text-xs font-bold shrink-0">
      {brand.slice(0, 2).toUpperCase()}
    </div>
  );
  const image = imageUrl ? (
    <img src={imageUrl} alt="" className="w-full rounded-lg object-cover max-h-48" />
  ) : null;

  if (platform === "linkedin") {
    return (
      <div
        className="rounded-xl bg-white p-3.5 text-left shadow"
        style={{ color: PLATFORM_CHROME.linkedinInk }}
      >
        <div className="flex items-center gap-2">
          {avatar}
          <div>
            <p className="text-[13px] font-semibold leading-tight">{brand}</p>
            <p className="text-[11px] text-gray-500">Promoted</p>
          </div>
        </div>
        <p className="mt-2 text-[13px] leading-snug">{body}</p>
        {image && <div className="mt-2">{image}</div>}
        <div className="mt-2 rounded-lg bg-gray-100 px-3 py-2 flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold leading-tight">{headline}</p>
          {cta && (
            <span className="text-[11px] font-bold text-linkedin border border-linkedin rounded-full px-2.5 py-1 whitespace-nowrap">
              {cta}
            </span>
          )}
        </div>
        <div className="mt-2 flex gap-4 text-gray-500 text-[11px]">
          <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> Like</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Comment</span>
          <span className="flex items-center gap-1"><Repeat2 className="w-3 h-3" /> Repost</span>
        </div>
      </div>
    );
  }

  if (platform === "x") {
    return (
      <div className="rounded-xl bg-black border border-white/20 p-3.5 text-left">
        <div className="flex items-center gap-2">
          {avatar}
          <div>
            <p className="text-[13px] font-bold text-white leading-tight">{brand}</p>
            <p className="text-[11px] text-gray-500">Ad</p>
          </div>
        </div>
        <p className="mt-2 text-[14px] text-white leading-snug whitespace-pre-wrap">{body}</p>
        {image && <div className="mt-2">{image}</div>}
        {cta && (
          <div className="mt-2 rounded-full border border-white/30 text-center py-1.5 text-[12px] font-bold text-white">
            {cta}
          </div>
        )}
        <div className="mt-2 flex gap-6 text-gray-500 text-[11px]">
          <MessageSquare className="w-3.5 h-3.5" />
          <Repeat2 className="w-3.5 h-3.5" />
          <Heart className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  if (platform === "youtube") {
    return (
      <div
        className="rounded-xl border border-white/10 p-3.5 text-left"
        style={{ background: PLATFORM_CHROME.ytSurface }}
      >
        <div
          className="relative rounded-lg aspect-video flex items-center justify-center overflow-hidden"
          style={{ background: PLATFORM_CHROME.ytThumb }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Play className="w-10 h-10 text-white/40" />
          )}
          <span
            className="absolute bottom-2 left-2 text-[10px] font-bold text-black px-1.5 py-0.5 rounded"
            style={{ background: PLATFORM_CHROME.ytAdBadge }}
          >
            Ad
          </span>
        </div>
        <div className="mt-2 flex items-start gap-2">
          {avatar}
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white leading-snug">{headline}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {brand} · Sponsored
            </p>
            <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{body}</p>
          </div>
          {cta && (
            <span
              className="ml-auto shrink-0 text-[11px] font-bold text-black rounded px-2.5 py-1.5"
              style={{ background: PLATFORM_CHROME.ytCta }}
            >
              {cta}
            </span>
          )}
        </div>
      </div>
    );
  }

  // reddit (default)
  return (
    <div
      className="rounded-xl border border-white/10 p-3.5 text-left"
      style={{ background: PLATFORM_CHROME.redditSurface }}
    >
      <div className="flex items-center gap-2">
        {avatar}
        <p className="text-[12px] text-gray-300 font-semibold">
          u/{brand.replace(/\s+/g, "")} <span className="text-gray-500 font-normal">· Promoted</span>
        </p>
      </div>
      <p className="mt-2 text-[14px] font-semibold text-white leading-snug">{headline}</p>
      {body && <p className="mt-1 text-[12px] text-gray-300 leading-snug">{body}</p>}
      {image && <div className="mt-2">{image}</div>}
      {cta && (
        <div
          className="mt-2 inline-block rounded-full text-white text-[11px] font-bold px-3 py-1.5"
          style={{ background: PLATFORM_CHROME.redditCta }}
        >
          {cta}
        </div>
      )}
      <div className="mt-2 flex items-center gap-3 text-gray-500 text-[11px]">
        <span className="flex items-center gap-1">
          <ArrowBigUp className="w-3.5 h-3.5" /> Vote <ArrowBigDown className="w-3.5 h-3.5" />
        </span>
        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Comments</span>
      </div>
    </div>
  );
}
