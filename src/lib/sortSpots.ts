import type { DashboardSpot } from "@/lib/dashboardTypes";

/** Most plusses first, then most recommendations, then name. */
export function sortSpotsForDisplay(a: DashboardSpot, b: DashboardSpot): number {
  if (b.plusCount !== a.plusCount) return b.plusCount - a.plusCount;
  if (b.recommendations.length !== a.recommendations.length) {
    return b.recommendations.length - a.recommendations.length;
  }
  return a.name.localeCompare(b.name, "sv");
}
