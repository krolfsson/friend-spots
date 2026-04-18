import { CityClient } from "@/components/CityClient";
import { CreateCityForm } from "@/components/CreateCityForm";
import { getHomeCity } from "@/lib/homeCity";

export const dynamic = "force-dynamic";

export default async function Home() {
  const city = await getHomeCity();

  if (!city) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <CreateCityForm />
      </div>
    );
  }

  return <CityClient city={city} />;
}
