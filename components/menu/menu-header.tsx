import type { MenuRestaurant, OpenState } from "@/lib/queries/menu";
import { cn } from "@/lib/utils";

export function MenuHeader({
  restaurant,
  openState,
}: {
  restaurant: MenuRestaurant;
  openState: OpenState;
}) {
  return (
    <header className="pb-2 pt-8">
      {restaurant.name_zh && (
        <div className="font-cjk text-xl leading-none text-accent">{restaurant.name_zh}</div>
      )}
      <h1 className="mt-1.5 font-display text-4xl leading-tight tracking-tight text-text">
        {restaurant.name}
      </h1>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span
          aria-hidden
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            openState.open ? "bg-positive" : "bg-text-secondary",
          )}
        />
        <span className={openState.open ? "text-positive" : "text-text-secondary"}>{openState.label}</span>
      </div>
    </header>
  );
}
