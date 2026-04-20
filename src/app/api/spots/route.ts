import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isCategoryId } from "@/lib/categories";
import type { DashboardSpot } from "@/lib/dashboardTypes";
import { fetchPlaceEssentials } from "@/lib/google/placesServer";
import { prisma } from "@/lib/prisma";
import { getAuthorizedRoomFromRequest } from "@/lib/roomAuth";
import { sortSpotsForDisplay } from "@/lib/sortSpots";
import { getRequestClientIp, isValidVoterToken, makeVoterKey } from "@/lib/voterKey";

function toDashboardSpot(
  s: {
    id: string;
    createdAt: Date;
    googlePlaceId: string;
    name: string;
    neighborhood: string | null;
    category: string;
    emoji: string | null;
    lat: number | null;
    lng: number | null;
    recommendations: { id: string; contributorName: string }[];
    _count: { plusses: number };
  },
  viewerHasPlussed?: boolean,
): DashboardSpot {
  return {
    id: s.id,
    googlePlaceId: s.googlePlaceId,
    name: s.name,
    neighborhood: s.neighborhood,
    category: s.category,
    emoji: s.emoji,
    lat: s.lat,
    lng: s.lng,
    createdAt: s.createdAt.toISOString(),
    plusCount: s._count.plusses,
    ...(viewerHasPlussed !== undefined ? { viewerHasPlussed } : {}),
    recommendations: s.recommendations.map((r) => ({
      id: r.id,
      contributorName: r.contributorName,
    })),
  };
}

export async function GET(req: NextRequest) {
  const auth = await getAuthorizedRoomFromRequest(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const citySlug = searchParams.get("citySlug");
  const category = searchParams.get("category") ?? "alla";
  const neighborhood = searchParams.get("neighborhood") ?? "alla";

  if (!citySlug) {
    return NextResponse.json({ error: "citySlug saknas" }, { status: 400 });
  }

  const city = await prisma.city.findUnique({
    where: { roomId_slug: { roomId: auth.room.id, slug: citySlug } },
  });
  if (!city) {
    return NextResponse.json({ error: "Staden finns inte" }, { status: 404 });
  }

  const baseWhere = {
    cityId: city.id,
    ...(category !== "alla" && isCategoryId(category) ? { category } : {}),
  };

  const spotWhere =
    neighborhood !== "alla"
      ? neighborhood === "ovrigt"
        ? { ...baseWhere, OR: [{ neighborhood: null }, { neighborhood: "" }] }
        : { ...baseWhere, neighborhood }
      : baseWhere;

  const [spotsForNeighborhoods, spots, categoryStats] = await Promise.all([
    prisma.spot.findMany({
      where: baseWhere,
      select: { neighborhood: true },
    }),
    prisma.spot.findMany({
      where: spotWhere,
      include: {
        recommendations: { orderBy: { createdAt: "asc" } },
        _count: { select: { plusses: true } },
      },
    }),
    prisma.spot.groupBy({
      by: ["category"],
      where: { cityId: city.id },
      _count: { _all: true },
    }),
  ]);

  const neighborhoods = Array.from(
    new Set(
      spotsForNeighborhoods
        .map((s) => s.neighborhood)
        .filter((n): n is string => Boolean(n && n.trim())),
    ),
  ).sort((a, b) => a.localeCompare(b, "sv"));

  const voterHeader = req.headers.get("x-voter-token");
  const voterKey =
    isValidVoterToken(voterHeader) ? makeVoterKey(voterHeader, getRequestClientIp(req)) : null;

  let plussedSet: Set<string> | null = null;
  if (voterKey && spots.length) {
    const rows = await prisma.spotPlus.findMany({
      where: {
        voterKey,
        spotId: { in: spots.map((s) => s.id) },
      },
      select: { spotId: true },
    });
    plussedSet = new Set(rows.map((r) => r.spotId));
  }

  const mapped: DashboardSpot[] = spots.map((s) =>
    toDashboardSpot(s, plussedSet ? plussedSet.has(s.id) : undefined),
  );
  mapped.sort(sortSpotsForDisplay);

  const categoryCounts = Object.fromEntries(
    categoryStats.map((c) => [c.category, c._count._all]),
  ) as Record<string, number>;

  return NextResponse.json({ city, spots: mapped, neighborhoods, categoryCounts });
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthorizedRoomFromRequest(req);
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      citySlug?: string;
      googlePlaceId?: string;
      displayName?: string;
      category?: string;
      emoji?: string;
      contributorName?: string;
      joinOnly?: boolean;
    };

    const citySlug = body.citySlug?.trim();
    const contributorName = body.contributorName?.trim();
    const googlePlaceId = body.googlePlaceId?.trim();

    if (!citySlug || !contributorName || !googlePlaceId) {
      return NextResponse.json(
        { error: "citySlug, googlePlaceId och contributorName krävs" },
        { status: 400 },
      );
    }

    const city = await prisma.city.findUnique({
      where: { roomId_slug: { roomId: auth.room.id, slug: citySlug } },
    });
    if (!city) {
      return NextResponse.json({ error: "Staden finns inte" }, { status: 404 });
    }

    const normalizedPlaceId = googlePlaceId.replace(/^places\//, "");

    if (body.joinOnly) {
      const existing = await prisma.spot.findUnique({
        where: {
          cityId_googlePlaceId: {
            cityId: city.id,
            googlePlaceId: normalizedPlaceId,
          },
        },
        include: { recommendations: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Tipset finns inte ännu" }, { status: 404 });
      }

      const already = existing.recommendations.some(
        (r) => r.contributorName.toLowerCase() === contributorName.toLowerCase(),
      );
      if (already) {
        return NextResponse.json({ spot: existing, joined: false });
      }

      await prisma.recommendation.create({
        data: {
          spotId: existing.id,
          contributorName,
        },
      });

      const spot = await prisma.spot.findUniqueOrThrow({
        where: { id: existing.id },
        include: { recommendations: true },
      });

      return NextResponse.json({ spot, joined: true });
    }

    const essentials = await fetchPlaceEssentials(googlePlaceId);

    const existing = await prisma.spot.findUnique({
      where: {
        cityId_googlePlaceId: {
          cityId: city.id,
          googlePlaceId: essentials.googlePlaceId,
        },
      },
      include: { recommendations: true },
    });

    if (!body.category || !isCategoryId(body.category)) {
      return NextResponse.json({ error: "Ogiltig kategori" }, { status: 400 });
    }

    const emoji = body.emoji?.trim() || null;
    const displayName = body.displayName?.trim() || essentials.shortAddress || "Okänt ställe";

    if (existing) {
      const already = existing.recommendations.some(
        (r) => r.contributorName.toLowerCase() === contributorName.toLowerCase(),
      );
      if (!already) {
        await prisma.recommendation.create({
          data: { spotId: existing.id, contributorName },
        });
      }

      const spot = await prisma.spot.findUniqueOrThrow({
        where: { id: existing.id },
        include: { recommendations: true },
      });

      return NextResponse.json({ spot, created: false });
    }

    const spot = await prisma.spot.create({
      data: {
        cityId: city.id,
        googlePlaceId: essentials.googlePlaceId,
        name: displayName,
        neighborhood: essentials.neighborhood,
        lat: essentials.lat,
        lng: essentials.lng,
        shortAddress: essentials.shortAddress,
        category: body.category,
        emoji,
        recommendations: {
          create: [{ contributorName }],
        },
      },
      include: { recommendations: true },
    });

    return NextResponse.json({ spot, created: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Okänt fel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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

export async function DELETE(req: NextRequest) {
  const auth = await getAuthorizedRoomFromRequest(req);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const spotId = searchParams.get("spotId")?.trim();
  if (!spotId) {
    return NextResponse.json({ error: "spotId saknas" }, { status: 400 });
  }

  const hit = await prisma.spot.findFirst({
    where: { id: spotId, city: { roomId: auth.room.id } },
    select: { id: true },
  });
  if (!hit) {
    return NextResponse.json({ error: "Tipset finns inte" }, { status: 404 });
  }

  await prisma.spot.delete({ where: { id: spotId } });
  return NextResponse.json({ ok: true });
}
