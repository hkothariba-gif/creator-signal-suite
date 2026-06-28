export function YouTubeIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-label="YouTube">
      <rect x="1" y="5" width="22" height="14" rx="3" fill="#FF0000" />
      <path d="M10 9.2v5.6l5-2.8z" fill="#fff" />
    </svg>
  );
}

export function RedditIcon({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-label="Reddit">
      <circle cx="12" cy="12" r="11" fill="#FF4500" />
      <circle cx="12" cy="13" r="6" fill="#fff" />
      <circle cx="9.5" cy="12.5" r="1.1" fill="#FF4500" />
      <circle cx="14.5" cy="12.5" r="1.1" fill="#FF4500" />
      <path d="M9 15c.8.7 1.9 1 3 1s2.2-.3 3-1" stroke="#FF4500" strokeWidth="0.9" strokeLinecap="round" fill="none" />
      <circle cx="17.5" cy="8.5" r="1.4" fill="#fff" />
      <path d="M17.5 8.5l-3-2" stroke="#fff" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

export function XIcon({ size = 28, className = "", bg = "white" }: { size?: number; className?: string; bg?: "white" | "black" | "none" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-label="X">
      {bg === "white" && <circle cx="12" cy="12" r="12" fill="#fff" />}
      {bg === "black" && <circle cx="12" cy="12" r="12" fill="#000" />}
      <path
        d="M17.5 5h2.3l-5 5.7 5.9 7.8h-4.6l-3.6-4.7L8.3 18.5H6l5.4-6.1L5.7 5h4.7l3.3 4.3L17.5 5zm-.8 12h1.3L9.4 6.3H8L16.7 17z"
        fill={bg === "black" ? "#fff" : "#000"}
      />
    </svg>
  );
}
