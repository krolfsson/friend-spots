import type { DashboardSpot } from "@/lib/dashboardTypes";

/** Most plusses first; tie-break by spot name (sv). Recommendations do not affect order. */
export function sortSpotsForDisplay(a: DashboardSpot, b: DashboardSpot): number {
  if (b.plusCount !== a.plusCount) return b.plusCount - a.plusCount;
  return a.name.localeCompare(b.name, "sv");
}
