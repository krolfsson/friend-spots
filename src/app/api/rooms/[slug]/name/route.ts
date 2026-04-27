import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { findRoomBySlugInsensitive } from "@/lib/roomLookup";
import { ROOM_ACCESS_COOKIE, verifyRoomAccessToken } from "@/lib/roomToken";
import { isReservedRoomSlug } from "@/lib/reservedSlugs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: rawSlug } = await ctx.params;
    const slug = rawSlug?.trim();
    if (!slug || isReservedRoomSlug(slug)) {
      return NextResponse.json({ error: "Ogiltig adress" }, { status: 400 });
    }

    const jar = await cookies();
    const token = jar.get(ROOM_ACCESS_COOKIE)?.value;
    const claims = token ? verifyRoomAccessToken(token) : null;
    if (!claims) {
      return NextResponse.json({ error: "Inte inloggad" }, { status: 401 });
    }

    const room = await findRoomBySlugInsensitive(slug, { id: true, slug: true });
    if (!room) {
      return NextResponse.json({ error: "Kartan hittades inte" }, { status: 404 });
    }
    if (room.id !== claims.roomId) {
      return NextResponse.json({ error: "Inte behörig" }, { status: 403 });
    }

    const body = (await req.json()) as { name?: string | null; publicRead?: boolean };
    const data: { name?: string | null; publicRead?: boolean } = {};

    if (body.name !== undefined) {
      const nameRaw = typeof body.name === "string" ? body.name.trim() : "";
      data.name = nameRaw ? nameRaw.slice(0, 60) : null;
    }
    if (typeof body.publicRead === "boolean") {
      data.publicRead = body.publicRead;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Inget att uppdatera" }, { status: 400 });
    }

    const updated = await prisma.room.update({
      where: { id: room.id },
      data,
      select: { name: true, publicRead: true },
    });

    return NextResponse.json({ ok: true, name: updated.name, publicRead: updated.publicRead });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Okänt fel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
