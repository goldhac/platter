import { ImageResponse } from "next/og";
import { formatMoney } from "@/lib/format/currency";
import { getMenu } from "@/lib/queries/menu";
import { resolveTheme } from "@/lib/themes";
import { FLAGSHIP_SLUG } from "@/lib/venue/resolve";

// Per-venue / per-item OG image (P14), served from a plain route so it isn't a
// child of the optional catch-all menu route. `?r=<slug>` picks the venue (apex
// flagship by default); `?item=<slug>` a dish. Colours follow the venue's theme.
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const itemSlug = sp.get("item");
  const rSlug = sp.get("r") ?? FLAGSHIP_SLUG;

  const menu = await getMenu(rSlug);
  const r = menu.restaurant;
  const money = { currency: r.currency, locale: r.locale };
  const t = resolveTheme(menu.themeId, menu.themeConfig).cssVars as Record<string, string>;
  const bg = t["--color-bg"] ?? "#14110f";
  const fg = t["--color-text"] ?? "#f7f4ee";
  const accent = t["--color-accent"] ?? "#b08d4f";
  const onAccent = t["--color-on-accent"] ?? "#f7f4ee";

  const item = itemSlug ? menu.itemsBySlug[itemSlug] : null;
  const title = item ? item.name : "Menu";
  const sub = item
    ? item.from_price != null
      ? `from ${formatMoney(item.from_price, money)}`
      : formatMoney(item.base_price, money)
    : r.address || "Browse dishes & prices";
  const initial = r.name.trim().charAt(0).toUpperCase() || "•";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: bg,
          color: fg,
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: accent,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: onAccent,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            {initial}
          </div>
          <div style={{ fontSize: 30, letterSpacing: 6, color: accent }}>{r.name.toUpperCase()}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>{title}</div>
          <div style={{ fontSize: 48, color: accent }}>{sub}</div>
        </div>

        <div style={{ fontSize: 28, opacity: 0.6 }}>{r.name}</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
