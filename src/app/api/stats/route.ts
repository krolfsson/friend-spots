import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 300;

export async function GET() {
  try {
    const totalSpots = await prisma.spot.count();
    return NextResponse.json(
      { totalSpots },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
        },
      },
    );
  } catch {
    return NextResponse.json({ totalSpots: 0 });
  }
}
