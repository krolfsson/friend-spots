import type { DashboardBySlug, DashboardSpot } from "@/lib/dashboardTypes";
import { prisma } from "@/lib/prisma";
import { sortSpotsForDisplay } from "@/lib/sortSpots";

export async function getDashboardDataForRoom(roomId: string) {
  const cities = await prisma.city.findMany({
    where: { roomId },
    orderBy: { name: "asc" },
    include: { _count: { select: { spots: true } } },
  });

  if (!cities.length) {
    return { cities, bySlug: {} as DashboardBySlug };
  }

  const cityIds = cities.map((c) => c.id);

  const allSpots = await prisma.spot.findMany({
    where: { cityId: { in: cityIds } },
    include: {
      recommendations: { orderBy: { createdAt: "asc" } },
      _count: { select: { plusses: true } },
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
        createdAt: s.createdAt.toISOString(),
        plusCount: s._count.plusses,
        recommendations: s.recommendations.map((r) => ({
          id: r.id,
          contributorName: r.contributorName,
        })),
      }));

    list.sort(sortSpotsForDisplay);

    const categoryCounts: Record<string, number> = {};
    for (const spot of list) {
      categoryCounts[spot.category] = (categoryCounts[spot.category] ?? 0) + 1;
    }

    bySlug[city.slug] = { spots: list, categoryCounts };
  }

  return { cities, bySlug };
}
