import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

/**
 * Slug-match oavsett skiftläge (t.ex. /alla-mina-kompisars-tips mot DB "Alla-Mina-Kompisars-Tips").
 * Använder LOWER i SQL och React cache() för att deduplicera anrop inom samma request
 * (generateMetadata + page body anropar båda denna — sparar 2 DB round-trips per sidladdning).
 */
const findRoomIdBySlugInsensitiveCached = cache(async (slug: string): Promise<string | null> => {
  const trimmed = slug.trim();
  if (!trimmed) return null;
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Room" WHERE LOWER(TRIM("slug")) = LOWER(TRIM(${trimmed}))
    LIMIT 1
  `;
  return rows[0]?.id ?? null;
});

export async function findRoomIdBySlugInsensitive(slug: string): Promise<string | null> {
  return findRoomIdBySlugInsensitiveCached(slug);
}

export async function findRoomBySlugInsensitive<T extends Prisma.RoomSelect>(
  slug: string,
  select: T,
): Promise<Prisma.RoomGetPayload<{ select: T }> | null> {
  const id = await findRoomIdBySlugInsensitiveCached(slug);
  if (!id) return null;
  return prisma.room.findUnique({ where: { id }, select });
}
