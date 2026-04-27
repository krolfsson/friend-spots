import Link from "next/link";
import type { ReactNode } from "react";

export function GuideShell({
  locale,
  children,
}: {
  locale: "sv" | "en";
  children: ReactNode;
}) {
  const home = locale === "sv" ? "Till startsidan" : "Home";
  const otherHref = locale === "sv" ? "/guides/shared-map" : "/guides/delad-karta";
  const otherLabel = locale === "sv" ? "English version" : "Svensk version";

  return (
    <div className="min-h-dvh bg-gradient-to-b from-fuchsia-50/35 via-white to-indigo-50/30">
      <header className="border-b border-indigo-100/80 bg-white/75 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link
            href="/"
            className="text-sm font-extrabold tracking-tight text-indigo-950 underline decoration-indigo-200 decoration-2 underline-offset-4 hover:decoration-fuchsia-400"
          >
            Mapsies
          </Link>
          <div className="flex items-center gap-3 text-xs font-bold text-indigo-900/55">
            <Link href={otherHref} className="hover:text-indigo-950">
              {otherLabel}
            </Link>
            <span aria-hidden className="text-indigo-200">
              ·
            </span>
            <Link href="/" className="hover:text-indigo-950">
              {home}
            </Link>
          </div>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">{children}</article>
    </div>
  );
}
