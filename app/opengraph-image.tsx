import { ImageResponse } from "next/og";

/**
 * Marketing link-preview card for the Platter site root.
 *
 * The file convention auto-wires og:image and its dimensions; X uses it as the twitter:image
 * fallback (layout.tsx sets the card type), and og:title/description are declared there too.
 *
 * Drawn in the v2 faces rather than the system sans this file used to fall back to. Platter sells
 * a *designed* menu, and a card set in Helvetica argues the opposite of the product — Bodoni is
 * the whole point. Colours are the v2 brand tokens from globals.css.
 */
export const runtime = "nodejs";
export const alt = "Platter — digital menus for restaurants";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0a0807";
const TEXT = "#f6f2ea";
const OXBLOOD = "#8d2020";
const GILT = "#c9a667";
const MUTED = "#948b81";

/**
 * Google serves woff2 to a modern User-Agent and satori cannot parse woff2, so this asks as an
 * old client to get TrueType back. Any failure returns null and the card still renders in the
 * built-in sans — a plain card beats a broken route.
 */
async function googleFont(family: string, spec: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:${spec}&display=swap`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    ).then((r) => r.text());
    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('(?:truetype|opentype)'\)/)?.[1];
    if (!url) return null;
    return await fetch(url).then((r) => r.arrayBuffer());
  } catch {
    return null;
  }
}

type Face = { name: string; data: ArrayBuffer; weight: 400; style: "normal" };
const face = (name: string, data: ArrayBuffer | null): Face[] =>
  data ? [{ name, data, weight: 400, style: "normal" }] : [];

export default async function Image() {
  const [display, body, mono] = await Promise.all([
    // Bodoni Moda carries an optical-size axis, so its spec names both axes or Google refuses it.
    googleFont("Bodoni Moda", "opsz,wght@6..96,400"),
    googleFont("Public Sans", "wght@400"),
    googleFont("Martian Mono", "wght@400"),
  ]);
  const DISPLAY = display ? "Bodoni Moda" : undefined;
  const BODY = body ? "Public Sans" : undefined;
  const MONO = mono ? "Martian Mono" : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          color: TEXT,
          padding: "64px 72px",
          fontFamily: BODY,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 10,
              background: OXBLOOD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: DISPLAY,
              fontSize: 27,
              color: TEXT,
            }}
          >
            P
          </div>
          <div style={{ fontFamily: MONO, fontSize: 17, color: GILT, letterSpacing: "0.22em" }}>
            PLATTER
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontFamily: DISPLAY,
              fontSize: 88,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: TEXT,
            }}
          >
            Digital menus for restaurants
          </div>
          <div style={{ marginTop: 28, fontSize: 27, lineHeight: 1.45, color: MUTED, maxWidth: 820 }}>
            Turn your paper menu into a beautiful digital menu in minutes.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 2, background: GILT }} />
          <div style={{ fontFamily: MONO, fontSize: 17, color: MUTED, letterSpacing: "0.04em" }}>
            platter.goldhac.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [...face("Bodoni Moda", display), ...face("Public Sans", body), ...face("Martian Mono", mono)],
    },
  );
}
