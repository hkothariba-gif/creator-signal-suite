import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Leaf } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How It Works" },
    { href: "#pricing", label: "Pricing" },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[rgba(15,23,42,0.75)] backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="w-8 h-8 rounded-lg bg-brand-green/15 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-brand-green" />
          </span>
          <span className="font-display font-bold tracking-tight text-lg">
            AspenReach
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-slate-300 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#cta"
            className="ml-2 inline-flex items-center rounded-full bg-brand-green hover:bg-brand-green-dark text-white text-sm font-semibold px-5 py-2.5 transition-colors"
          >
            Get Early Access
          </a>
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-[rgba(15,23,42,0.95)] backdrop-blur-xl border-t border-white/5 px-6 py-4 flex flex-col gap-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="text-slate-300 hover:text-white text-sm"
            >
              {l.label}
            </a>
          ))}
          <a
            href="#cta"
            onClick={() => setOpen(false)}
            className="rounded-full bg-brand-green text-white text-sm font-semibold px-5 py-2.5 text-center"
          >
            Get Early Access
          </a>
        </div>
      )}
    </header>
  );
}
