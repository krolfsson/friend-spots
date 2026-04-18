import { NextResponse } from "next/server";
import { isCategoryId } from "@/lib/categories";
import { fetchPlaceEssentials } from "@/lib/google/placesServer";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const citySlug = searchParams.get("citySlug");
  const category = searchParams.get("category") ?? "alla";
  const neighborhood = searchParams.get("neighborhood") ?? "alla";

  if (!citySlug) {
    return NextResponse.json({ error: "citySlug saknas" }, { status: 400 });
  }

  const city = await prisma.city.findUnique({ where: { slug: citySlug } });
  if (!city) {
    return NextResponse.json({ error: "Staden finns inte" }, { status: 404 });
  }

  const baseWhere = {
    cityId: city.id,
    ...(category !== "alla" && isCategoryId(category) ? { category } : {}),
  };

  const spotsForNeighborhoods = await prisma.spot.findMany({
    where: baseWhere,
    select: { neighborhood: true },
  });

  const neighborhoods = Array.from(
    new Set(
      spotsForNeighborhoods
        .map((s) => s.neighborhood)
        .filter((n): n is string => Boolean(n && n.trim())),
    ),
  ).sort((a, b) => a.localeCompare(b, "sv"));

  const spots = await prisma.spot.findMany({
    where: {
      ...baseWhere,
      ...(neighborhood !== "alla"
        ? neighborhood === "ovrigt"
          ? { OR: [{ neighborhood: null }, { neighborhood: "" }] }
          : { neighborhood }
        : {}),
    },
    include: { recommendations: { orderBy: { createdAt: "asc" } } },
  });

  spots.sort((a, b) => b.recommendations.length - a.recommendations.length);

  const categoryStats = await prisma.spot.groupBy({
    by: ["category"],
    where: { cityId: city.id },
    _count: { _all: true },
  });

  const categoryCounts = Object.fromEntries(
    categoryStats.map((c) => [c.category, c._count._all]),
  ) as Record<string, number>;

  return NextResponse.json({ city, spots, neighborhoods, categoryCounts });
}

export async function POST(req: Request) {
  try {
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

    const city = await prisma.city.findUnique({ where: { slug: citySlug } });
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

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const spotId = searchParams.get("spotId")?.trim();
  if (!spotId) {
    return NextResponse.json({ error: "spotId saknas" }, { status: 400 });
  }

  const result = await prisma.spot.deleteMany({ where: { id: spotId } });
  if (result.count === 0) {
    return NextResponse.json({ error: "Tipset finns inte" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
