import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Menu-photo/PDF uploads go through the parseMenuUpload server action.
  // 12mb leaves headroom above the 10MB file cap for multipart overhead.
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  images: {
    // Next's defaults emit 16 candidate widths per image (8 imageSizes + 8 deviceSizes), and this
    // menu renders 175 images — 2,800 srcset URLs, 486KB of the 1.56MB document, 31% of the page.
    //
    // Most of those widths can never be chosen. The widest `sizes` in the menu is 100vw at the
    // 640px breakpoint (editorial-item, item-sheet), so 640 CSS px at DPR 3 = 1920px is the
    // ceiling — 2048 and 3840 are unreachable. The narrowest is the 74px thumb (item-row), so
    // nothing ever requests below 96 — 16/32/48/64 are unreachable too, and 384 sits above the
    // thumb's DPR-3 need of 222 (which lands on 256).
    //
    // Removing only the unreachable widths: every device is served exactly the same file as
    // before, and the document loses ~44% of its srcset bytes. Re-derive these if a `sizes`
    // attribute in components/menu/ changes.
    imageSizes: [96, 128, 256],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bnyadozvvyzlzwnelrfu.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
