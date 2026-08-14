"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Image from "next/image";
import { formatMoney, formatSecondary, type MoneyOpts } from "@/lib/format/currency";
import { prettyAllergen, prettyDietary, spiceLabel } from "@/lib/format/labels";
import type { MenuItem } from "@/lib/queries/menu";
import { cn } from "@/lib/utils";
import { Seal, SealMark, SpicePips } from "./seal-mark";

/**
 * The item detail bottom sheet (v2 ceremonial). Radix Dialog gives the a11y for free:
 * role="dialog", aria-modal, focus trap, Esc-to-close, focus restoration (P4, WCAG 2.2 AA).
 * `data-sheet` hooks the slide-up/fade motion in globals.css. Controlled by MenuBoard.
 *
 * This is where the FULL story lives — the hero, the whole description, every portion, spice,
 * and allergen. The row only teases (one-line); the sheet is the reveal.
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
        <Dialog.Overlay
          data-sheet="overlay"
          className="fixed inset-0 z-40 bg-overlay backdrop-blur-[1px]"
        />
        <Dialog.Content
          data-sheet="content"
          aria-describedby={item?.description ? undefined : "sheet-no-desc"}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[22px] border-t border-hairline bg-bg pb-9 shadow-e3 outline-none"
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

const GILT_RULE =
  "linear-gradient(90deg, color-mix(in srgb, var(--color-hairline-strong) 45%, transparent), color-mix(in srgb, var(--color-hairline-strong) 4%, transparent))";

function SheetBody({ item, money }: { item: MenuItem; money: MoneyOpts }) {
  const dietary = item.dietary_tags;
  const secondary = formatSecondary(item.base_price, money);

  return (
    <div className="px-5">
      {/* Grabber — sticky so it stays as the sheet scrolls. */}
      <div className="sticky top-0 z-10 -mx-5 flex justify-center bg-bg/95 py-3.5 backdrop-blur">
        <span
          aria-hidden
          className="h-1 w-9 rounded-pill"
          style={{ background: "color-mix(in srgb, var(--color-hairline-strong) 40%, transparent)" }}
        />
      </div>

      {/* Hero — the photo, or the ceremonial seal plate (never a grey box). */}
      {item.image_url ? (
        <div className="img-skeleton relative mb-6 aspect-[4/3] w-full overflow-hidden rounded-lg border border-hairline">
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, 576px"
            className="object-cover"
          />
        </div>
      ) : (
        <div
          aria-hidden
          className="mb-6 grid aspect-[4/3] w-full place-items-center rounded-lg border border-hairline"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 0%, color-mix(in srgb, var(--color-hairline-strong) 8%, transparent), transparent 60%), linear-gradient(160deg, var(--color-surface-raised), var(--color-surface-sunken))",
          }}
        >
          <Seal glyph={item.name_zh?.[0] ?? "餐"} size={104} framed />
        </div>
      )}

      {/* Title + status seals. */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Dialog.Title className="font-display text-[28px] font-normal leading-[1.08] tracking-[-0.02em] text-text">
            {item.name}
          </Dialog.Title>
          {item.name_zh && (
            <div className="mt-1.5 font-cjk text-[15px] tracking-[0.04em] text-hairline-strong">
              {item.name_zh}
            </div>
          )}
        </div>
        {(item.is_featured || item.spice_level > 0 || dietary.includes("vegetarian")) && (
          <div className="flex shrink-0 gap-1.5 pt-1.5">
            {item.is_featured && <SealMark kind="chef" />}
            {item.spice_level > 0 && <SealMark kind="spicy" />}
            {dietary.includes("vegetarian") && <SealMark kind="veg" />}
          </div>
        )}
      </div>

      <div className="my-5 h-px" style={{ background: GILT_RULE }} />

      {/* The full description — the reveal the row withholds. */}
      {item.description ? (
        <Dialog.Description className="text-[14.5px] leading-[1.65] text-text-secondary">
          {item.description}
        </Dialog.Description>
      ) : (
        <span id="sheet-no-desc" className="sr-only">
          {item.name} details
        </span>
      )}

      {/* Price — portions, or a single ledger figure with the dual-currency line. */}
      {item.variants.length > 0 ? (
        <div className="mt-7">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-hairline-strong">
            Portion
          </div>
          <div className="flex flex-wrap gap-2">
            {item.variants.map((v) => {
              const vSecondary = formatSecondary(v.price, money);
              return (
                <div
                  key={v.id}
                  className={cn(
                    "min-w-[112px] rounded-sm border px-3.5 py-2.5",
                    v.is_available ? "border-hairline" : "border-hairline/50 opacity-50",
                  )}
                >
                  <div className="text-[13.5px] text-text">{v.label}</div>
                  <div className="tabular mt-1 text-[14px] tracking-[-0.04em] text-text">
                    {formatMoney(v.price, money)}
                  </div>
                  {vSecondary && (
                    <div className="tabular mt-0.5 text-[11px] tracking-[-0.04em] text-text-secondary">
                      {vSecondary}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mt-7 flex items-baseline gap-2.5">
          <span className="tabular text-[26px] tracking-[-0.04em] text-text">
            {formatMoney(item.base_price, money)}
          </span>
          {secondary && (
            <span className="tabular text-[14px] tracking-[-0.04em] text-text-secondary">{secondary}</span>
          )}
        </div>
      )}

      {/* Spice — octagon pips + label, same motif as the row. */}
      {item.spice_level > 0 && (
        <div className="mt-6 flex items-center gap-2.5">
          <SpicePips level={item.spice_level} />
          <span className="text-[13px] text-text-secondary">Spice · {spiceLabel(item.spice_level)}</span>
        </div>
      )}

      {/* Allergens & dietary. */}
      {(dietary.length > 0 || item.allergens.length > 0) && (
        <div className="mt-7 border-t border-hairline pt-5">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-hairline-strong">
            Allergens &amp; dietary
          </div>
          <div className="flex flex-wrap gap-1.5 text-[12px]">
            {dietary.map((t) => (
              <span
                key={t}
                className="rounded-xs border border-hairline px-2.5 py-1 text-text-secondary"
              >
                {prettyDietary(t)}
              </span>
            ))}
            {item.allergens.map((a) => (
              <span key={a} className="rounded-xs px-2.5 py-1 text-text-tertiary">
                Contains {prettyAllergen(a).toLowerCase()}
              </span>
            ))}
          </div>
        </div>
      )}

      <Dialog.Close className="mt-8 w-full rounded-sm border border-hairline py-3.5 font-mono text-[11px] uppercase tracking-[0.18em] text-text-secondary outline-none transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-hairline-strong/70">
        Close
      </Dialog.Close>
    </div>
  );
}
