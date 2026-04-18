"use client";

import { useEffect, useMemo, useState } from "react";

export type CityLite = { id: string; name: string; slug: string; _count?: { spots: number } };

export function CityPickOrCreate({
  cities,
  onSelectCity,
  onCityCreated,
  selectedSlug,
  embedded = false,
}: {
  cities: CityLite[];
  onSelectCity: (c: CityLite) => void;
  onCityCreated: (c: CityLite) => void;
  /** Vilken stad tipset sparas under (synkas med vald rad i listan och huvudfliken). */
  selectedSlug: string;
  /** Ingen egen kort-ram — används inuti gemensam modal-panel. */
  embedded?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => document.getElementById("city-modal-search")?.focus(), 40);
    return () => window.clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cities.slice(0, 10);
    return cities
      .filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
      .slice(0, 12);
  }, [cities, query]);

  const exactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return cities.find((c) => c.name.toLowerCase() === q) ?? null;
  }, [cities, query]);

  const canCreate = query.trim().length >= 2 && !exactMatch;

  async function createCity() {
    const name = query.trim();
    if (name.length < 2) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { city?: CityLite; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Kunde inte skapa stad");
      const created = data.city;
      if (!created?.slug) throw new Error("Saknar stad");
      onCityCreated(created);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Okänt fel");
    } finally {
      setBusy(false);
    }
  }

  const shell = embedded
    ? "min-w-0 max-w-full space-y-2"
    : "mb-4 min-w-0 max-w-full rounded-2xl border border-fuchsia-200/60 bg-white/75 px-3 py-3 sm:px-4";

  return (
    <div className={shell}>
      <input
        id="city-modal-search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setErr(null);
        }}
        placeholder="Sök bland städer eller skriv ny…"
        aria-label="Sök eller välj stad för tipset"
        className="w-full min-w-0 max-w-full rounded-xl border border-fuchsia-200/70 bg-white/90 px-3 py-2 text-sm font-semibold text-indigo-950 outline-none ring-0 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-300/50 sm:rounded-2xl sm:py-2.5"
        autoComplete="off"
      />

      {err ? (
        <p className="mt-2 text-xs font-bold text-rose-600">{err}</p>
      ) : (
        <>
          {filtered.length > 0 ? (
            <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto rounded-xl border border-indigo-100/80 bg-white/90 p-1">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-bold text-indigo-950 hover:bg-fuchsia-50/90 ${
                      c.slug === selectedSlug ? "bg-fuchsia-100/90 ring-1 ring-fuchsia-300/60" : ""
                    }`}
                    onClick={() => {
                      onSelectCity(c);
                    }}
                  >
                    <span className="truncate">{c.name}</span>
                    {c._count != null ? (
                      <span className="shrink-0 text-[11px] font-black tabular-nums text-indigo-900/40">
                        {c._count.spots}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : query.trim() ? (
            <p className="mt-2 text-xs font-bold text-indigo-900/45">Ingen stad matchar sökningen.</p>
          ) : (
            <p className="mt-2 text-xs font-bold text-indigo-900/45">Inga städer än — använd knappen nedan.</p>
          )}

          {canCreate ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void createCity()}
              className="mt-3 w-full rounded-full border border-emerald-300/80 bg-gradient-to-r from-emerald-400 to-teal-500 py-2.5 text-sm font-extrabold text-white transition enabled:hover:brightness-105 enabled:active:scale-[0.99] disabled:opacity-45"
            >
              {busy ? "Skapar…" : `Lägg till ny plats: "${query.trim()}"`}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
