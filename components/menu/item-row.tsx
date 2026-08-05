import { formatFrom, formatMoney, type MoneyOpts } from "@/lib/format/currency";
import type { MenuItem } from "@/lib/queries/menu";
import { cn } from "@/lib/utils";
import { ItemThumb } from "./item-thumb";
import { SealMark } from "./seal-mark";

/**
 * A menu row. Rendered on the server as a real `<a>` to the item's URL, so it
 * works without JS and is crawlable; MenuBoard intercepts the click to open the
 * shallow-routed sheet (progressive enhancement). Sold-out rows dim, carry the
 * struck 售 seal, and are not tappable (P8).
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
  const price =
    item.from_price != null
      ? formatFrom(item.from_price, money)
      : formatMoney(item.base_price, money);

  return (
    <a
      href={`${basePath}/${item.category_slug}/${item.slug}`}
      data-item-slug={item.slug}
      aria-disabled={soldOut || undefined}
      className={cn(
        "flex items-start justify-between gap-4 rounded-card py-4 no-underline outline-none",
        "focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        soldOut ? "opacity-50" : "cursor-pointer",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold leading-snug text-text">{item.name}</span>
          {soldOut ? (
            <SealMark kind="soldout" />
          ) : (
            <>
              {item.is_featured && <SealMark kind="chef" />}
              {item.spice_level > 0 && <SealMark kind="spicy" />}
              {item.dietary_tags.includes("vegetarian") && <SealMark kind="veg" />}
            </>
          )}
        </div>
        {item.description && (
          <p className="mt-1 line-clamp-1 text-sm leading-relaxed text-text-secondary">{item.description}</p>
        )}
        <div className="tabular mt-1.5 text-sm text-text/90">
          {soldOut ? <span className="text-text-secondary">Sold out today</span> : price}
        </div>
      </div>
      <ItemThumb src={item.image_url} alt={item.name} size={72} />
    </a>
  );
}
