import { CreateRoomLandingForm } from "@/components/CreateRoomLandingForm";
import { EmojiCollageBackground } from "@/components/EmojiCollageBackground";
import { OpenExistingRoomForm } from "@/components/OpenExistingRoomForm";
import { t } from "@/lib/i18n";
import { getRequestLocale } from "@/lib/i18n.server";
import { SITE_DESCRIPTION } from "@/lib/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Skapa karta",
  description: SITE_DESCRIPTION,
};

export default async function Home() {
  const locale = await getRequestLocale();
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 pt-3 pb-6 sm:pt-6 sm:pb-12">
      <EmojiCollageBackground />
      <div className="relative z-10 space-y-3 sm:space-y-4">
        <div className="-mt-[0.2rem] flex w-full justify-center overflow-visible pb-0.5">
          <div
            className="select-none bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 bg-clip-text px-1 text-[36px] font-extrabold leading-none tracking-tight text-transparent drop-shadow-[0_12px_34px_rgba(236,72,153,0.22)] sm:text-[43px]"
            style={{
              fontFamily: "var(--font-logo), var(--font-y2k), system-ui, sans-serif",
            }}
          >
            Mapsies
          </div>
        </div>

        <div className="y2k-panel rounded-[1.75rem] p-5 sm:p-8">
          <h1 className="mb-1 text-xl font-extrabold tracking-tight text-indigo-950">
            {t(locale, "home.title")}
          </h1>
          <p className="mb-4 text-sm font-semibold text-indigo-900/60 sm:mb-6">
            {t(locale, "home.lede")}
          </p>
          <CreateRoomLandingForm locale={locale} />
        </div>

        <div className="y2k-panel rounded-[1.75rem] p-5 sm:p-8">
          <OpenExistingRoomForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
