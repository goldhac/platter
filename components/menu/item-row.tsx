import { formatFrom, formatMoney, formatSecondary, type MoneyOpts } from "@/lib/format/currency";
import type { MenuItem } from "@/lib/queries/menu";
import { cn } from "@/lib/utils";
import { ItemThumb } from "./item-thumb";
import { SealMark, SpicePips } from "./seal-mark";

/**
 * v2 menu row — a server `<a>` (works without JS, crawlable); MenuBoard intercepts the click to
 * open the shallow-routed sheet. Name leads (+ 中文 + chef's-pick seal), one-line description,
 * then a single meta row: price · dual-currency · veg · spice pips. 74px thumb (photo or seal)
 * on the right. Sold-out dims to 42% and is not tappable.
 */
export function ItemRow({
  item,
  money,
  basePath = "/menu",
}: {
  item: MenuItem;
  money: MoneyOpts;
  basePath?: string;
}) {
  const soldOut = !item.is_available;
  const amount = item.from_price ?? item.base_price;
  const price = item.from_price != null ? formatFrom(item.from_price, money) : formatMoney(item.base_price, money);
  const secondary = formatSecondary(amount, money);
  const veg = item.dietary_tags.includes("vegetarian");

  return (
    <a
      href={`${basePath}/${item.category_slug}/${item.slug}`}
      data-item-slug={item.slug}
      aria-disabled={soldOut || undefined}
      className={cn(
        "flex items-start gap-[15px] py-5 no-underline outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-hairline-strong/70",
        soldOut ? "opacity-[.42]" : "cursor-pointer",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-[15.5px] font-medium leading-[1.3] text-text">{item.name}</span>
          {item.name_zh && <span className="font-cjk text-[13px] text-text-tertiary">{item.name_zh}</span>}
          {!soldOut && item.is_featured && <SealMark kind="chef" />}
          {soldOut && (
            <span className="inline-flex h-5 items-center rounded-xs border border-hairline px-2 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Sold out
            </span>
          )}
        </span>

        {item.description && (
          <span className="mt-1.5 line-clamp-1 text-[13.5px] leading-[1.5] text-text-secondary">{item.description}</span>
        )}

        <span className="mt-[11px] flex items-center gap-2.5">
          <span className="tabular text-[13px] tracking-[-0.04em] text-text">{price}</span>
          {secondary && <span className="tabular text-[11px] tracking-[-0.04em] text-text-secondary">{secondary}</span>}
          {veg && (
            <span
              className="inline-flex h-5 items-center rounded-xs border px-2 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-positive"
              style={{ borderColor: "color-mix(in srgb, var(--color-positive) 40%, transparent)" }}
            >
              Veg
            </span>
          )}
          {!soldOut && <SpicePips level={item.spice_level} />}
        </span>
      </span>

      <ItemThumb src={item.image_url} alt={item.name} size={74} />
    </a>
  );
}
