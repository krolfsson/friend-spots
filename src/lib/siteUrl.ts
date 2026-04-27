/** Bas-URL för OG, sitemap och canonical. Produktion: https://mapsies.com (sätt NEXT_PUBLIC_SITE_URL i Vercel om du behöver annan origin). */
export function getPublicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://mapsies.com";
}

/** Origin utan avslutande slash — för `canonical`, `sitemap.xml`, m.m. */
export function getPublicSiteOrigin(): string {
  return getPublicSiteUrl().replace(/\/$/, "");
}
