import { GuideShell } from "@/components/guides/GuideShell";
import { getPublicSiteOrigin } from "@/lib/siteUrl";
import { SITE_TITLE } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";

const path = "/guides/shared-map";
const origin = getPublicSiteOrigin();

export const metadata: Metadata = {
  title: "Shared map for friends – one link, one list",
  description:
    "Mapsies is a lightweight shared map for groups: PIN instead of accounts, tips on a map, leaderboard, open in Google Maps.",
  alternates: {
    canonical: `${origin}${path}`,
    languages: {
      en: `${origin}${path}`,
      sv: `${origin}/guides/delad-karta`,
    },
  },
  openGraph: {
    title: `Shared map for friends · ${SITE_TITLE}`,
    description:
      "Collect places together, vote with thumbs up, browse map or list – share one URL protected by a PIN.",
    locale: "en_US",
    type: "article",
    url: `${origin}${path}`,
  },
};

export default function SharedMapGuidePage() {
  return (
    <GuideShell locale="en">
      <h1 className="text-balance text-2xl font-extrabold tracking-tight text-indigo-950 sm:text-3xl">
        A shared map that stays readable
      </h1>
      <p className="mt-4 text-sm font-semibold leading-relaxed text-indigo-900/70 sm:text-base">
        Group chats are terrible archives of half-remembered restaurant links. A dedicated{" "}
        <strong className="text-indigo-950">shared map</strong> gives everyone the same view – and a simple way to add
        new spots and see what the group actually likes.
      </p>

      <h2 className="mt-10 text-lg font-extrabold text-indigo-950 sm:text-xl">What you get with Mapsies</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-medium leading-relaxed text-indigo-900/75 sm:text-[0.95rem]">
        <li>One URL for your “mapsie”, opened with a PIN instead of user accounts.</li>
        <li>Places on a map, multiple cities if you need them, categories for scanning.</li>
        <li>Thumbs-up style votes so a leaderboard reflects the group.</li>
        <li>Open directions in Google Maps when you are heading out.</li>
      </ul>

      <h2 className="mt-10 text-lg font-extrabold text-indigo-950 sm:text-xl">How to start</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-medium leading-relaxed text-indigo-900/75 sm:text-[0.95rem]">
        <li>Create a mapsie from the home page (name + PIN).</li>
        <li>Share the link with your friends (same PIN for people you trust).</li>
        <li>Add cities and tips as you go.</li>
      </ol>

      <h2 className="mt-10 text-lg font-extrabold text-indigo-950 sm:text-xl">Who it is for</h2>
      <p className="mt-3 text-sm font-medium leading-relaxed text-indigo-900/75 sm:text-[0.95rem]">
        Small and medium-sized friend groups who want a <strong className="text-indigo-950">low-friction shared place
        list</strong>. The PIN keeps random visitors out; it is not enterprise IAM.
      </p>

      <p className="mt-10 text-center">
        <Link
          href="/"
          className="inline-flex rounded-full bg-gradient-to-r from-indigo-800 to-violet-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-indigo-900/20 ring-1 ring-white/30 transition hover:brightness-105"
        >
          Create or open a mapsie
        </Link>
      </p>
    </GuideShell>
  );
}
