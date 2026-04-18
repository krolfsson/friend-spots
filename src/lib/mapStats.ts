import { prisma } from "@/lib/prisma";

export async function getTotalRoomsCount(): Promise<number> {
  return prisma.room.count();
}
