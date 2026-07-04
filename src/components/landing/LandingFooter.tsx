import { YouTubeIcon, RedditIcon, XIcon } from "./icons";

export function LandingFooter() {
  return (
    <footer className="bg-brand-navy border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
        <div>
          <div className="text-white font-display tracking-tight text-xl">
            <span className="font-normal">Aspen</span>
            <span className="font-extrabold text-brand-green">Reach</span>
          </div>
          <p className="mt-3 text-brand-muted text-sm max-w-xs leading-relaxed">
            Run affiliate marketing programs to build better advertising and ads.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-start md:justify-center gap-6 text-sm text-brand-muted">
          {["Features", "Pricing", "How It Works", "Privacy", "Terms"].map((l) => (
            <a key={l} href="#" className="hover:text-white transition-colors">
              {l}
            </a>
          ))}
        </div>

        <div className="flex md:justify-end gap-3">
          {[
            { Icon: YouTubeIcon, bg: "rgba(255,0,0,0.15)" },
            { Icon: RedditIcon, bg: "rgba(255,69,0,0.15)" },
            { Icon: () => <XIcon size={18} bg="none" className="[&_path]:fill-white" />, bg: "rgba(0,0,0,0.6)" },
          ].map((p, i) => (
            <span
              key={i}
              className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10"
              style={{ background: p.bg }}
            >
              <p.Icon size={18} />
            </span>
          ))}
        </div>
      </div>
      <div className="border-t border-white/[0.06] py-5 text-center text-[13px] text-brand-muted">
        © 2026 AspenReach. All rights reserved.
      </div>
    </footer>
  );
}
