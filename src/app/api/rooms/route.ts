import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { hashPin } from "@/lib/pin";
import { prisma } from "@/lib/prisma";
import { isReservedRoomSlug } from "@/lib/reservedSlugs";
import { roomWhereSlugInsensitive } from "@/lib/roomLookup";
import { ROOM_ACCESS_COOKIE, roomAccessCookieOptions, signRoomAccessToken } from "@/lib/roomToken";
import { slugify } from "@/lib/slug";

function pickBaseSlug(body: { slug?: string; name?: string }): string {
  const fromSlug = body.slug?.trim() ? slugify(body.slug) : "";
  if (fromSlug) return fromSlug;
  const fromName = body.name?.trim() ? slugify(body.name) : "";
  if (fromName) return fromName;
  return `karta-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      name?: string;
      slug?: string;
      pin?: string;
      pinConfirm?: string;
    };

    const pin = body.pin?.trim() ?? "";
    const pinConfirm = body.pinConfirm?.trim() ?? "";

    if (pin.length < 4 || pin.length > 128) {
      return NextResponse.json({ error: "Pinkod måste vara minst 4 tecken" }, { status: 400 });
    }
    if (pin !== pinConfirm) {
      return NextResponse.json({ error: "Pinkoderna matchar inte" }, { status: 400 });
    }

    let candidate = pickBaseSlug(body);
    if (isReservedRoomSlug(candidate)) {
      candidate = `${candidate}-rum`;
    }

    let slug = candidate;
    for (let i = 0; i < 12; i++) {
      const taken = await prisma.room.findFirst({
        where: roomWhereSlugInsensitive(slug),
        select: { id: true },
      });
      if (!taken) break;
      slug = `${candidate}-${Math.random().toString(36).slice(2, 5)}`;
    }

    const name = body.name?.trim() || null;
    const room = await prisma.room.create({
      data: {
        slug,
        pinHash: hashPin(pin),
        name,
      },
    });

    const token = signRoomAccessToken(room.id, room.slug);
    const res = NextResponse.json({ slug: room.slug, name: room.name });
    res.cookies.set(ROOM_ACCESS_COOKIE, token, roomAccessCookieOptions());
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Okänt fel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
