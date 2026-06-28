import { motion } from "framer-motion";
import { YouTubeIcon, RedditIcon, XIcon } from "./icons";

const badges = [
  { label: "YouTube", bg: "#FF0000", Icon: () => <YouTubeIcon size={18} /> },
  { label: "Reddit", bg: "#FF4500", Icon: () => <RedditIcon size={18} /> },
  { label: "X / Twitter", bg: "#000000", Icon: () => <XIcon size={18} bg="none" /> },
];

export function TrustBar() {
  return (
    <section className="bg-white/[0.02] border-y border-white/[0.06] py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
        <div className="text-brand-muted text-sm">The only platform built natively for</div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {badges.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: i * 0.2 }}
              className="flex items-center gap-2 h-12 px-5 rounded-full font-bold text-white"
              style={{ background: b.bg }}
            >
              {b.label === "X / Twitter" ? (
                <XIcon size={18} bg="none" className="[&_path]:fill-white" />
              ) : (
                <b.Icon />
              )}
              <span>{b.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
