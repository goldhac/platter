"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { formatMoney, type MoneyOpts } from "@/lib/format/currency";
import { prettyAllergen, prettyDietary, spiceLabel } from "@/lib/format/labels";
import type { MenuItem } from "@/lib/queries/menu";
import { cn } from "@/lib/utils";
import { SealMark } from "./seal-mark";

/**
 * The item detail bottom sheet. Radix Dialog provides the accessibility we need
 * for free: role="dialog", aria-modal, focus trap, Esc-to-close, and focus
 * restoration to the trigger (P4, WCAG 2.2 AA). Controlled by MenuBoard.
 */
export function ItemSheet({
  item,
  money,
  onClose,
}: {
  item: MenuItem | null;
  money: MoneyOpts;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open={item !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay data-sheet="overlay" className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content
          data-sheet="content"
          aria-describedby={item?.description ? undefined : "sheet-no-desc"}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl border-t border-hairline/25 bg-bg pb-8 shadow-plate outline-none"
        >
          {item ? (
            <SheetBody item={item} money={money} />
          ) : (
            <Dialog.Title className="sr-only">Menu item</Dialog.Title>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SheetBody({ item, money }: { item: MenuItem; money: MoneyOpts }) {
  const dietary = item.dietary_tags;

  return (
    <div className="px-5">
      <div className="sticky top-0 -mx-5 flex justify-center bg-bg/95 py-3 backdrop-blur">
        <span aria-hidden className="h-1 w-10 rounded-full bg-hairline/50" />
      </div>

      <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-card border border-hairline/25">
        {item.image_url ? (
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 576px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="font-cjk text-5xl text-accent/60">餐</span>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Dialog.Title className="font-display text-2xl leading-tight text-text">
            {item.name}
          </Dialog.Title>
          {item.name_zh && <div className="mt-0.5 font-cjk text-accent">{item.name_zh}</div>}
        </div>
        <div className="flex shrink-0 gap-1.5 pt-1">
          {item.is_featured && <SealMark kind="chef" />}
          {item.spice_level > 0 && <SealMark kind="spicy" />}
          {dietary.includes("vegetarian") && <SealMark kind="veg" />}
        </div>
      </div>

      <div className="my-4 h-px bg-hairline/20" />

      {item.description ? (
        <Dialog.Description className="text-sm leading-relaxed text-text-secondary">
          {item.description}
        </Dialog.Description>
      ) : (
        <span id="sheet-no-desc" className="sr-only">
          {item.name} details
        </span>
      )}

      {item.variants.length > 0 ? (
        <div className="mt-6">
          <div className="tabular mb-2 text-[0.7rem] uppercase tracking-[0.2em] text-hairline">
            Portion
          </div>
          <div className="flex flex-wrap gap-2">
            {item.variants.map((v) => (
              <div
                key={v.id}
                className={cn(
                  "min-w-24 rounded-card border px-3 py-2",
                  v.is_available ? "border-hairline/40" : "border-hairline/20 opacity-50",
                )}
              >
                <div className="text-sm text-text">{v.label}</div>
                <div className="tabular mt-0.5 text-sm text-text/90">
                  {formatMoney(v.price, money)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="tabular mt-6 text-xl text-text">
          {formatMoney(item.base_price, money)}
        </div>
      )}

      {item.spice_level > 0 && (
        <div className="mt-5 flex items-center gap-2 text-sm">
          <span aria-hidden className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full",
                  i < item.spice_level ? "bg-accent" : "bg-hairline/30",
                )}
              />
            ))}
          </span>
          <span className="text-text-secondary">Spice · {spiceLabel(item.spice_level)}</span>
        </div>
      )}

      {(dietary.length > 0 || item.allergens.length > 0) && (
        <div className="mt-6 border-t border-hairline/15 pt-4">
          <div className="tabular mb-2 text-[0.7rem] uppercase tracking-[0.2em] text-hairline">
            Allergens &amp; dietary
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {dietary.map((t) => (
              <span
                key={t}
                className="rounded-card border border-hairline/30 px-2 py-1 text-text-secondary"
              >
                {prettyDietary(t)}
              </span>
            ))}
            {item.allergens.map((a) => (
              <span key={a} className="rounded-card px-2 py-1 text-text-secondary/80">
                Contains {prettyAllergen(a).toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      <Dialog.Close className="mt-7 w-full rounded-card border border-hairline/30 py-3 text-sm text-text-secondary outline-none transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-accent/70">
        Close
      </Dialog.Close>
    </div>
  );
}
