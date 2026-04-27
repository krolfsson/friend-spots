import { GuideShell } from "@/components/guides/GuideShell";
import { getPublicSiteOrigin } from "@/lib/siteUrl";
import { SITE_TITLE } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

const path = "/guides/delad-karta";
const origin = getPublicSiteOrigin();

export const metadata: Metadata = {
  title: "Delad karta med vänner – tipslista och karta i ett",
  description:
    "Samlar ni restauranger, barer och smultronställen i en gruppchatt som drunknar? Mapsies är en enkel delad karta med pinkod – utan konton.",
  alternates: {
    canonical: `${origin}${path}`,
    languages: {
      sv: `${origin}${path}`,
      en: `${origin}/guides/shared-map`,
    },
  },
  openGraph: {
    title: `Delad karta med vänner · ${SITE_TITLE}`,
    description:
      "Gemensam tipskarta för gänget: flera städer, plussa favoriter, öppna i Google Maps – med pinkod istället för inloggning.",
    locale: "sv_SE",
    type: "article",
    url: `${origin}${path}`,
  },
};

export default function DeladKartaGuidePage() {
  return (
    <GuideShell locale="sv">
      <h1 className="text-balance text-2xl font-extrabold tracking-tight text-indigo-950 sm:text-3xl">
        Delad karta med vänner – utan att chatten exploderar
      </h1>
      <p className="mt-4 text-sm font-semibold leading-relaxed text-indigo-900/70 sm:text-base">
        När ni planerar resa, svensexa eller bara “vilka ställen ska vi faktiskt till?” brukar länkar och screenshots
        hamna huller om buller. En riktig{" "}
        <strong className="text-indigo-950">delad karta</strong> gör att alla ser samma bild – och kan lägga till
        egna favoriter.
      </p>

      <h2 className="mt-10 text-lg font-extrabold text-indigo-950 sm:text-xl">Vad Mapsies löser</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-medium leading-relaxed text-indigo-900/75 sm:text-[0.95rem]">
        <li>En länk till er gemensamma “mapsie” – bara ni med pinkoden kommer in.</li>
        <li>Tips på karta, stad för stad, med kategorier (lunch, bar, fika …).</li>
        <li>Gilla (plussa) det ni tycker om så topplistan speglar gänget.</li>
        <li>Öppna vägbeskrivning i Google Maps när det är dags att gå.</li>
      </ul>

      <h2 className="mt-10 text-lg font-extrabold text-indigo-950 sm:text-xl">Hur ni kommer igång</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-medium leading-relaxed text-indigo-900/75 sm:text-[0.95rem]">
        <li>Gå till startsidan och skapa en ny mapsie med namn och pinkod.</li>
        <li>Dela länken i gruppen (samma pinkod till alla ni litar på).</li>
        <li>Lägg till städer om ni reser till fler orter, och börja droppa tips.</li>
      </ol>

      <h2 className="mt-10 text-lg font-extrabold text-indigo-950 sm:text-xl">Passar det er?</h2>
      <p className="mt-3 text-sm font-medium leading-relaxed text-indigo-900/75 sm:text-[0.95rem]">
        Mapsies är byggt för små till medelstora grupper som vill ha <strong className="text-indigo-950">en enkel delad
        platslista</strong> – inte för företag som behöver avancerad åtkomstkontroll. Pinkoden är ett pragmatiskt skydd
        mot slumpbesökare, inte bankidentifiering.
      </p>

      <p className="mt-10 text-center">
        <Link
          href="/"
          className="inline-flex rounded-full bg-gradient-to-r from-indigo-800 to-violet-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-900/20 ring-1 ring-white/30 transition hover:brightness-105"
        >
          Skapa eller öppna en mapsie
        </Link>
      </p>
    </GuideShell>
  );
}
