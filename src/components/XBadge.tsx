export function XBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded bg-black text-white font-extrabold"
      style={{ width: size, height: size, fontSize: size * 0.7, lineHeight: 1 }}
      aria-label="X"
    >
      X
    </span>
  );
}
