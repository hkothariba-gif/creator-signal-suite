const SEEDS: Record<string, string> = {
  "TechWithMarcus": "Marcus",
  "r/homelab": "Alex",
  "@buildinpublic_sara": "Sara",
  "CodeWithChris": "Chris",
  "NightOwlTech": "Jordan",
  "GadgetGuru": "Devon",
  "r/personalfinance": "Riley",
  "r/SaaSFounders": "Morgan",
  "ProductivityPro": "Sam",
  "r/entrepreneur": "Jamie",
  "TechReviewHub": "Casey",
  "@devtools_daily": "Parker",
  "TechExplorer Weekly": "Taylor",
  "r/homeautomation": "Drew",
  "@devreladvocate": "Avery",
};

export function CreatorAvatar({
  name,
  size = 36,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const seed = SEEDS[name] || name.replace(/[^a-zA-Z]/g, "").slice(0, 8) || "user";
  const url = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=00D97E,7C3AED,F59E0B`;
  return (
    <img
      src={url}
      alt={name}
      width={size}
      height={size}
      className={`rounded-full bg-[#131D2E] border border-white/10 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
