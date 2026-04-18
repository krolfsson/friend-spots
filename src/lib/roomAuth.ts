import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { roomWhereSlugInsensitive } from "@/lib/roomLookup";
import { verifyRoomAccessToken } from "@/lib/roomToken";

export type AuthorizedRoom = { id: string; slug: string; name: string | null };

export async function getAuthorizedRoomFromRequest(
  req: NextRequest,
): Promise<{ ok: true; room: AuthorizedRoom } | { ok: false; response: NextResponse }> {
  const slug = req.headers.get("x-room-slug")?.trim();
  if (!slug) {
    return {
      ok: false,
      response: NextResponse.json({ error: "X-Room-Slug saknas" }, { status: 400 }),
    };
  }

  const token = req.cookies.get("fs_room")?.value;
  const claims = token ? verifyRoomAccessToken(token) : null;
  if (!claims) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Pinkod krävs" }, { status: 401 }),
    };
  }

  const room = await prisma.room.findFirst({
    where: roomWhereSlugInsensitive(slug),
    select: { id: true, slug: true, name: true },
  });

  if (!room || room.id !== claims.roomId) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Rum hittades inte" }, { status: 404 }),
    };
  }

  return { ok: true, room };
}
