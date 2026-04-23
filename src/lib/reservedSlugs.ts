/** Segment som krockar med App Router eller statiska resurser. */
export const RESERVED_ROOM_SLUGS = new Set([
  "api",
  "_next",
  "static",
  "favicon",
  "robots",
  "sitemap",
  "manifest",
  "admin",
]);

export function isReservedRoomSlug(slug: string): boolean {
  const s = slug.trim().toLowerCase();
  if (!s) return true;
  return RESERVED_ROOM_SLUGS.has(s);
}
