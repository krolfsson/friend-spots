import { prisma } from '../src/lib/prisma.js';

const slugs = ['map-of-all-maps', 'rolfsson2', 'rolfsson2-eu8', 'hej'];

const rooms = await prisma.room.findMany({
  where: { slug: { in: slugs } },
  select: { id: true, slug: true, name: true },
});

console.log('Hittade dessa rum:', JSON.stringify(rooms, null, 2));
await prisma.$disconnect();
