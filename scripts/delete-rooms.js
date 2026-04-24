/**
 * Tar bort specificerade kartor och allt kopplat innehåll (städer, spots, plussar, rekommendationer).
 * Kör: node scripts/delete-rooms.js
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const SLUGS_TO_DELETE = ["map-of-all-maps", "rolfsson2", "rolfsson2-eu8", "hej"];

async function main() {
  const rooms = await prisma.room.findMany({
    where: { slug: { in: SLUGS_TO_DELETE } },
    select: { id: true, slug: true, name: true },
  });

  if (!rooms.length) {
    console.log("Inga rum hittades med dessa slug:ar.");
    return;
  }

  console.log("Hittade rum att ta bort:");
  for (const r of rooms) {
    console.log(`  - ${r.slug} (id: ${r.id}, namn: ${r.name ?? "(inget)"}) `);
  }

  const roomIds = rooms.map((r) => r.id);

  // Hämta stads-IDs för dessa rum
  const cities = await prisma.city.findMany({
    where: { roomId: { in: roomIds } },
    select: { id: true },
  });
  const cityIds = cities.map((c) => c.id);

  // Hämta spot-IDs för dessa städer
  const spots = await prisma.spot.findMany({
    where: { cityId: { in: cityIds } },
    select: { id: true },
  });
  const spotIds = spots.map((s) => s.id);

  console.log(`\nTar bort: ${spots.length} spots, ${cities.length} städer, ${rooms.length} kartor…`);

  // Ta bort i rätt ordning (djupast beroende först)
  if (spotIds.length) {
    await prisma.spotPlus.deleteMany({ where: { spotId: { in: spotIds } } });
    await prisma.recommendation.deleteMany({ where: { spotId: { in: spotIds } } });
    await prisma.spot.deleteMany({ where: { id: { in: spotIds } } });
  }
  if (cityIds.length) {
    await prisma.city.deleteMany({ where: { id: { in: cityIds } } });
  }
  await prisma.room.deleteMany({ where: { id: { in: roomIds } } });

  console.log("Klart! Alla angivna kartor är borttagna.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
