import { notFound } from "next/navigation";
import { CityClient } from "@/components/CityClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CityPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = await prisma.city.findUnique({ where: { slug } });
  if (!city) notFound();

  return <CityClient city={city} />;
}
