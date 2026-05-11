import { EmojiCollageBackground } from "@/components/EmojiCollageBackground";
import { HomeLandingClient } from "@/components/HomeLandingClient";
import { getRequestLocale } from "@/lib/i18n.server";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
};

export default async function Home() {
  const locale = await getRequestLocale();
  return (
    <>
      <EmojiCollageBackground />
      <div className="relative z-10 mx-auto min-h-dvh max-w-6xl overflow-x-visible pt-3 pb-8 sm:pt-6 sm:pb-12">
        <HomeLandingClient locale={locale} />
      </div>
    </>
  );
}
