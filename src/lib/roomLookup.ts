import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Slug-match oavsett skiftläge (t.ex. /alla-mina-kompisars-tips mot DB "Alla-Mina-Kompisars-Tips").
 * Använder LOWER i SQL så det fungerar konsekvent mot Postgres (även om Prisma-filter skulle strula).
 */
export async function findRoomIdBySlugInsensitive(slug: string): Promise<string | null> {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Room" WHERE LOWER(TRIM("slug")) = LOWER(TRIM(${trimmed}))
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

export async function findRoomBySlugInsensitive<T extends Prisma.RoomSelect>(
  slug: string,
  select: T,
): Promise<Prisma.RoomGetPayload<{ select: T }> | null> {
  const id = await findRoomIdBySlugInsensitive(slug);
  if (!id) return null;
  return prisma.room.findUnique({ where: { id }, select });
}
