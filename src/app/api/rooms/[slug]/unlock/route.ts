import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyPin } from "@/lib/pin";
import { prisma } from "@/lib/prisma";
import { ROOM_ACCESS_COOKIE, roomAccessCookieOptions, signRoomAccessToken } from "@/lib/roomToken";

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug: rawSlug } = await ctx.params;
    const slug = rawSlug?.trim();
    if (!slug) {
      return NextResponse.json({ error: "Slug saknas" }, { status: 400 });
    }

    const body = (await req.json()) as { pin?: string };
    const pin = body.pin?.trim() ?? "";
    if (!pin) {
      return NextResponse.json({ error: "Pinkod saknas" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: { slug },
      select: { id: true, slug: true, pinHash: true },
    });
    if (!room) {
      return NextResponse.json({ error: "Kartan hittades inte" }, { status: 404 });
    }

    if (!verifyPin(pin, room.pinHash)) {
      return NextResponse.json({ error: "Fel pinkod" }, { status: 401 });
    }

    const token = signRoomAccessToken(room.id, room.slug);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ROOM_ACCESS_COOKIE, token, roomAccessCookieOptions());
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Okänt fel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
