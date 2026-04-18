import { CreateRoomLandingForm } from "@/components/CreateRoomLandingForm";
import { SITE_DESCRIPTION } from "@/lib/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skapa karta",
  description: SITE_DESCRIPTION,
};

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <div className="y2k-panel rounded-[1.75rem] p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-extrabold tracking-tight text-indigo-950">Skapa ny karta</h1>
        <p className="mb-6 text-sm font-semibold text-indigo-900/60">
          VÃ¤lj en pinkod. Den behÃ¶vs nÃ¤r nÃ¥gon Ã¶ppnar kartan i en ny webblÃ¤sare. Inloggningen sparas som kaka i
          upp till 90 dagar.
        </p>
        <CreateRoomLandingForm />
      </div>
    </div>
  );
}
