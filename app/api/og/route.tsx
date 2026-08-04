import { ImageResponse } from "next/og";
import { formatMoney } from "@/lib/format/currency";
import { getMenu } from "@/lib/queries/menu";

const RESTAURANT_SLUG = "jin-canting";

// Per-item OG image (P14), served from a plain route so it isn't a child of the
// optional catch-all menu route. Latin-only so the default font renders cleanly.
export async function GET(request: Request) {
  const itemSlug = new URL(request.url).searchParams.get("item");
  const menu = await getMenu(RESTAURANT_SLUG);
  const r = menu.restaurant;
  const money = { currency: r.currency, locale: r.locale };

  const item = itemSlug ? menu.itemsBySlug[itemSlug] : null;
  const title = item ? item.name : r.name;
  const sub = item
    ? item.from_price != null
      ? `from ${formatMoney(item.from_price, money)}`
      : formatMoney(item.base_price, money)
    : "Menu";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#14110f",
          color: "#f7f4ee",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: "#8e1d1d",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#f7f4ee",
              fontSize: 26,
            }}
          >
            厨
          </div>
          <div style={{ fontSize: 30, letterSpacing: 6, color: "#b08d4f" }}>JĪN CĀNTĪNG</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 88, fontWeight: 700, lineHeight: 1.05 }}>{title}</div>
          <div style={{ fontSize: 48, color: "#b08d4f" }}>{sub}</div>
        </div>

        <div style={{ fontSize: 28, color: "#8a827a" }}>De Geogold Hotel</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
