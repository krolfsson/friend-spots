import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthorizedRoomFromRequest } from "@/lib/roomAuth";
import { getRequestClientIp, isValidVoterToken, makeVoterKey } from "@/lib/voterKey";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthorizedRoomFromRequest(req);
    if (!auth.ok) return auth.response;

    const token = req.headers.get("x-voter-token");
    if (!isValidVoterToken(token)) {
      return NextResponse.json(
        { error: "Missing or invalid X-Voter-Token" },
        { status: 400 },
      );
    }

    const body = (await req.json()) as { spotId?: string };
    const spotId = body.spotId?.trim();
    if (!spotId) {
      return NextResponse.json({ error: "spotId missing" }, { status: 400 });
    }

    const spot = await prisma.spot.findFirst({
      where: { id: spotId, city: { roomId: auth.room.id } },
      select: { id: true },
    });
    if (!spot) {
      return NextResponse.json({ error: "Spot not found" }, { status: 404 });
    }

    const voterKey = makeVoterKey(token, getRequestClientIp(req));

    try {
      await prisma.spotPlus.create({
        data: { spotId: spot.id, voterKey },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const plusCount = await prisma.spotPlus.count({ where: { spotId: spot.id } });
        return NextResponse.json({
          ok: true,
          added: false,
          plusCount,
          viewerHasPlussed: true,
        });
      }
      throw e;
    }

    const plusCount = await prisma.spotPlus.count({ where: { spotId: spot.id } });
    return NextResponse.json({
      ok: true,
      added: true,
      plusCount,
      viewerHasPlussed: true,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
