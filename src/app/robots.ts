import type { MetadataRoute } from "next";
import { getPublicSiteOrigin } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteOrigin();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
