import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake heavy libs so only the used parts land in the client bundle.
    optimizePackageImports: ["recharts"],
  },

  images: {
    // Serve WebP/AVIF automatically; tune quality for good compression.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  async headers() {
    return [
      {
        // Immutable cache for hashed static assets (_next/static).
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Long cache for public images/icons that don't change often.
        source: "/:file(.*\\.(?:png|jpg|jpeg|svg|ico|webp|avif|woff2?))",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: "/beta-2026",
        destination: "/rolfsson",
        permanent: true,
      },
      {
        source: "/c/:slug",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
