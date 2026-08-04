import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Mono, Inter, Noto_Serif_SC } from "next/font/google";
import "./globals.css";

// The four faces (ui-tokens.md §3). Fraunces & Inter are variable (no weight).
// Noto Serif SC loads its LATIN subset only for now — the heavy CJK subset stays
// off the critical path until *_zh content exists (library-docs.md), so the 金餐厅
// mark falls back to a system CJK serif until then.
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-plex-mono",
  weight: ["400", "500"],
  display: "swap",
});
const notoSerifSC = Noto_Serif_SC({
  subsets: ["latin"],
  variable: "--font-noto-serif-sc",
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Jīn Cāntīng · 金餐厅",
  description: "The menu at Jīn Cāntīng, De Geogold Hotel.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} ${notoSerifSC.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
