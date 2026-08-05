import Image from "next/image";
import { formatFrom, formatMoney, type MoneyOpts } from "@/lib/format/currency";
import type { MenuItem } from "@/lib/queries/menu";
import { cn } from "@/lib/utils";

/**
 * The `editorial` layout (Palm): a full-bleed photo band, one item per row, name + price
 * beneath on the ground. Images optional — a missing photo falls back to a mark. Text sits on
 * the page ground (not a card), so it uses `text` / `text-secondary`.
 */
export function EditorialItem({ item, money }: { item: MenuItem; money: MoneyOpts }) {
  const soldOut = !item.is_available;
  const price =
    item.from_price != null ? formatFrom(item.from_price, money) : formatMoney(item.base_price, money);

  return (
    <a
      href={`/menu/${item.category_slug}/${item.slug}`}
      data-item-slug={item.slug}
      aria-disabled={soldOut || undefined}
      className={cn(
        "block no-underline outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
        soldOut ? "opacity-50" : "cursor-pointer",
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-card border border-hairline/20 bg-black/20">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 560px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-cjk text-4xl text-accent/40">餐</span>
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className={cn("font-display text-lg leading-snug text-text", soldOut && "line-through")}>
          {item.name}
        </span>
        <span className="tabular shrink-0 text-text">{soldOut ? "—" : price}</span>
      </div>
      {item.description && <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">{item.description}</p>}
    </a>
  );
}
