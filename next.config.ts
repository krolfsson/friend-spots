import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
