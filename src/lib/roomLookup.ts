import type { Prisma } from "@prisma/client";

/** Postgres: match room URL case-insensitively (e.g. /rolfsson vs DB slug). */
export function roomWhereSlugInsensitive(slug: string): Prisma.RoomWhereInput {
  return {
    slug: { equals: slug.trim(), mode: "insensitive" },
  };
}
