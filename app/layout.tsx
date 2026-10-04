import type { Metadata } from "next";
import {
  Bodoni_Moda,
  Fraunces,
  IBM_Plex_Mono,
  Inter,
  Martian_Mono,
  Noto_Serif_SC,
  Public_Sans,
} from "next/font/google";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import "./globals.css";

// Platter v2 faces (redesign 2026-08): Bodoni Moda (display) · Public Sans (text) ·
// Martian Mono (ledger) · Noto Serif SC (CJK). These drive the marketing + admin surfaces.
const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  style: ["normal", "italic"],
  display: "swap",
});
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });
const martianMono = Martian_Mono({ subsets: ["latin"], variable: "--font-martian", display: "swap" });
const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  variable: "--font-noto-serif-sc",
  weight: ["400", "600"],
  display: "swap",
});

// v1 faces — still referenced by the diner menu's theme manifests (lib/themes/*) until the
// menu redesign lands; kept loaded so the live menu is unchanged during the marketing rebuild.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  // Falls back to the live host, not localhost. metadataBase is what every relative OG URL is
  // resolved against, so if NEXT_PUBLIC_SITE_URL is ever missing in the deployed environment the
  // card would point at http://localhost:3000/opengraph-image — a URL no unfurler can fetch, and
  // a link preview that silently shows nothing with no error anywhere to explain it.
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://platter.goldhac.com"),
  title: { default: "Platter — digital menus for restaurants", template: "%s" },
  description: "Turn your paper menu into a beautiful digital menu in minutes.",
  // Stated explicitly rather than left to fall back to <title> and the description meta. Unfurlers
  // differ in how far they will fall back, and og:title is the one line every one of them reads.
  openGraph: {
    title: "Platter — digital menus for restaurants",
    description: "Turn your paper menu into a beautiful digital menu in minutes.",
    type: "website",
    siteName: "Platter",
    url: "/",
  },
  // og:image comes from app/opengraph-image.tsx; this makes X render it as a large card
  // (X falls back to og:image when twitter:image is absent). Title/description unfurl from above.
  twitter: { card: "summary_large_image" },
};

const gaId = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${bodoni.variable} ${publicSans.variable} ${martianMono.variable} ${notoSerifSC.variable} ${fraunces.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body>
        {children}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
