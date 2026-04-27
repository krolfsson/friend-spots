/** Bas-URL för OG, sitemap och canonical (sätt NEXT_PUBLIC_SITE_URL i Vercel). */
export function getPublicSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://friend-spots.vercel.app";
}

/** Origin utan avslutande slash — för `canonical`, `sitemap.xml`, m.m. */
export function getPublicSiteOrigin(): string {
  return getPublicSiteUrl().replace(/\/$/, "");
}
