import { cn } from "@/lib/utils";

// The seal — a chamfered octagon, the one bold motif (v2 redesign). NOTHING else in the system
// is octagonal, so it never reads as a button. Used as: the no-photo dish plate, the chef's-pick
// badge, the spice pip, and the empty-state / venue mark. Token-based (menu is token-linted).
export const OCTAGON = "polygon(29% 0,71% 0,100% 29%,100% 71%,71% 100%,29% 100%,0 71%,0 29%)";

const GLYPH = { chef: "厨", spicy: "辣", veg: "素", soldout: "售" } as const;
const LABEL = { chef: "Chef's pick", spicy: "Spicy", veg: "Vegetarian", soldout: "Sold out" } as const;
export type SealKind = keyof typeof GLYPH;

/** A glyph seal on a debossed dark plate (the no-photo fallback, empty-state, venue mark). When
 *  `framed`, draws the ceremonial double-octagon (a gilt inner rim). */
export function Seal({
  glyph,
  size = 42,
  framed = false,
  className,
}: {
  glyph: string;
  size?: number;
  framed?: boolean;
  className?: string;
}) {
  const inner = Math.round(size * 0.82);
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 select-none place-items-center", className)}
      style={{
        width: size,
        height: size,
        background: "linear-gradient(158deg, var(--color-surface-raised), var(--color-surface-sunken))",
        boxShadow: "0 1px 0 rgb(246 242 234 / 0.09) inset, 0 -1px 2px rgb(0 0 0 / 0.5) inset",
        clipPath: OCTAGON,
      }}
    >
      {framed ? (
        <span
          className="grid place-items-center font-cjk"
          style={{
            width: inner,
            height: inner,
            border: "1px solid color-mix(in srgb, var(--color-hairline-strong) 34%, transparent)",
            clipPath: OCTAGON,
            fontSize: size * 0.37,
            color: "var(--color-hairline-strong)",
          }}
        >
          {glyph}
        </span>
      ) : (
        <span
          className="font-cjk"
          style={{ fontSize: size * 0.4, color: "color-mix(in srgb, var(--color-hairline-strong) 62%, transparent)" }}
        >
          {glyph}
        </span>
      )}
    </span>
  );
}

/** A small octagon badge — chef's-pick (accent fill), or veg/spicy/sold-out. */
export function SealMark({ kind, className }: { kind: SealKind; className?: string }) {
  const accent = kind === "chef";
  return (
    <span
      role="img"
      aria-label={LABEL[kind]}
      className={cn("inline-grid h-[19px] w-[19px] shrink-0 select-none place-items-center font-cjk text-[10px] leading-none", className)}
      style={{
        clipPath: OCTAGON,
        background: accent ? "var(--color-accent)" : "transparent",
        color: accent ? "var(--color-on-accent)" : "var(--color-hairline-strong)",
        border: accent ? undefined : "1px solid color-mix(in srgb, var(--color-hairline-strong) 40%, transparent)",
      }}
    >
      {GLYPH[kind]}
    </span>
  );
}

/** A single spice pip — a tiny filled octagon (accent). Render `level` of them. */
export function SpicePips({ level }: { level: number }) {
  if (level <= 0) return null;
  return (
    <span aria-label={`Spice ${level} of 3`} className="inline-flex gap-[3px]">
      {Array.from({ length: Math.min(3, level) }).map((_, i) => (
        <span key={i} aria-hidden style={{ width: 11, height: 11, clipPath: OCTAGON, background: "var(--color-accent-hover)" }} />
      ))}
    </span>
  );
}
