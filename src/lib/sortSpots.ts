import type { DashboardSpot } from "@/lib/dashboardTypes";

/** Flest plus först, vid lika plus: namn A–Ö. Rekommendationer styr inte ordningen. */
export function sortSpotsForDisplay(a: DashboardSpot, b: DashboardSpot): number {
  if (b.plusCount !== a.plusCount) return b.plusCount - a.plusCount;
  return a.name.localeCompare(b.name, "sv");
}

function createdAtMs(s: DashboardSpot): number {
  const t = Date.parse(s.createdAt);
  return Number.isFinite(t) ? t : 0;
}

/** Nyast först; vid samma tidstämpel: namn A–Ö. */
export function sortSpotsByCreatedAtNewestFirst(a: DashboardSpot, b: DashboardSpot): number {
  const da = createdAtMs(a);
  const db = createdAtMs(b);
  if (db !== da) return db - da;
  return a.name.localeCompare(b.name, "sv");
}
