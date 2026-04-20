import { CreateRoomLandingForm } from "@/components/CreateRoomLandingForm";
import { EmojiCollageBackground } from "@/components/EmojiCollageBackground";
import { OpenExistingRoomForm } from "@/components/OpenExistingRoomForm";
import { SITE_DESCRIPTION } from "@/lib/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skapa karta",
  description: SITE_DESCRIPTION,
};

export default function Home() {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-6 sm:py-12">
      <EmojiCollageBackground />
      <div className="relative z-10 space-y-3 sm:space-y-4">
        <div className="flex justify-center pb-1">
          <div
            className="select-none bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 bg-clip-text text-[30px] font-extrabold leading-none tracking-tight text-transparent drop-shadow-[0_10px_30px_rgba(236,72,153,0.20)] sm:text-[36px]"
            style={{
              fontFamily: "var(--font-logo), var(--font-y2k), system-ui, sans-serif",
              WebkitTextStroke: "0.6px rgba(255,255,255,0.35)",
            }}
          >
            RecsMaps
          </div>
        </div>

        <div className="y2k-panel rounded-[1.75rem] p-5 sm:p-8">
          <h1 className="mb-1 text-xl font-extrabold tracking-tight text-indigo-950">
            Skapa en karta med kompisgänget
          </h1>
          <p className="mb-4 text-sm font-semibold text-indigo-900/60 sm:mb-6">
            Skapa en länk, dela den i gruppchatten och fyll kartan med era favoritplatser och tips. Välj en pinkod
            så att nya webbläsare kan låsa upp kartan (inloggningen sparas som kaka i upp till 90 dagar).
          </p>
          <CreateRoomLandingForm />
        </div>

        <div className="y2k-panel rounded-[1.75rem] p-5 sm:p-8">
          <OpenExistingRoomForm />
        </div>
      </div>
    </div>
  );
}
