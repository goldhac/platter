import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Menu-photo/PDF uploads go through the parseMenuUpload server action.
  // 12mb leaves headroom above the 10MB file cap for multipart overhead.
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
  images: {
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
