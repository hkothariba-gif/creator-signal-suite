import { motion } from "framer-motion";
import { YouTubeIcon, RedditIcon, XIcon, LinkedInIcon } from "./icons";

const items = [
  { label: "YouTube", cls: "yt", Icon: (p: { size?: number }) => <YouTubeIcon size={p.size} /> },
  { label: "Reddit", cls: "rd", Icon: (p: { size?: number }) => <RedditIcon size={p.size} /> },
  { label: "X / Twitter", cls: "x", Icon: (p: { size?: number }) => <XIcon size={p.size} bg="none" className="[&_path]:fill-white" /> },
  { label: "LinkedIn", cls: "li", Icon: (p: { size?: number }) => <LinkedInIcon size={p.size} /> },
];

export function TrustBar() {
  return (
    <section className="py-10 bg-bg-surface border-y border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
        <div className="text-brand-muted text-sm">The only platform built natively for</div>
        <div className="platform-trust-bar">
          {items.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: i * 0.1 }}
              className={`platform-trust-item ${b.cls}`}
            >
              <b.Icon size={18} />
              <span>{b.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
