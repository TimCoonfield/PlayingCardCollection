import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // The archive uses a handful of predictable display sizes. Keeping this list tight avoids
    // generating near-duplicate transformations for every source photo and device width.
    // These are a strict subset of Next's previous defaults, so existing cached variants
    // remain reusable after deployment while future source sets offer far fewer choices.
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [64, 128, 256, 384],
    qualities: [75],
    formats: ["image/webp"],
    minimumCacheTTL: 10368000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
