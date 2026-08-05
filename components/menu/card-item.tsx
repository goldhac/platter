import Image from "next/image";
import { formatFrom, formatMoney, type MoneyOpts } from "@/lib/format/currency";
import type { MenuItem } from "@/lib/queries/menu";
import { cn } from "@/lib/utils";

/**
 * The `card-grid` layout (Counter): a 2-up photo card — image on top, name + price on the
 * card surface. Counter is `images:'required'`, so the photo is the hero; a missing image
 * falls back to a mark (the operator is nudged to add photos). Text sits on the CARD, so it
 * uses `text-on-surface` — a different token than the list layouts, which the contract handles.
 */
export function CardItem({ item, money }: { item: MenuItem; money: MoneyOpts }) {
  const soldOut = !item.is_available;
  const price =
    item.from_price != null ? formatFrom(item.from_price, money) : formatMoney(item.base_price, money);

  return (
    <a
      href={`/menu/${item.category_slug}/${item.slug}`}
      data-item-slug={item.slug}
      aria-disabled={soldOut || undefined}
      className={cn(
        "block overflow-hidden rounded-card border border-hairline/20 bg-surface no-underline outline-none",
        "focus-visible:ring-2 focus-visible:ring-accent/70",
        soldOut ? "opacity-50" : "cursor-pointer",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-black/20">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 50vw, 280px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-cjk text-3xl text-accent/50">餐</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <span className={cn("font-semibold leading-snug text-text-on-surface", soldOut && "line-through")}>
          {item.name}
        </span>
        <div className="tabular mt-1 text-sm text-text-on-surface/80">
          {soldOut ? "Sold out" : price}
        </div>
      </div>
    </a>
  );
}
