import type { DashboardSpot } from "@/lib/dashboardTypes";

/** Flest plus först, vid lika plus: namn A–Ö. Rekommendationer styr inte ordningen. */
export function sortSpotsForDisplay(a: DashboardSpot, b: DashboardSpot): number {
  if (b.plusCount !== a.plusCount) return b.plusCount - a.plusCount;
  return a.name.localeCompare(b.name, "sv");
}
