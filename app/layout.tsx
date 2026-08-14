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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Platter — digital menus for restaurants", template: "%s" },
  description: "Turn your paper menu into a beautiful digital menu in minutes.",
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
