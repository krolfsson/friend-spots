import { CreateRoomLandingForm } from "@/components/CreateRoomLandingForm";
import { MapsEverCounter } from "@/components/MapsEverCounter";
import { getTotalRoomsCount } from "@/lib/mapStats";
import { SITE_DESCRIPTION } from "@/lib/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skapa karta",
  description: SITE_DESCRIPTION,
};

export default async function Home() {
  const totalMaps = await getTotalRoomsCount();

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <MapsEverCounter total={totalMaps} />
      <div className="y2k-panel rounded-[1.75rem] p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-extrabold tracking-tight text-indigo-950">Skapa ny karta</h1>
        <p className="mb-6 text-sm font-semibold text-indigo-900/60">
          Välj en pinkod. Den behövs när någon öppnar kartan i en ny webbläsare. Inloggningen sparas som kaka i
          upp till 90 dagar.
        </p>
        <CreateRoomLandingForm />
      </div>
    </div>
  );
}
