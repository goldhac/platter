import { cn } from "@/lib/utils";

// The 印章 seal — the one bold element; replaces every generic pill/icon
// (ui-rules.md §4). Accessible: each carries a text label.
const GLYPH = { chef: "厨", spicy: "辣", veg: "素", soldout: "售" } as const;
const LABEL = {
  chef: "Chef's pick",
  spicy: "Spicy",
  veg: "Vegetarian",
  soldout: "Sold out",
} as const;

export type SealKind = keyof typeof GLYPH;

export function SealMark({ kind, className }: { kind: SealKind; className?: string }) {
  const soldout = kind === "soldout";
  return (
    <span
      role="img"
      aria-label={LABEL[kind]}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 select-none items-center justify-center rounded-seal font-cjk text-[0.7rem] leading-none",
        soldout
          ? "text-text-secondary line-through ring-1 ring-inset ring-hairline/50"
          : "bg-accent text-on-accent",
        className,
      )}
    >
      {GLYPH[kind]}
    </span>
  );
}
