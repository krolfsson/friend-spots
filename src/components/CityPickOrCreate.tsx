"use client";

import { useEffect, useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";

export type CityLite = { id: string; name: string; slug: string; _count?: { spots: number } };

export function CityPickOrCreate({
  roomSlug,
  cities,
  onSelectCity,
  onCityCreated,
  selectedSlug,
  locale,
  embedded = false,
}: {
  roomSlug: string;
  cities: CityLite[];
  onSelectCity: (c: CityLite) => void;
  onCityCreated: (c: CityLite) => void;
  /** Vilken stad tipset sparas under (synkas med vald rad i listan och huvudfliken). */
  selectedSlug: string;
  locale: Locale;
  /** Ingen egen kort-ram — används inuti gemensam modal-panel. */
  embedded?: boolean;
}) {
  const [newCityName, setNewCityName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const ordered = useMemo(
    () => [...cities].sort((a, b) => a.name.localeCompare(b.name, "sv")),
    [cities],
  );

  const selectValue = ordered.some((c) => c.slug === selectedSlug)
    ? selectedSlug
    : (ordered[0]?.slug ?? "");

  useEffect(() => {
    if (ordered.length === 0) return;
    const t = window.setTimeout(() => document.getElementById("city-modal-select")?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [ordered.length]);

  const canCreate =
    newCityName.trim().length >= 2 &&
    !ordered.some((c) => c.name.toLowerCase() === newCityName.trim().toLowerCase());

  async function createCity() {
    const name = newCityName.trim();
    if (name.length < 2) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Room-Slug": roomSlug },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { city?: CityLite; error?: string };
      if (!res.ok) throw new Error(data.error ?? (locale === "en" ? "Could not create city" : "Kunde inte skapa stad"));
      const created = data.city;
      if (!created?.slug) throw new Error("Saknar stad");
      onCityCreated(created);
      setNewCityName("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Okänt fel");
    } finally {
      setBusy(false);
    }
  }

  const shell = embedded
    ? "min-w-0 max-w-full space-y-2"
    : "mb-4 min-w-0 max-w-full rounded-2xl border border-fuchsia-200/60 bg-white/75 px-3 py-3 sm:px-4";

  if (ordered.length === 0) {
    return (
      <div className={shell}>
        <p className="text-xs font-bold text-indigo-900/55">
          {locale === "en" ? "No cities yet — create the first one." : "Inga städer än — skapa den första."}
        </p>
        <div className="mt-2 flex flex-wrap items-stretch gap-2">
          <input
            value={newCityName}
            onChange={(e) => {
              setNewCityName(e.target.value);
              setErr(null);
            }}
            placeholder={locale === "en" ? "City name" : "Stadens namn"}
            aria-label={locale === "en" ? "New city name" : "Ny stads namn"}
            className="min-h-10 min-w-0 flex-1 rounded-xl border border-fuchsia-200/70 bg-white/90 px-3 py-2 text-sm font-semibold text-indigo-950 outline-none focus:ring-2 focus:ring-fuchsia-300/50"
          />
          <button
            type="button"
            disabled={busy || newCityName.trim().length < 2}
            onClick={() => void createCity()}
            className="ui-press shrink-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-2 text-xs font-extrabold text-white disabled:opacity-40"
          >
            {busy ? "…" : locale === "en" ? "Create" : "Skapa"}
          </button>
        </div>
        {err ? <p className="mt-2 text-xs font-bold text-rose-600">{err}</p> : null}
      </div>
    );
  }

  return (
    <div className={shell}>
      <label htmlFor="city-modal-select" className="sr-only">
        {locale === "en" ? "Choose city" : "Välj stad"}
      </label>
      <select
        id="city-modal-select"
        value={selectValue}
        onChange={(e) => {
          setErr(null);
          const c = ordered.find((x) => x.slug === e.target.value);
          if (c) onSelectCity(c);
        }}
        className="h-10 w-full max-w-full cursor-pointer rounded-xl border border-fuchsia-200/70 bg-white/90 px-3 text-sm font-semibold text-indigo-950 outline-none ring-0 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-300/50 sm:h-11 sm:rounded-2xl"
      >
        {ordered.map((c) => (
          <option key={c.id} value={c.slug}>
            {c.name}
            {c._count != null ? ` (${c._count.spots})` : ""}
          </option>
        ))}
      </select>

      <details className="group rounded-lg pt-0.5 [&_summary::-webkit-details-marker]:hidden">
        <summary className="cursor-pointer list-none py-1 text-[11px] font-extrabold tracking-wide text-indigo-800/75 hover:text-indigo-950">
          {locale === "en" ? "+ New city (optional)" : "+ Ny stad (valfritt)"}
        </summary>
        <div className="mt-1.5 flex flex-wrap items-stretch gap-2 pb-0.5">
          <input
            value={newCityName}
            onChange={(e) => {
              setNewCityName(e.target.value);
              setErr(null);
            }}
            placeholder={locale === "en" ? "Name of new city" : "Namn på ny stad"}
            aria-label={locale === "en" ? "Name of new city" : "Namn på ny stad"}
            className="min-h-9 min-w-0 flex-1 rounded-lg border border-indigo-200/70 bg-white/90 px-2.5 py-1.5 text-xs font-semibold text-indigo-950 outline-none focus:ring-2 focus:ring-fuchsia-300/45"
          />
          {canCreate ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void createCity()}
              className="ui-press shrink-0 rounded-full border border-emerald-300/80 bg-gradient-to-r from-emerald-400 to-teal-500 px-3 py-1.5 text-[11px] font-extrabold text-white disabled:opacity-45"
            >
              {busy ? "…" : locale === "en" ? "Add" : "Lägg till"}
            </button>
          ) : null}
        </div>
      </details>

      {err ? <p className="text-xs font-bold text-rose-600">{err}</p> : null}
    </div>
  );
}
