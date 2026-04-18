import { CityClient } from "@/components/CityClient";
import { CreateCityForm } from "@/components/CreateCityForm";
import { getDashboardData } from "@/lib/getDashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { cities, bySlug } = await getDashboardData();

  if (!cities.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <CreateCityForm />
      </div>
    );
  }

  let city = cities[0];
  const fromEnv = process.env.DEFAULT_CITY_SLUG?.trim();
  if (fromEnv) {
    const envHit = cities.find((c) => c.slug === fromEnv);
    if (envHit) city = envHit;
  }

  return <CityClient cities={cities} city={city} dashboard={bySlug} />;
}
