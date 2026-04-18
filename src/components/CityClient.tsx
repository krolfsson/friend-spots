"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AddSpotForm } from "@/components/AddSpotForm";
import { CityPickOrCreate } from "@/components/CityPickOrCreate";
import { CATEGORIES, categoryMeta, type CategoryId } from "@/lib/categories";
import { mapsDirectionsUrl } from "@/lib/mapsUrl";

type Recommendation = {
  id: string;
  contributorName: string;
};

type Spot = {
  id: string;
  googlePlaceId: string;
  name: string;
  neighborhood: string | null;
  category: string;
  emoji: string | null;
  recommendations: Recommendation[];
};

type City = { id: string; name: string; slug: string; _count?: { spots: number } };

function ChipScroller({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-1 px-1">
      <div className="flex gap-2 overflow-x-auto py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
    </div>
  );
}

export function CityClient({ cities, city }: { cities: City[]; city: City }) {
  const [cityList, setCityList] = useState<City[]>(cities);
  const [activeCity, setActiveCity] = useState<City>(city);
  const [addOpen, setAddOpen] = useState(false);
  const [category, setCategory] = useState<"alla" | CategoryId>("alla");
  const [neighborhood, setNeighborhood] = useState<string>("alla");
  const [spots, setSpots] = useState<Spot[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firstFetch = useRef(true);
  const prevCitySlug = useRef(activeCity.slug);

  useEffect(() => {
    setCityList(cities);
  }, [cities]);

  const load = useCallback(async () => {
    const cityChanged = prevCitySlug.current !== activeCity.slug;
    if (firstFetch.current) {
      setLoading(true);
    } else if (cityChanged) {
      setSpots([]);
    }
    setError(null);
    try {
      const params = new URLSearchParams({
        citySlug: activeCity.slug,
        category,
        neighborhood,
      });
      const res = await fetch(`/api/spots?${params.toString()}`);
      const data = (await res.json()) as {
        spots?: Spot[];
        neighborhoods?: string[];
        categoryCounts?: Record<string, number>;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Kunde inte ladda tips");
      setSpots(data.spots ?? []);
      setNeighborhoods(data.neighborhoods ?? []);
      setCategoryCounts(data.categoryCounts ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Okänt fel");
    } finally {
      setLoading(false);
      firstFetch.current = false;
      prevCitySlug.current = activeCity.slug;
    }
  }, [activeCity.slug, category, neighborhood]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setNeighborhood("alla");
  }, [category]);

  useEffect(() => {
    if (!addOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAddOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addOpen]);

  return (
    <div className="relative mx-auto max-w-5xl px-4 pb-14 pt-5">
      <div className="mb-1.5 flex items-center gap-2">
        <button
          type="button"
          aria-label="Öppna meny: stad och nytt tips"
          onClick={() => setAddOpen(true)}
          className="y2k-fab-sm grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path
              d="M12 5v14M5 12h14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <div className="-mx-1 min-w-0 flex-1 px-1">
          <div className="flex gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {cityList.map((c) => {
              const active = c.slug === activeCity.slug;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setActiveCity(c);
                    window.history.replaceState(null, "", `/?city=${encodeURIComponent(c.slug)}`);
                  }}
                  className={`inline-flex h-9 min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-extrabold leading-none tracking-tight transition active:scale-95 ${
                    active ? "y2k-chip-active text-white" : "y2k-chip text-indigo-950 hover:-translate-y-0.5"
                  }`}
                >
                  <span aria-hidden>🌃</span>
                  <span className="max-w-[11rem] truncate">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mb-0.5">
        <ChipScroller>
          <Chip active={category === "alla"} onClick={() => setCategory("alla")} tone="violet">
            <span className="mr-1">✨</span>
            Alla
          </Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.id}
              active={category === c.id}
              onClick={() => setCategory(c.id)}
              tone="pink"
            >
              <span className="mr-1">{c.emoji}</span>
              {c.label}
              <span
                className={`ml-1 text-[11px] font-black leading-none tabular-nums ${
                  category === c.id ? "text-white/80" : "text-indigo-950/35"
                }`}
              >
                {categoryCounts[c.id] ?? 0}
              </span>
            </Chip>
          ))}
        </ChipScroller>
      </div>

      <div className="mb-3">
        <ChipScroller>
          <Chip active={neighborhood === "alla"} onClick={() => setNeighborhood("alla")} tone="violet">
            <span className="mr-1">🗺️</span>
            Alla områden
          </Chip>
          {neighborhoods.map((n) => (
            <Chip key={n} active={neighborhood === n} onClick={() => setNeighborhood(n)} tone="violet">
              {n}
            </Chip>
          ))}
          <Chip active={neighborhood === "ovrigt"} onClick={() => setNeighborhood("ovrigt")} tone="muted">
            Övrigt
          </Chip>
        </ChipScroller>
      </div>

      {error ? (
        <p className="mb-4 rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-bold text-rose-800">
          {error}
        </p>
      ) : null}

      <div className="mb-10 min-h-[100px]">
        {loading ? (
          <div className="h-24 rounded-[1.5rem] bg-gradient-to-r from-fuchsia-100/70 via-white/40 to-sky-100/70 p-[2px]">
            <div className="h-full w-full animate-pulse rounded-[1.45rem] bg-white/35" />
          </div>
        ) : spots.length === 0 ? null : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {spots.map((s) => (
              <SpotCard key={s.id} spot={s} onPurge={() => void load()} />
            ))}
          </div>
        )}
      </div>

      {addOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-indigo-950/40 p-3 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label="Stad och nytt tips"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAddOpen(false);
          }}
        >
          <div className="max-h-[min(92dvh,720px)] w-full max-w-lg space-y-0 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
            <CityPickOrCreate
              cities={cityList}
              onClose={() => setAddOpen(false)}
              onSelectCity={(c) => {
                setActiveCity(c);
                window.history.replaceState(null, "", `/?city=${encodeURIComponent(c.slug)}`);
              }}
              onCityCreated={(c) => {
                const next = { ...c, _count: c._count ?? { spots: 0 } };
                setCityList((prev) =>
                  [...prev.filter((x) => x.id !== next.id), next].sort((a, b) =>
                    a.name.localeCompare(b.name, "sv"),
                  ),
                );
                setActiveCity(next);
                window.history.replaceState(null, "", `/?city=${encodeURIComponent(next.slug)}`);
              }}
            />
            <AddSpotForm
              citySlug={activeCity.slug}
              onSaved={() => {
                void load();
                window.setTimeout(() => setAddOpen(false), 500);
              }}
              onRequestClose={() => setAddOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
  tone = "violet",
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  tone?: "violet" | "pink" | "muted";
}) {
  const activeClass =
    tone === "pink"
      ? "y2k-chip-active"
      : tone === "muted"
        ? "y2k-chip-active-muted"
        : "y2k-chip-active";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 min-h-9 shrink-0 items-center justify-center rounded-full px-3.5 text-sm font-extrabold leading-none tracking-tight transition active:scale-95 ${
        active ? activeClass : "y2k-chip text-indigo-950 hover:-translate-y-0.5"
      }`}
    >
      {children}
    </button>
  );
}

function SpotCard({ spot, onPurge }: { spot: Spot; onPurge: () => void }) {
  const cat = categoryMeta(spot.category);
  const big = (spot.emoji?.trim() || cat.emoji).slice(0, 8);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!menu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const pad = 8;
    const mw = 168;
    const mh = 52;
    let x = e.clientX;
    let y = e.clientY;
    x = Math.min(x, window.innerWidth - mw - pad);
    y = Math.min(y, window.innerHeight - mh - pad);
    x = Math.max(pad, x);
    y = Math.max(pad, y);
    setMenu({ x, y });
  }, []);

  const deleteSpot = useCallback(async () => {
    if (!window.confirm("Ta bort detta tips permanent?")) return;
    try {
      const res = await fetch(`/api/spots?spotId=${encodeURIComponent(spot.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        window.alert("Kunde inte ta bort tipset.");
        return;
      }
      onPurge();
    } catch {
      window.alert("Nätverksfel.");
    }
  }, [onPurge, spot.id]);

  return (
    <>
      <article
        className="y2k-card flex cursor-default items-center gap-3 rounded-2xl p-3"
        onContextMenu={openMenu}
      >
        <div
          className="flex h-14 w-14 shrink-0 select-none items-center justify-center rounded-2xl bg-gradient-to-br from-white/90 to-fuchsia-50/80 text-[2.1rem] leading-none shadow-inner shadow-fuchsia-100"
          aria-hidden
        >
          {big}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.95rem] font-extrabold tracking-tight text-indigo-950">{spot.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-fuchsia-200/70 bg-white/70 px-2 py-0.5 text-[11px] font-extrabold text-indigo-900/80">
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </span>
            <a
              className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-2.5 py-1 text-[11px] font-extrabold text-indigo-950 shadow-sm shadow-cyan-500/20 ring-1 ring-white/60 hover:brightness-110"
              href={mapsDirectionsUrl(spot.googlePlaceId)}
              target="_blank"
              rel="noreferrer"
            >
              Maps
            </a>
          </div>
        </div>
      </article>
      {menu ? (
        <>
          <div
            className="fixed inset-0 z-[100]"
            aria-hidden
            onMouseDown={() => setMenu(null)}
          />
          <div
            role="menu"
            className="fixed z-[110] min-w-[10.5rem] overflow-hidden rounded-xl border border-rose-200/80 bg-white py-1 text-sm font-extrabold text-rose-800 shadow-lg ring-1 ring-indigo-950/10"
            style={{ left: menu.x, top: menu.y }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              role="menuitem"
              className="block w-full px-4 py-2.5 text-left hover:bg-rose-50"
              onClick={() => {
                setMenu(null);
                void deleteSpot();
              }}
            >
              Ta bort
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
