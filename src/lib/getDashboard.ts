import type { DashboardBySlug, DashboardSpot } from "@/lib/dashboardTypes";
import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const cities = await prisma.city.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { spots: true } } },
  });

  if (!cities.length) {
    return { cities, bySlug: {} as DashboardBySlug };
  }

  const allSpots = await prisma.spot.findMany({
    include: {
      recommendations: { orderBy: { createdAt: "asc" } },
      city: { select: { slug: true } },
    },
  });

  const bySlug: DashboardBySlug = {};

  for (const city of cities) {
    const list: DashboardSpot[] = allSpots
      .filter((s) => s.city.slug === city.slug)
      .map((s) => ({
        id: s.id,
        googlePlaceId: s.googlePlaceId,
        name: s.name,
        neighborhood: s.neighborhood,
        category: s.category,
        emoji: s.emoji,
        lat: s.lat,
        lng: s.lng,
        recommendations: s.recommendations.map((r) => ({
          id: r.id,
          contributorName: r.contributorName,
        })),
      }));

    list.sort((a, b) => b.recommendations.length - a.recommendations.length);

    const categoryCounts: Record<string, number> = {};
    for (const spot of list) {
      categoryCounts[spot.category] = (categoryCounts[spot.category] ?? 0) + 1;
    }

    bySlug[city.slug] = { spots: list, categoryCounts };
  }

  return { cities, bySlug };
}
