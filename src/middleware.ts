import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Skiftläge för gamla länkar: /Rolfsson → internt /rolfsson (rewrite, INTE 308).
 * Annars kan man få ERR_TOO_MANY_REDIRECTS om någon annan regel (t.ex. Vercel)
 * skickar /rolfsson → /Rolfsson medan next.config hade 308 tillbaka till /rolfsson.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/Rolfsson") {
    const url = request.nextUrl.clone();
    url.pathname = "/rolfsson";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/") {
    const res = NextResponse.next();
    res.headers.set("Cache-Control", "private, no-store, max-age=0, must-revalidate");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/Rolfsson"],
};
