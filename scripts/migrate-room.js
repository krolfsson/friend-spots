/**
 * Migrerar alla tips + städer från källkarta till målkarta.
 * Om en stad med samma slug redan finns i målet slås spots ihop dit.
 * Dubbletter (samma googlePlaceId) hanteras: rekommendationer slås ihop, dubbletterna tas bort.
 * Kör: node scripts/migrate-room.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SOURCE_SLUG = "rolfsson";
const TARGET_SLUG = "master-mapsie";

async function mergeCity(sourceCity, targetCity) {
  const sourceSpots = await prisma.spot.findMany({
    where: { cityId: sourceCity.id },
    include: {
      recommendations: true,
      _count: { select: { plusses: true } },
    },
  });

  let moved = 0;
  let merged = 0;
  let skipped = 0;

  for (const spot of sourceSpots) {
    // Kolla om ett spot med samma googlePlaceId redan finns i målstaden
    const existing = spot.googlePlaceId
      ? await prisma.spot.findUnique({
          where: { cityId_googlePlaceId: { cityId: targetCity.id, googlePlaceId: spot.googlePlaceId } },
        })
      : null;

    if (existing) {
      // Flytta rekommendationer till det befintliga spottet
      if (spot.recommendations.length > 0) {
        await prisma.recommendation.updateMany({
          where: { spotId: spot.id },
          data: { spotId: existing.id },
        });
      }
      // Ta bort plussar och sedan spottet (plussar på dubblett-spottet ignoreras)
      await prisma.spotPlus.deleteMany({ where: { spotId: spot.id } });
      await prisma.spot.delete({ where: { id: spot.id } });
      merged++;
    } else {
      // Inget dubblett — flytta spottet
      await prisma.spot.update({
        where: { id: spot.id },
        data: { cityId: targetCity.id },
      });
      moved++;
    }
  }

  console.log(
    `  "${sourceCity.name}": ${moved} spots flyttade, ${merged} dubbletter sammanslagna, ${skipped} ignorerade`,
  );

  // Ta bort den nu tomma källstaden
  await prisma.city.delete({ where: { id: sourceCity.id } });
}

async function main() {
  const [source, target] = await Promise.all([
    prisma.room.findFirst({
      where: { slug: SOURCE_SLUG },
      include: { cities: { include: { _count: { select: { spots: true } } } } },
    }),
    prisma.room.findFirst({
      where: { slug: TARGET_SLUG },
      include: { cities: true },
    }),
  ]);

  if (!source) throw new Error(`Källkarta "${SOURCE_SLUG}" hittades inte`);
  if (!target) throw new Error(`Målkarta "${TARGET_SLUG}" hittades inte`);

  console.log(`\nKälla: ${source.slug} (${source.cities.length} städer)`);
  console.log(`Mål:   ${target.slug} (${target.cities.length} städer)\n`);

  const targetCityBySlug = Object.fromEntries(target.cities.map((c) => [c.slug, c]));

  for (const sourceCity of source.cities) {
    const existing = targetCityBySlug[sourceCity.slug];

    if (existing) {
      console.log(`Stad "${sourceCity.name}" finns redan i ${TARGET_SLUG} — slår ihop spots:`);
      await mergeCity(sourceCity, existing);
    } else {
      // Stad finns inte i målet — flytta hela staden direkt
      await prisma.city.update({
        where: { id: sourceCity.id },
        data: { roomId: target.id },
      });
      console.log(
        `Stad "${sourceCity.name}" (${sourceCity.slug}): ${sourceCity._count.spots} spots → ${TARGET_SLUG}`,
      );
    }
  }

  // Ta bort källkartan om den är tom
  const remaining = await prisma.city.count({ where: { roomId: source.id } });
  if (remaining === 0) {
    await prisma.room.delete({ where: { id: source.id } });
    console.log(`\nKällkartan "${SOURCE_SLUG}" borttagen.`);
  } else {
    console.log(`\nOBS: ${remaining} städer kvar i källkartan.`);
  }

  // Sammanfattning
  const finalCities = await prisma.city.findMany({
    where: { roomId: target.id },
    include: { _count: { select: { spots: true } } },
    orderBy: { name: "asc" },
  });
  const totalSpots = finalCities.reduce((s, c) => s + c._count.spots, 0);
  console.log(`\n✓ ${TARGET_SLUG} innehåller nu ${finalCities.length} städer och ${totalSpots} tips:`);
  for (const c of finalCities) {
    console.log(`  ${c.emoji ?? "📍"} ${c.name} — ${c._count.spots} tips`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
