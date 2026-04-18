import { CityClient } from "@/components/CityClient";
import { CreateCityForm } from "@/components/CreateCityForm";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Search = { city?: string | string[] };

function firstSlug(q: string | string[] | undefined) {
  if (!q) return undefined;
  return typeof q === "string" ? q : q[0];
}

export default async function Home({ searchParams }: { searchParams: Promise<Search> }) {
  const cities = await prisma.city.findMany({ orderBy: { name: "asc" } });

  if (!cities.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <CreateCityForm />
      </div>
    );
  }

  const sp = await searchParams;
  const requested = firstSlug(sp.city)?.trim();

  let city = cities[0];
  if (requested) {
    const hit = cities.find((c) => c.slug === requested);
    if (hit) city = hit;
  } else {
    const fromEnv = process.env.DEFAULT_CITY_SLUG?.trim();
    if (fromEnv) {
      const envHit = cities.find((c) => c.slug === fromEnv);
      if (envHit) city = envHit;
    }
  }

  return <CityClient cities={cities} city={city} />;
}
