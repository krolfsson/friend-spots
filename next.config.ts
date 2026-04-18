import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/c/:slug",
        destination: "/?city=:slug",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
