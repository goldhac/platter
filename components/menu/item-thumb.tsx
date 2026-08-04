import Image from "next/image";

/**
 * A dish thumbnail, or — when there's no photo (~80% of items, Assumption 3) —
 * the intentional seal-on-hairline fallback, never a grey box (foundation.md §7 #18).
 */
export function ItemThumb({
  src,
  alt,
  size = 72,
}: {
  src: string | null;
  alt: string;
  size?: number;
}) {
  if (src) {
    return (
      <div
        className="relative shrink-0 overflow-hidden rounded-card border border-hairline/25 bg-black/30"
        style={{ width: size, height: size }}
      >
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-card border border-hairline/40"
      style={{ width: size, height: size }}
    >
      <span className="font-cjk text-lg text-accent/70">餐</span>
    </div>
  );
}
