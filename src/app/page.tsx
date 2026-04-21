import { EmojiCollageBackground } from "@/components/EmojiCollageBackground";
import { HomeLandingClient } from "@/components/HomeLandingClient";
import { getRequestLocale } from "@/lib/i18n.server";
import { SITE_DESCRIPTION, SITE_TITLE } from "@/lib/site";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
};

export default async function Home() {
  const locale = await getRequestLocale();
  return (
    <div className="relative mx-auto min-h-dvh max-w-lg px-4 pt-3 pb-8 sm:mx-auto sm:max-w-md sm:pt-6 sm:pb-12">
      <EmojiCollageBackground />
      <HomeLandingClient locale={locale} />
    </div>
  );
}
