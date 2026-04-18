"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

type CityRow = { id: string; name: string; slug: string; _count?: { spots: number } };

export function CityPickOrCreate({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    window.setTimeout(() => document.getElementById("city-modal-search")?.focus(), 40);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cities");
        const data = (await res.json()) as { cities?: CityRow[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Kunde inte ladda städer");
        if (!cancelled) setCities(data.cities ?? []);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Fel");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
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

  const goToCity = useCallback(
    (slug: string) => {
      onClose();
      router.push(`/c/${slug}`);
      router.refresh();
    },
    [onClose, router],
  );

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
      const data = (await res.json()) as { city?: { slug: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Kunde inte skapa stad");
      const slug = data.city?.slug;
      if (!slug) throw new Error("Saknar slug");
      goToCity(slug);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Okänt fel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-fuchsia-200/60 bg-white/75 px-3 py-3 sm:px-4">
      <label className="block text-[11px] font-extrabold uppercase tracking-wide text-indigo-900/55" htmlFor="city-modal-search">
        Stad
      </label>
      <input
        id="city-modal-search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setErr(null);
        }}
        placeholder="Sök bland städer eller skriv ny…"
        className="mt-1.5 w-full rounded-2xl border border-fuchsia-200/70 bg-white/90 px-3 py-2.5 text-sm font-semibold text-indigo-950 outline-none ring-0 focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-300/50"
        autoComplete="off"
      />

      {loading ? (
        <p className="mt-2 text-xs font-bold text-indigo-900/50">Laddar städer…</p>
      ) : err ? (
        <p className="mt-2 text-xs font-bold text-rose-600">{err}</p>
      ) : (
        <>
          {filtered.length > 0 ? (
            <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto rounded-xl border border-indigo-100/80 bg-white/90 p-1">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-bold text-indigo-950 hover:bg-fuchsia-50/90"
                    onClick={() => goToCity(c.slug)}
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
              {busy ? "Skapar…" : `Lägg till ny plats: “${query.trim()}”`}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
