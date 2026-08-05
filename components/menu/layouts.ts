import type { ComponentType } from "react";
import type { MoneyOpts } from "@/lib/format/currency";
import type { MenuItem } from "@/lib/queries/menu";
import type { LayoutId } from "@/lib/themes";
import { ItemRow } from "./item-row";
import { RuledItem } from "./ruled-item";
import { CardItem } from "./card-item";
import { EditorialItem } from "./editorial-item";

export type ItemComponent = ComponentType<{ item: MenuItem; money: MoneyOpts }>;
export type LayoutSpec = { Item: ItemComponent; listClassName: string };

/**
 * Layout → { item component, list-wrapper classes }. Each layout is its OWN component (never a
 * parametric mega-component — foundation.md §13) AND owns how its items pack: a divided list,
 * a photo grid, or stacked editorial bands. Client-safe (all presentational), so both the
 * server grouped view (page) and the client `MenuBoard` filtered view select from this one map.
 */
export const LAYOUTS: Record<LayoutId, LayoutSpec> = {
  "list-dense": { Item: ItemRow, listClassName: "divide-y divide-hairline/10" },
  "ruled-list": { Item: RuledItem, listClassName: "divide-y divide-hairline/10" },
  "card-grid": { Item: CardItem, listClassName: "grid grid-cols-2 gap-3 pt-3" },
  editorial: { Item: EditorialItem, listClassName: "flex flex-col gap-7 pt-3" },
};

export function layoutSpec(layout: LayoutId): LayoutSpec {
  return LAYOUTS[layout] ?? LAYOUTS["list-dense"];
}
