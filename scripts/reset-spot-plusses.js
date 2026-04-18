/**
 * Removes all anonymous +1 votes (SpotPlus). Displayed score becomes 1 everywhere.
 * Requires DATABASE_URL. Run: npm run db:reset-plusses
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
