/**
 * Tar bort alla anonym +1 (SpotPlus). Visad poäng blir 1 överallt (bas utan extra röster).
 * Kräver DATABASE_URL. Kör: npm run db:reset-plusses
 */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const r = await prisma.spotPlus.deleteMany({});
  console.log(`Removed ${r.count} SpotPlus row(s). All spots show score 1 until new +1 votes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
