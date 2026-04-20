import { cookies, headers } from "next/headers";
import type { Locale } from "@/lib/i18n";
import { localeCookieName, pickLocaleFromAcceptLanguage } from "@/lib/i18n";

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const fromCookie = jar.get(localeCookieName())?.value;
  if (fromCookie === "sv" || fromCookie === "en") return fromCookie;

  const h = await headers();
  return pickLocaleFromAcceptLanguage(h.get("accept-language"));
}

