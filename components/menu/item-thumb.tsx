import Image from "next/image";
import { Seal } from "./seal-mark";

/**
 * A dish thumbnail (v2). With a photo: the image in a square frame + `.img-skeleton` shimmer
 * while it loads. Without one (~80% of items): the chamfered-octagon seal on a debossed plate —
 * the intentional fallback, never a grey box.
 */
export function ItemThumb({ src, alt, size = 74 }: { src: string | null; alt: string; size?: number }) {
  if (src) {
    return (
      <span
        className="img-skeleton relative block shrink-0 overflow-hidden rounded-sm border border-hairline"
        style={{ width: size, height: size }}
      >
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" />
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-sm border border-hairline"
      style={{
        width: size,
        height: size,
        background:
          "radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--color-hairline-strong) 7%, transparent), transparent 58%), linear-gradient(160deg, var(--color-surface-raised), var(--color-surface-sunken))",
      }}
    >
      <Seal glyph="餐" size={Math.round(size * 0.57)} />
    </span>
  );
}
