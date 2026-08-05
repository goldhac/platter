import { formatFrom, formatMoney, type MoneyOpts } from "@/lib/format/currency";
import type { MenuItem } from "@/lib/queries/menu";
import { cn } from "@/lib/utils";

/**
 * The `ruled-list` layout (Carafe): name → dotted leader → price, with a quiet metadata
 * line beneath. NO image, NO seal marks — this is the `images:'none'` proof. It shares the
 * `{item, money}` contract with ItemRow but is a SEPARATE component (not an `{image && …}`
 * conditional inside a shared row) — which is precisely why the theme system holds.
 */
export function RuledItem({
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
        "block py-3 no-underline outline-none",
        "focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        soldOut ? "opacity-50" : "cursor-pointer",
      )}
    >
      <div className="flex items-baseline gap-2">
        <span className={cn("font-display leading-snug text-text", soldOut && "line-through")}>
          {item.name}
        </span>
        {/* dotted leader fills the gap between name and price */}
        <span
          aria-hidden
          className="min-w-6 flex-1 translate-y-[-0.28rem] border-b border-dotted border-hairline/60"
        />
        <span className="tabular shrink-0 text-text">
          {soldOut ? <span className="text-text-secondary">—</span> : price}
        </span>
      </div>
      {(item.description || soldOut) && (
        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
          {soldOut ? "Unavailable today" : item.description}
        </p>
      )}
    </a>
  );
}
