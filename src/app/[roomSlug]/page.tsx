import { CreateCityForm } from "@/components/CreateCityForm";
import { CityClient } from "@/components/CityClient";
import { UnlockRoomForm } from "@/components/UnlockRoomForm";
import { getDashboardDataForRoom } from "@/lib/getDashboard";
import { prisma } from "@/lib/prisma";
import { isReservedRoomSlug } from "@/lib/reservedSlugs";
import { ROOM_ACCESS_COOKIE, verifyRoomAccessToken } from "@/lib/roomToken";
import { SITE_DESCRIPTION } from "@/lib/site";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomSlug: string }>;
}): Promise<Metadata> {
  const { roomSlug } = await params;
  const slug = roomSlug.trim();
  if (!slug || isReservedRoomSlug(slug)) {
    return { title: "Saknas" };
  }
  const room = await prisma.room.findUnique({
    where: { slug },
    select: { name: true, slug: true },
  });
  if (!room) {
    return { title: "Saknas" };
  }
  const label = room.name?.trim() || room.slug;
  return {
    title: label,
    description: SITE_DESCRIPTION,
  };
}

export default async function RoomPage({ params }: { params: Promise<{ roomSlug: string }> }) {
  const { roomSlug } = await params;
  const slug = roomSlug.trim();
  if (!slug || isReservedRoomSlug(slug)) notFound();

  const room = await prisma.room.findUnique({
    where: { slug },
    select: { id: true, slug: true, name: true },
  });
  if (!room) notFound();

  const jar = await cookies();
  const token = jar.get(ROOM_ACCESS_COOKIE)?.value;
  const claims = token ? verifyRoomAccessToken(token) : null;
  const authed = Boolean(claims && claims.roomId === room.id);

  if (!authed) {
    return <UnlockRoomForm roomSlug={slug} title={room.name?.trim() || slug} />;
  }

  const { cities, bySlug } = await getDashboardDataForRoom(room.id);

  if (!cities.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="mb-4 text-center text-sm font-bold text-indigo-900/60">
          Inga städer i den här kartan än — skapa den första.
        </p>
        <CreateCityForm roomSlug={slug} />
      </div>
    );
  }

  let city = cities[0];
  const fromEnv = process.env.DEFAULT_CITY_SLUG?.trim();
  if (fromEnv) {
    const envHit = cities.find((c) => c.slug === fromEnv);
    if (envHit) city = envHit;
  }

  return <CityClient roomSlug={slug} cities={cities} city={city} dashboard={bySlug} />;
}
