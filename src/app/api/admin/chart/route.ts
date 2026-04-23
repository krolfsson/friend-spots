import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Row = { date: string; maps: number; cities: number; spots: number; plusses: number };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = Math.min(365, Math.max(1, Number(searchParams.get("days") ?? 30)));

  const since = new Date();
  since.setDate(since.getDate() - days + 1);
  since.setHours(0, 0, 0, 0);

  const [rooms, cities, spots, plusses] = await Promise.all([
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day, COUNT(*) AS count
      FROM "Room" WHERE "createdAt" >= ${since}
      GROUP BY day ORDER BY day`,
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day, COUNT(*) AS count
      FROM "City" WHERE "createdAt" >= ${since}
      GROUP BY day ORDER BY day`,
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day, COUNT(*) AS count
      FROM "Spot" WHERE "createdAt" >= ${since}
      GROUP BY day ORDER BY day`,
    prisma.$queryRaw<{ day: Date; count: bigint }[]>`
      SELECT date_trunc('day', "createdAt" AT TIME ZONE 'UTC') AS day, COUNT(*) AS count
      FROM "SpotPlus" WHERE "createdAt" >= ${since}
      GROUP BY day ORDER BY day`,
  ]);

  // Build a date-indexed map for all N days
  const map: Record<string, Row> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    map[key] = { date: key, maps: 0, cities: 0, spots: 0, plusses: 0 };
  }

  for (const r of rooms)   { const k = new Date(r.day).toISOString().slice(0, 10); if (map[k]) map[k].maps    = Number(r.count); }
  for (const r of cities)  { const k = new Date(r.day).toISOString().slice(0, 10); if (map[k]) map[k].cities  = Number(r.count); }
  for (const r of spots)   { const k = new Date(r.day).toISOString().slice(0, 10); if (map[k]) map[k].spots   = Number(r.count); }
  for (const r of plusses) { const k = new Date(r.day).toISOString().slice(0, 10); if (map[k]) map[k].plusses = Number(r.count); }

  return NextResponse.json(Object.values(map));
}
