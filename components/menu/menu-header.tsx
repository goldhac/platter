import type { MenuRestaurant, OpenState } from "@/lib/queries/menu";
import { MenuActions } from "./menu-actions";
import { Seal } from "./seal-mark";

// v2 ceremonial venue header — a framed seal + share/print, 中文 letterspaced above the venue
// name in Bodoni, the location rule-flanked in the ledger face, and the open/closed pill.
export function MenuHeader({
  restaurant,
  openState,
  shareUrl,
  printHref,
}: {
  restaurant: MenuRestaurant;
  openState: OpenState;
  shareUrl: string;
  printHref: string;
}) {
  const sealGlyph = restaurant.name_zh?.[0] ?? restaurant.name.slice(0, 1);
  const rule = "color-mix(in srgb, var(--color-hairline-strong) 40%, transparent)";

  return (
    <header className="relative pb-[26px] pt-[34px] text-center">
      <div className="mb-[30px] flex items-center justify-between">
        <Seal glyph={sealGlyph} framed size={38} />
        <MenuActions shareUrl={shareUrl} shareTitle={restaurant.name} printHref={printHref} />
      </div>

      {restaurant.name_zh && (
        <div className="font-cjk text-[15px] tracking-[0.42em] text-hairline-strong" style={{ paddingLeft: "0.42em" }}>
          {restaurant.name_zh}
        </div>
      )}
      <h1 className="mt-[14px] font-display text-[46px] font-normal leading-[1.02] tracking-[-0.03em] text-text">
        {restaurant.name}
      </h1>

      {restaurant.address && (
        <div className="mt-[18px] flex items-center justify-center gap-3">
          <span className="h-px w-[26px]" style={{ background: rule }} />
          <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-tertiary">{restaurant.address}</span>
          <span className="h-px w-[26px]" style={{ background: rule }} />
        </div>
      )}

      <div className="mt-5">
        <span className="inline-flex h-8 items-center gap-[9px] rounded-full border border-hairline px-[15px] text-[12.5px] text-text-secondary">
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: openState.open ? "var(--color-positive)" : "var(--color-text-tertiary)" }}
          />
          {openState.label}
        </span>
      </div>
    </header>
  );
}
