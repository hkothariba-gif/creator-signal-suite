import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How It Works" },
    { href: "#platforms", label: "Platforms" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={
        scrolled
          ? {
              background: "rgba(5,8,15,0.85)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.07)",
            }
          : { background: "transparent" }
      }
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-white font-display tracking-tight text-xl">
          <span className="font-normal">Aspen</span>
          <span className="font-extrabold text-brand-green">Reach</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-slate-300 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-slate-200 hover:text-white font-medium px-3 py-2 transition-colors"
          >
            Sign in
          </Link>
          <a
            href="#cta"
            className="inline-flex items-center rounded-full bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold px-5 py-2.5 transition-all hover:scale-[1.02]"
          >
            Get Early Access
          </a>
        </div>


        <button className="md:hidden text-white p-2" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden fixed inset-0 top-16 bg-brand-navy/98 backdrop-blur-xl flex flex-col items-center justify-center gap-8 px-6">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-white text-2xl font-semibold"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="text-white text-xl font-medium"
          >
            Sign in
          </Link>
          <a
            href="#cta"
            onClick={() => setOpen(false)}
            className="rounded-full bg-brand-green text-white font-semibold px-8 py-3 mt-2"
          >
            Get Early Access
          </a>

        </div>
      )}
    </header>
  );
}
