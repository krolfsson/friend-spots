import { prisma } from "@/lib/prisma";

export async function getHomeCity() {
  const fromEnv = process.env.DEFAULT_CITY_SLUG?.trim();
  if (fromEnv) {
    const city = await prisma.city.findUnique({ where: { slug: fromEnv } });
    if (city) return city;
  }

  return prisma.city.findFirst({ orderBy: { createdAt: "asc" } });
}
