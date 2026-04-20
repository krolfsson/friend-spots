import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { localeCookieName, pickLocaleFromAcceptLanguage } from "@/lib/i18n";

/**
 * Skiftläge för gamla länkar: /Rolfsson → internt /rolfsson (rewrite, INTE 308).
 * Annars kan man få ERR_TOO_MANY_REDIRECTS om någon annan regel (t.ex. Vercel)
 * skickar /rolfsson → /Rolfsson medan next.config hade 308 tillbaka till /rolfsson.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const localeCookie = localeCookieName();
  const existing = request.cookies.get(localeCookie)?.value;
  const picked = existing === "sv" || existing === "en"
    ? existing
    : pickLocaleFromAcceptLanguage(request.headers.get("accept-language"));

  if (pathname === "/Rolfsson") {
    const url = request.nextUrl.clone();
    url.pathname = "/rolfsson";
    const res = NextResponse.rewrite(url);
    // Persist locale so server components can render correct language from first navigation.
    res.cookies.set(localeCookie, picked, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  if (pathname === "/") {
    const res = NextResponse.next();
    res.headers.set(
      "Cache-Control",
      "private, no-store, max-age=0, must-revalidate",
    );
    res.cookies.set(localeCookie, picked, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
    return res;
  }

  const res = NextResponse.next();
  res.cookies.set(localeCookie, picked, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export const config = {
  matcher: ["/", "/Rolfsson", "/((?!_next|api|icon\\.svg|apple-icon|opengraph-image).*)"],
};
