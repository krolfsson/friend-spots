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

/** Produktion kan sakna migrerad kolumn tills `migrate deploy` körts — undvik total krasch. */
function isMissingPublicReadColumnError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  if (!/publicRead/i.test(msg)) return false;
  return /does not exist|Unknown column|42703|column.*not found|not available/i.test(msg);
}

export async function findRoomBySlugInsensitive<T extends Prisma.RoomSelect>(
  slug: string,
  select: T,
): Promise<Prisma.RoomGetPayload<{ select: T }> | null> {
  const id = await findRoomIdBySlugInsensitiveCached(slug);
  if (!id) return null;
  try {
    return await prisma.room.findUnique({ where: { id }, select });
  } catch (e) {
    if (!isMissingPublicReadColumnError(e)) throw e;
    const sel = select as Record<string, unknown>;
    if (!("publicRead" in sel)) throw e;
    const { publicRead: _ignored, ...withoutPublicRead } = sel;
    const row = await prisma.room.findUnique({
      where: { id },
      select: withoutPublicRead as unknown as T,
    });
    if (!row) return null;
    return { ...row, publicRead: false } as Prisma.RoomGetPayload<{ select: T }>;
  }
}
