import { CreateCityForm } from "@/components/CreateCityForm";
import { CityClient } from "@/components/CityClient";
import { UnlockRoomForm } from "@/components/UnlockRoomForm";
import { getDashboardDataForRoom } from "@/lib/getDashboard";
import { findRoomBySlugInsensitive } from "@/lib/roomLookup";
import { isReservedRoomSlug } from "@/lib/reservedSlugs";
import { ROOM_ACCESS_COOKIE, verifyRoomAccessToken } from "@/lib/roomToken";
import { t } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n.server";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
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
  const room = await findRoomBySlugInsensitive(slug, { id: true, name: true, slug: true, publicRead: true });
  if (!room) {
    return { title: "Saknas" };
  }
  const label = room.name?.trim() || room.slug;
  const jar = await cookies();
  const token = jar.get(ROOM_ACCESS_COOKIE)?.value;
  const claims = token ? verifyRoomAccessToken(token) : null;
  const guestPublic = Boolean(room.publicRead && !(claims && claims.roomId === room.id));

  return {
    title: label,
    description: SITE_DESCRIPTION,
    ...(guestPublic ? { robots: { index: false, follow: true } as const } : {}),
    openGraph: {
      title: label,
      description: SITE_DESCRIPTION,
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SITE_TITLE }],
    },
    twitter: {
      card: "summary_large_image",
      title: label,
      description: SITE_DESCRIPTION,
      images: ["/opengraph-image"],
    },
  };
}

export default async function RoomPage({ params }: { params: Promise<{ roomSlug: string }> }) {
  const locale = await getRequestLocale();
  const { roomSlug } = await params;
  const slug = roomSlug.trim();
  if (!slug || isReservedRoomSlug(slug)) notFound();

  const room = await findRoomBySlugInsensitive(slug, {
    id: true,
    slug: true,
    name: true,
    publicRead: true,
  });
  if (!room) notFound();

  const canonicalSlug = room.slug;

  const jar = await cookies();
  const token = jar.get(ROOM_ACCESS_COOKIE)?.value;
  const claims = token ? verifyRoomAccessToken(token) : null;
  const authed = Boolean(claims && claims.roomId === room.id);

  if (!authed && !room.publicRead) {
    return (
      <UnlockRoomForm
        roomSlug={canonicalSlug}
        title={room.name?.trim() || canonicalSlug}
        locale={locale}
      />
    );
  }

  const { cities, bySlug } = await getDashboardDataForRoom(room.id);

  if (!cities.length) {
    if (!authed) {
      return (
        <div className="mx-auto max-w-md px-4 py-16">
          <p className="mb-4 text-center text-sm font-bold text-indigo-900/70">
            {t(locale, "room.publicEmptyGuest")}
          </p>
          <p className="mb-6 text-center text-xs font-semibold text-indigo-900/50">
            {t(locale, "room.publicEmptyGuestHint")}
          </p>
          <UnlockRoomForm
            roomSlug={canonicalSlug}
            title={room.name?.trim() || canonicalSlug}
            locale={locale}
          />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="mb-4 text-center text-sm font-bold text-indigo-900/60">
          {t(locale, "room.city.emptyLead")}
        </p>
        <CreateCityForm roomSlug={canonicalSlug} locale={locale} />
      </div>
    );
  }

  let city = cities[0];
  const fromEnv = process.env.DEFAULT_CITY_SLUG?.trim();
  if (fromEnv) {
    const envHit = cities.find((c) => c.slug === fromEnv);
    if (envHit) city = envHit;
  }

  return (
    <CityClient
      roomSlug={canonicalSlug}
      roomTitle={room.name?.trim() || canonicalSlug}
      locale={locale}
      cities={cities}
      city={city}
      dashboard={bySlug}
      viewOnly={!authed}
      roomPublicRead={room.publicRead}
    />
  );
}
