import type { MetadataRoute } from "next";
import { getPublicSiteOrigin } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getPublicSiteOrigin();
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/guides/delad-karta`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${base}/guides/shared-map`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
  ];
}
