/** Normaliserar vad användaren skriver till rum-slug (första path-segment, utan ledande slash). */
export function normalizeRoomSlugInput(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  const noSlash = v.replace(/^\/+/, "").trim();
  const first = noSlash.split("/")[0]?.trim() ?? "";
  return first;
}
