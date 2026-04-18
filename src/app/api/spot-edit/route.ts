import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isCategoryId } from "@/lib/categories";
import { prisma } from "@/lib/prisma";
import { getAuthorizedRoomFromRequest } from "@/lib/roomAuth";

/** POST (i stället för PATCH) så uppdatering fungerar även där PATCH blockas. */
export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthorizedRoomFromRequest(req);
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      spotId?: string;
      name?: string;
      category?: string;
      emoji?: string | null;
      neighborhood?: string | null;
    };

    const spotId = body.spotId?.trim();
    if (!spotId) {
      return NextResponse.json({ error: "spotId saknas" }, { status: 400 });
    }

    const existing = await prisma.spot.findFirst({
      where: { id: spotId, city: { roomId: auth.room.id } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Tipset finns inte" }, { status: 404 });
    }

    const data: {
      name?: string;
      category?: string;
      emoji?: string | null;
      neighborhood?: string | null;
    } = {};

    if (body.name !== undefined) {
      const n = body.name.trim();
      if (!n) {
        return NextResponse.json({ error: "Namn får inte vara tomt" }, { status: 400 });
      }
      data.name = n;
    }

    if (body.category !== undefined) {
      if (!isCategoryId(body.category)) {
        return NextResponse.json({ error: "Ogiltig kategori" }, { status: 400 });
      }
      data.category = body.category;
    }

    if (body.emoji !== undefined) {
      data.emoji =
        typeof body.emoji === "string" && body.emoji.trim()
          ? body.emoji.trim().slice(0, 8)
          : null;
    }

    if (body.neighborhood !== undefined) {
      const nb = body.neighborhood;
      data.neighborhood =
        typeof nb === "string" && nb.trim() ? nb.trim().slice(0, 120) : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Inget att uppdatera" }, { status: 400 });
    }

    const spot = await prisma.spot.update({
      where: { id: spotId },
      data,
      include: { recommendations: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json({ spot });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Okänt fel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
