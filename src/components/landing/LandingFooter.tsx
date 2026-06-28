import { Leaf } from "lucide-react";
import { YouTubeIcon, RedditIcon, XIcon } from "./PlatformCards";

export function LandingFooter() {
  return (
    <footer className="bg-brand-navy text-slate-400 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-10">
        <div>
          <div className="flex items-center gap-2 text-white">
            <span className="w-8 h-8 rounded-lg bg-brand-green/15 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-brand-green" />
            </span>
            <span className="font-display font-bold tracking-tight text-lg">
              AspenReach
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed max-w-md">
            AspenReach finds the people already talking about what you sell —
            before you ask them.
          </p>
        </div>

        <div className="text-sm">
          <div className="text-white font-semibold mb-3">Product</div>
          <ul className="space-y-2">
            <li><a href="#features" className="hover:text-white">Features</a></li>
            <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
            <li><a href="#" className="hover:text-white">Blog</a></li>
          </ul>
        </div>

        <div className="text-sm">
          <div className="text-white font-semibold mb-3">Legal</div>
          <ul className="space-y-2">
            <li><a href="#" className="hover:text-white">Privacy</a></li>
            <li><a href="#" className="hover:text-white">Terms</a></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs">© 2026 AspenReach. All rights reserved.</div>
          <div className="flex items-center gap-3">
            <a href="#" aria-label="YouTube" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <YouTubeIcon className="w-4 h-4 text-[#FF0000]" />
            </a>
            <a href="#" aria-label="Reddit" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <RedditIcon className="w-4 h-4 text-[#FF4500]" />
            </a>
            <a href="#" aria-label="X" className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
              <XIcon className="w-3.5 h-3.5 text-white" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
