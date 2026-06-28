import { YouTubeIcon, RedditIcon, XIcon } from "@/components/landing/icons";

export function PlatformTrustBar() {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3 rounded-xl bg-[#0C1222] border border-white/[0.07]">
      <span className="text-xs font-semibold uppercase tracking-wider text-[#8892A4]">
        Connected Platforms
      </span>
      <div className="flex items-center gap-2 text-sm font-semibold text-[#F0F4FF]">
        <YouTubeIcon size={18} />
        YouTube
        <span className="w-1.5 h-1.5 rounded-full bg-[#00D97E]" />
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-[#F0F4FF]">
        <RedditIcon size={18} />
        Reddit
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
      </div>
      <div className="flex items-center gap-2 text-sm font-semibold text-[#F0F4FF]">
        <XIcon size={16} bg="black" />
        X / Twitter
        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
      </div>
      <span className="ml-auto text-xs text-[#8892A4]">
        Reddit + X signals loading • YouTube connected via API
      </span>
    </div>
  );
}
