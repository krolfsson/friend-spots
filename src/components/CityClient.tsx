"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { createPortal } from "react-dom";
import { AddSpotForm } from "@/components/AddSpotForm";
import { CityPickOrCreate } from "@/components/CityPickOrCreate";
import { CATEGORIES, categoryMeta, isCategoryId, type CategoryId } from "@/lib/categories";
import type { DashboardBySlug, DashboardSpot } from "@/lib/dashboardTypes";
import { mapsOpenForSpot } from "@/lib/mapsUrl";
import { getOrCreateVoterToken } from "@/lib/voterClient";
import { isMapViewConfigured, SpotsMap } from "@/components/SpotsMap";

type City = { id: string; name: string; slug: string; _count?: { spots: number } };

type ToastTone = "success" | "info";

function FadingHorizontalChips({
  children,
  rowClassName = "py-2",
}: {
  children: React.ReactNode;
  /** Vertikal padding kring chip-raden */
  rowClassName?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  const sync = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    const hasOverflow = maxScroll > 2;
    if (!hasOverflow) {
      setFadeLeft(false);
      setFadeRight(false);
      return;
    }
    const atStart = el.scrollLeft <= 2;
    const atEnd = el.scrollLeft >= maxScroll - 2;
    setFadeLeft(!atStart);
    setFadeRight(!atEnd);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    const track = trackRef.current;
    if (!el || !track) return;
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(track);
    ro.observe(el);
    window.addEventListener("resize", sync);
    sync();
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  return (
    <div
      ref={scrollRef}
      className={`overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${rowClassName} ${
        fadeLeft && fadeRight
          ? "chip-row-fade-both"
          : fadeRight
            ? "chip-row-fade-right"
            : fadeLeft
              ? "chip-row-fade-left"
              : ""
      }`}
    >
      <div ref={trackRef} className="flex w-max gap-[0.6rem]">
        {children}
      </div>
    </div>
  );
}

export function CityClient({
  roomSlug,
  roomTitle,
  locale,
  cities,
  city,
  dashboard,
}: {
  roomSlug: string;
  roomTitle: string;
  locale: Locale;
  cities: City[];
  city: City;
  dashboard: DashboardBySlug;
}) {
  const [cityList, setCityList] = useState<City[]>(cities);
  const [activeCity, setActiveCity] = useState<City>(city);
  const [bundle, setBundle] = useState<DashboardBySlug>(dashboard);

  const categoryItems = CATEGORIES as readonly { id: CategoryId; label: string; emoji: string }[];
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameBusy, setRenameBusy] = useState(false);
  const [renameValue, setRenameValue] = useState(roomTitle);
  const [roomTitleLive, setRoomTitleLive] = useState(roomTitle);
  const [hereOn, setHereOn] = useState(false);
  /** Stad som POST /api/spots använder — samma som vald rad i lägg-till-panelen. */
  const [addTargetSlug, setAddTargetSlug] = useState(city.slug);
  const [category, setCategory] = useState<"alla" | CategoryId>("alla");
  const [neighborhood, setNeighborhood] = useState<string>("alla");
  const [viewMode, setViewMode] = useState<"list" | "map">("map");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: ToastTone } | null>(null);
  const mapEnabled = isMapViewConfigured();

  useEffect(() => {
    setRoomTitleLive(roomTitle);
    setRenameValue(roomTitle);
  }, [roomTitle]);

  useEffect(() => {
    setCityList(cities);
  }, [cities]);

  useEffect(() => {
    setBundle(dashboard);
  }, [dashboard]);

  useEffect(() => {
    setNeighborhood("alla");
  }, [activeCity.slug, category]);

  const baseSpots = useMemo(() => bundle[activeCity.slug]?.spots ?? [], [bundle, activeCity.slug]);
  const categoryCounts = bundle[activeCity.slug]?.categoryCounts ?? {};

  const filteredByCategory = useMemo(() => {
    if (category === "alla") return baseSpots;
    if (!isCategoryId(category)) return baseSpots;
    return baseSpots.filter((s) => s.category === category);
  }, [baseSpots, category]);

  const neighborhoods = useMemo(() => {
    return Array.from(
      new Set(
        filteredByCategory
          .map((s) => s.neighborhood)
          .filter((n): n is string => Boolean(n && n.trim())),
      ),
    ).sort((a, b) => a.localeCompare(b, "sv"));
  }, [filteredByCategory]);

  const displaySpots = useMemo(() => {
    if (neighborhood === "alla") return filteredByCategory;
    if (neighborhood === "ovrigt") {
      return filteredByCategory.filter((s) => !s.neighborhood?.trim());
    }
    return filteredByCategory.filter((s) => s.neighborhood === neighborhood);
  }, [filteredByCategory, neighborhood]);

  const addTargetCity = useMemo(
    () => cityList.find((c) => c.slug === addTargetSlug) ?? activeCity,
    [cityList, addTargetSlug, activeCity],
  );

  const refreshCity = useCallback(async (slug: string, signal?: AbortSignal) => {
    setError(null);
    try {
      const params = new URLSearchParams({
        citySlug: slug,
        category: "alla",
        neighborhood: "alla",
      });
      const headers: Record<string, string> = { "X-Room-Slug": roomSlug };
      const vt = getOrCreateVoterToken();
      if (vt) headers["X-Voter-Token"] = vt;
      const res = await fetch(`/api/spots?${params.toString()}`, {
        headers,
        signal,
      });
      const data = (await res.json()) as {
        spots?: DashboardSpot[];
        categoryCounts?: Record<string, number>;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? t(locale, "spots.loadError"));
      const spots = data.spots ?? [];
      const counts = data.categoryCounts ?? {};
      setBundle((prev) => ({ ...prev, [slug]: { spots, categoryCounts: counts } }));
      setCityList((prev) =>
        prev.map((c) => (c.slug === slug ? { ...c, _count: { spots: spots.length } } : c)),
      );
    } catch (e) {
      // När man byter stad/filters snabbt kan tidigare fetch avbrytas — visa inte fel för det.
      if (e instanceof DOMException && e.name === "AbortError") return;
      if (e instanceof Error && e.name === "AbortError") return;
      if (e instanceof TypeError && e.message.includes("Failed to fetch")) {
        setError("Tillfälligt nätverksfel. Försök igen.");
        return;
      }
      setError(e instanceof Error ? e.message : "Okänt fel");
    }
  }, [roomSlug, locale]);

  useEffect(() => {
    const ctrl = new AbortController();
    void refreshCity(activeCity.slug, ctrl.signal);
    return () => ctrl.abort();
  }, [activeCity.slug, refreshCity]);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToast({ message, tone });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const sharePayload = useMemo(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = roomTitleLive.trim() || (locale === "en" ? "Map" : "Karta");
    const text = `${title} — ${t(locale, "share.copy")}`;
    const message = url ? `${text}\n${url}` : text;

    const enc = (s: string) => encodeURIComponent(s);
    const sms = `sms:&body=${enc(message)}`;
    const whatsapp = `https://wa.me/?text=${enc(message)}`;
    const facebook = url
      ? `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}&quote=${enc(text)}`
      : `https://www.facebook.com/sharer/sharer.php?quote=${enc(text)}`;
    const mailto = `mailto:?subject=${enc(title)}&body=${enc(message)}`;

    return { url, title, text, message, sms, whatsapp, facebook, mailto };
  }, [roomTitleLive, locale]);

  const copyShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(sharePayload.message);
      showToast(t(locale, "share.copiedToast"), "success");
    } catch {
      showToast(sharePayload.message, "info");
    }
  }, [sharePayload.message, showToast, locale]);

  const shareRoom = useCallback(async () => {
    try {
      const nav = typeof navigator !== "undefined" ? navigator : null;
      const share = (nav && "share" in nav ? /** @type {any} */ (nav).share : undefined) as
        | undefined
        | ((data: { title?: string; text?: string; url?: string }) => Promise<void>);
      if (share) {
        // Keep the payload minimal for best mobile compatibility.
        await share({ title: sharePayload.title, text: sharePayload.text, url: sharePayload.url });
        return;
      }
    } catch {
      // user cancelled or share failed -> fallback below
    }

    setShareOpen(true);
  }, [sharePayload]);

  const saveRoomTitle = useCallback(async () => {
    if (renameBusy) return;
    const next = renameValue.trim();
    setRenameBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomSlug)}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: next || null }),
      });
      const data = (await res.json()) as { name?: string | null; error?: string };
      if (!res.ok) throw new Error(data.error ?? t(locale, "rename.errorDefault"));
      const saved = (data.name ?? "").trim();
      const label = saved || roomSlug;
      setRoomTitleLive(label);
      setRenameOpen(false);
      showToast(t(locale, "rename.successToast"), "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Okänt fel");
    } finally {
      setRenameBusy(false);
    }
  }, [renameBusy, renameValue, roomSlug, showToast, locale]);

  const removeSpot = useCallback((spotId: string, slug: string, spotCategory: string) => {
    setBundle((prev) => {
      const b = prev[slug];
      if (!b) return prev;
      const nextSpots = b.spots.filter((s) => s.id !== spotId);
      const nextCounts = { ...b.categoryCounts };
      const cur = nextCounts[spotCategory] ?? 0;
      if (cur <= 1) delete nextCounts[spotCategory];
      else nextCounts[spotCategory] = cur - 1;
      return { ...prev, [slug]: { spots: nextSpots, categoryCounts: nextCounts } };
    });
    setCityList((prev) =>
      prev.map((c) => {
        if (c.slug !== slug) return c;
        const n = (c._count?.spots ?? 0) - 1;
        return { ...c, _count: { spots: Math.max(0, n) } };
      }),
    );
  }, []);

  useEffect(() => {
    if (!addOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAddOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [addOpen]);

  return (
    <div className="relative mx-auto max-w-5xl px-[1.2rem] pb-[4.2rem] pt-6">
      <div className="space-y-[0.6rem]">
        <FadingHorizontalChips rowClassName="py-0">
          <button
            type="button"
            aria-label="Öppna meny: stad och nytt tips"
            onClick={() => {
              setAddTargetSlug(activeCity.slug);
              setAddOpen(true);
            }}
            className="y2k-fab-sm grid h-9 min-h-9 w-9 shrink-0 place-items-center rounded-full text-white transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/80 active:scale-95"
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
          {cityList.map((c) => {
            const active = c.slug === activeCity.slug;
            return (
                <button
                key={c.id}
                type="button"
                onClick={() => setActiveCity(c)}
                  className={`inline-flex h-9 min-h-9 shrink-0 items-center justify-center gap-[0.45rem] rounded-full px-[1.05rem] text-sm font-extrabold leading-none tracking-tight transition active:scale-95 ${
                  active ? "y2k-chip-active text-white" : "y2k-chip text-indigo-950 hover:-translate-y-0.5"
                }`}
              >
                <span aria-hidden>🌃</span>
                <span className="max-w-[11rem] truncate">{c.name}</span>
              </button>
            );
          })}
        </FadingHorizontalChips>

        <FadingHorizontalChips rowClassName="py-0">
          <Chip active={category === "alla"} onClick={() => setCategory("alla")} tone="violet">
            <span className="mr-1">✨</span>
            {t(locale, "room.filter.allCategories")}
          </Chip>
          {categoryItems.map((c) => (
            <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)} tone="pink">
              <span className="mr-1">{c.emoji}</span>
              {t(locale, `cat.${c.id}`)}
              <span
                className={`ml-1 text-[11px] font-black leading-none tabular-nums ${
                  category === c.id ? "text-white/80" : "text-indigo-950/35"
                }`}
              >
                {categoryCounts[c.id] ?? 0}
              </span>
            </Chip>
          ))}
        </FadingHorizontalChips>

        <FadingHorizontalChips rowClassName="py-0">
          <Chip active={neighborhood === "alla"} onClick={() => setNeighborhood("alla")} tone="violet">
            <span className="mr-1">🗺️</span>
            {locale === "en" ? "All areas" : "Alla områden"}
          </Chip>
          {neighborhoods.map((n) => (
            <Chip key={n} active={neighborhood === n} onClick={() => setNeighborhood(n)} tone="violet">
              {n}
            </Chip>
          ))}
          <Chip active={neighborhood === "ovrigt"} onClick={() => setNeighborhood("ovrigt")} tone="muted">
            {locale === "en" ? "Other" : "Övrigt"}
          </Chip>
        </FadingHorizontalChips>

        {mapEnabled ? (
          <FadingHorizontalChips rowClassName="py-0">
            <Chip active={viewMode === "map"} onClick={() => setViewMode("map")} tone="violet">
              <span className="mr-1">🗺️</span>
              {t(locale, "room.view.map")}
            </Chip>
            <Chip active={viewMode === "list"} onClick={() => setViewMode("list")} tone="violet">
              <span className="mr-1">📋</span>
              {t(locale, "room.view.list")}
            </Chip>
          </FadingHorizontalChips>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-bold text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="space-y-[0.6rem]">
          <div className="min-h-[100px]">
            {mapEnabled && viewMode === "map" ? (
              <SpotsMap
                spots={displaySpots}
                cityName={activeCity.name}
                locale={locale}
                userHereOn={hereOn}
                onUserHereError={(msg) => showToast(msg, "info")}
                overlayPosition="right"
                overlay={
                  <div className="flex items-center gap-[0.6rem]">
                    <button
                      type="button"
                      onClick={() => setHereOn((v) => !v)}
                      className="inline-flex h-9 min-h-9 items-center gap-2 rounded-full bg-white/85 px-[1.05rem] text-sm font-extrabold leading-none tracking-tight text-indigo-950 shadow-sm shadow-indigo-500/10 ring-1 ring-white/60 backdrop-blur-sm transition hover:brightness-105 active:scale-95"
                      aria-label={locale === "en" ? "You are here" : "Här är du"}
                      title={locale === "en" ? "You are here" : "Här är du"}
                    >
                      <span
                        aria-hidden
                        className={`grid h-7 w-7 place-items-center rounded-full border shadow-sm transition ${
                          hereOn
                            ? "border-sky-200/70 bg-sky-500 text-white shadow-sky-500/20"
                            : "border-indigo-200/70 bg-white/85 text-indigo-900/80"
                        }`}
                      >
                        📍
                      </span>
                      <span className="whitespace-nowrap">{locale === "en" ? "You are here" : "Här är du"}</span>
                    </button>

                    <div className="inline-flex h-9 min-h-9 max-w-[min(62vw,16rem)] items-center gap-2 rounded-full bg-white/85 px-[1.05rem] text-sm font-extrabold leading-none tracking-tight text-indigo-950 shadow-sm shadow-indigo-500/10 ring-1 ring-white/60 backdrop-blur-sm">
                      <span className="truncate">{roomTitleLive}</span>
                      <button
                        type="button"
                        onClick={() => setRenameOpen(true)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-indigo-200/70 bg-white/85 text-indigo-900/80 shadow-sm transition hover:bg-indigo-50 active:scale-95"
                        aria-label={t(locale, "rename.title")}
                        title={t(locale, "rename.title")}
                      >
                        <span aria-hidden className="text-[15px] leading-none">
                          ⚙️
                        </span>
                      </button>
                    </div>
                  </div>
                }
              />
            ) : displaySpots.length === 0 ? null : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {displaySpots.map((s) => (
                  <SpotCard
                    key={s.id}
                    roomSlug={roomSlug}
                    spot={s}
                    mapsCityName={activeCity.name}
                    locale={locale}
                    onPurge={() => removeSpot(s.id, activeCity.slug, s.category)}
                    onEdited={() => void refreshCity(activeCity.slug)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-[0.6rem] sm:gap-3">
            <Link
              href="/"
              className="y2k-chip inline-flex h-10 w-full items-center justify-center rounded-full px-3 text-center text-sm font-extrabold text-indigo-950 transition hover:-translate-y-0.5 active:scale-[0.99] sm:h-11 sm:px-4"
            >
              {t(locale, "room.actions.newMap")}
            </Link>
            <button
              type="button"
              onClick={() => void shareRoom()}
              className="y2k-chip-active inline-flex h-10 w-full items-center justify-center rounded-full px-3 text-center text-sm font-extrabold text-white transition hover:-translate-y-0.5 active:scale-[0.99] sm:h-11 sm:px-4"
            >
              {t(locale, "room.actions.shareMap")}
            </button>
          </div>

          <div className="flex justify-center pt-1">
            <div
              className="select-none bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 bg-clip-text text-[22px] font-extrabold leading-none tracking-tight text-transparent drop-shadow-[0_10px_26px_rgba(236,72,153,0.18)]"
              style={{ fontFamily: "var(--font-logo), var(--font-y2k), system-ui, sans-serif" }}
            >
              Mapsies
            </div>
          </div>
        </div>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div
            className={`pointer-events-none w-full max-w-md translate-y-0 rounded-2xl border px-4 py-3 text-sm font-extrabold shadow-2xl backdrop-blur-sm transition ${
              toast.tone === "info"
                ? "border-indigo-200/70 bg-white/80 text-indigo-950 shadow-indigo-500/10"
                : "border-emerald-200/80 bg-emerald-50/90 text-emerald-950 shadow-emerald-500/15"
            }`}
            role="status"
            aria-live="polite"
          >
            {toast.message}
          </div>
        </div>
      ) : null}

      {renameOpen ? (
        <div
          className="fixed inset-0 z-[66] flex touch-manipulation items-end justify-center bg-indigo-950/35 p-2 sm:items-center sm:p-3"
          role="dialog"
          aria-modal="true"
          aria-label={t(locale, "rename.title")}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setRenameOpen(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-indigo-200/70 bg-white/80 shadow-2xl shadow-indigo-950/25 backdrop-blur-sm sm:rounded-[1.75rem]">
            <header className="flex items-center justify-between gap-3 border-b border-indigo-200/60 bg-white/70 px-4 py-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-extrabold tracking-tight text-indigo-950">
                  {t(locale, "rename.title")}
                </h2>
                <p className="mt-0.5 text-[12px] font-bold text-indigo-900/55">
                  {t(locale, "rename.subtitle")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-indigo-200/60 bg-white/90 text-lg font-bold leading-none text-indigo-950 shadow-sm transition hover:bg-indigo-50/90"
                aria-label={t(locale, "common.close")}
              >
                ×
              </button>
            </header>

            <div className="p-3">
              <label className="block text-xs font-extrabold text-indigo-900/80">
                {locale === "en" ? "Name" : "Namn"}
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  placeholder={locale === "en" ? "e.g. Bucketlist 4 Lyfe" : "t.ex. Bucketlist 4 Lyfe"}
                  className="mt-1 w-full rounded-2xl border border-indigo-200/70 bg-white/90 px-4 py-3 text-sm font-semibold text-indigo-950 outline-none focus:ring-4 focus:ring-indigo-300/45"
                />
              </label>
              <p className="mt-1 text-[11px] font-bold text-indigo-900/45">
                {locale === "en"
                  ? `Leave empty to use the link (${roomSlug}).`
                  : <>Lämna tomt för att använda adressen (<span className="font-black">{roomSlug}</span>).</>}
              </p>
            </div>

            <div className="flex gap-2 border-t border-indigo-200/60 bg-white/60 p-3">
              <button
                type="button"
                disabled={renameBusy}
                onClick={() => void saveRoomTitle()}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-emerald-500/20 ring-1 ring-white/60 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
              >
                {renameBusy ? t(locale, "rename.saving") : t(locale, "rename.save")}
              </button>
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-indigo-200/70 bg-white/80 px-4 py-3 text-sm font-extrabold text-indigo-950 shadow-sm shadow-indigo-500/10 ring-1 ring-white/60 transition hover:brightness-105 active:scale-[0.99]"
              >
                {t(locale, "common.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {shareOpen ? (
        <div
          className="fixed inset-0 z-[65] flex touch-manipulation items-end justify-center bg-indigo-950/35 p-2 sm:items-center sm:p-3"
          role="dialog"
          aria-modal="true"
          aria-label={locale === "en" ? "Share map" : "Dela kartan"}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setShareOpen(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-indigo-200/70 bg-white/80 shadow-2xl shadow-indigo-950/25 backdrop-blur-sm sm:rounded-[1.75rem]">
            <header className="flex items-center justify-between gap-3 border-b border-indigo-200/60 bg-white/70 px-4 py-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-extrabold tracking-tight text-indigo-950">
                  {locale === "en" ? "Share map" : "Dela kartan"}
                </h2>
                <p className="mt-0.5 text-[12px] font-bold text-indigo-900/55">{t(locale, "share.copy")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-indigo-200/60 bg-white/90 text-lg font-bold leading-none text-indigo-950 shadow-sm transition hover:bg-indigo-50/90"
                aria-label={t(locale, "common.close")}
              >
                ×
              </button>
            </header>

            <div className="grid grid-cols-2 gap-2 p-3">
              <a
                href={sharePayload.sms}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-indigo-200/70 bg-white/80 px-3 py-3 text-[12px] font-extrabold text-indigo-950 shadow-sm shadow-indigo-500/10 transition hover:brightness-105 active:scale-[0.99]"
              >
                {t(locale, "share.sheet.sms")}
              </a>
              <a
                href={sharePayload.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-3 text-[12px] font-extrabold text-emerald-950 shadow-sm shadow-emerald-500/10 transition hover:brightness-105 active:scale-[0.99]"
              >
                WhatsApp
              </a>
              <a
                href={sharePayload.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-sky-200/80 bg-sky-50/70 px-3 py-3 text-[12px] font-extrabold text-sky-950 shadow-sm shadow-sky-500/10 transition hover:brightness-105 active:scale-[0.99]"
              >
                Facebook
              </a>
              <a
                href={sharePayload.mailto}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-fuchsia-200/80 bg-fuchsia-50/60 px-3 py-3 text-[12px] font-extrabold text-fuchsia-950 shadow-sm shadow-fuchsia-500/10 transition hover:brightness-105 active:scale-[0.99]"
              >
                Mail
              </a>
            </div>

            <div className="flex gap-2 border-t border-indigo-200/60 bg-white/60 p-3">
              <button
                type="button"
                onClick={() => void copyShare()}
                className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-emerald-500/20 ring-1 ring-white/60 transition hover:brightness-110 active:scale-[0.99]"
              >
                {t(locale, "share.sheet.copy")}
              </button>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-indigo-200/70 bg-white/80 px-4 py-3 text-sm font-extrabold text-indigo-950 shadow-sm shadow-indigo-500/10 ring-1 ring-white/60 transition hover:brightness-105 active:scale-[0.99]"
              >
                {t(locale, "share.sheet.close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addOpen ? (
        <div
          className="fixed inset-0 z-50 flex touch-manipulation items-end justify-center overflow-x-hidden bg-indigo-950/30 p-2 sm:items-center sm:p-3"
          role="dialog"
          aria-modal="true"
          aria-label={locale === "en" ? "Add tip" : "Lägg till tips"}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setAddOpen(false);
          }}
        >
          <div className="mb-2 flex w-full min-w-0 max-w-lg justify-center px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:mb-0 sm:px-3 sm:pb-4 sm:pt-2">
            <article className="y2k-add-modal-shell flex max-h-[min(90dvh,700px)] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-indigo-200/80 shadow-2xl shadow-indigo-950/20 sm:rounded-[1.75rem]">
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-indigo-200/50 bg-white/35 px-4 py-2.5 backdrop-blur-sm sm:px-5 sm:py-3">
                <div className="min-w-0 flex-1 pr-1">
                  <h2 className="text-[0.95rem] font-extrabold leading-tight tracking-tight text-indigo-950 sm:text-base">
                    {t(locale, "add.title")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setAddOpen(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-indigo-200/60 bg-white/90 text-lg font-bold leading-none text-indigo-950 shadow-sm backdrop-blur-sm transition hover:bg-indigo-50/90 sm:h-10 sm:w-10"
                  aria-label={t(locale, "common.close")}
                >
                  ×
                </button>
              </header>
              <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
                <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
                  <section className="min-w-0" aria-labelledby="add-modal-city-label">
                    <h3
                      id="add-modal-city-label"
                      className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-indigo-900/45"
                    >
                      {t(locale, "add.cityLabel")}
                    </h3>
                    <CityPickOrCreate
                      roomSlug={roomSlug}
                      embedded
                      cities={cityList}
                      selectedSlug={addTargetSlug}
                      locale={locale}
                      onSelectCity={(c) => {
                        setAddTargetSlug(c.slug);
                        setActiveCity(c);
                      }}
                      onCityCreated={(c) => {
                        const next = { ...c, _count: c._count ?? { spots: 0 } };
                        setCityList((prev) =>
                          [...prev.filter((x) => x.id !== next.id), next].sort((a, b) =>
                            a.name.localeCompare(b.name, "sv"),
                          ),
                        );
                        setAddTargetSlug(next.slug);
                        setActiveCity(next);
                        setBundle((prev) => ({
                          ...prev,
                          [next.slug]: prev[next.slug] ?? { spots: [], categoryCounts: {} },
                        }));
                      }}
                    />
                  </section>
                  <section
                    className="min-w-0 border-t border-indigo-100/65 pt-3 sm:pt-4"
                    aria-labelledby="add-modal-spot-label"
                  >
                    <h3
                      id="add-modal-spot-label"
                      className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-indigo-900/45"
                    >
                      {t(locale, "add.placeCategoryLabel")}
                    </h3>
                    <AddSpotForm
                      roomSlug={roomSlug}
                      embeddedInModal
                      citySlug={addTargetSlug}
                      placeSearchBiasName={addTargetCity.name}
                      locale={locale}
                      onSaved={() => {
                        void refreshCity(addTargetSlug);
                        window.setTimeout(() => setAddOpen(false), 500);
                      }}
                      onRequestClose={() => setAddOpen(false)}
                    />
                  </section>
                </div>
              </div>
            </article>
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
      className={`inline-flex h-9 min-h-9 shrink-0 items-center justify-center rounded-full px-[1.05rem] text-sm font-extrabold leading-none tracking-tight transition active:scale-95 ${
        active ? activeClass : "y2k-chip text-indigo-950 hover:-translate-y-0.5"
      }`}
    >
      {children}
    </button>
  );
}

function isInteractiveSpotTarget(el: EventTarget | null): boolean {
  if (!(el instanceof Element)) return false;
  return Boolean(el.closest("a, button, input, textarea, select, label"));
}

function SpotCard({
  roomSlug,
  spot,
  mapsCityName,
  locale,
  onPurge,
  onEdited,
}: {
  roomSlug: string;
  spot: DashboardSpot;
  mapsCityName: string;
  locale: Locale;
  onPurge: () => void;
  onEdited: () => void;
}) {
  const cat = categoryMeta(spot.category);
  const big = (spot.emoji?.trim() || cat.emoji).slice(0, 8);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(spot.name);
  const [editNeighborhood, setEditNeighborhood] = useState(spot.neighborhood ?? "");
  const [editEmoji, setEditEmoji] = useState(spot.emoji ?? "");
  const [editCategory, setEditCategory] = useState<CategoryId>(
    isCategoryId(spot.category) ? spot.category : "annat",
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [plusBusy, setPlusBusy] = useState(false);
  const [domReady, setDomReady] = useState(false);

  useEffect(() => {
    setDomReady(true);
  }, []);

  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressStartRef.current = null;
  }, []);

  useEffect(() => () => clearLongPress(), [clearLongPress]);

  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;

    const blockNativeSelect = (e: Event) => {
      const target = e.target;
      if (!(target instanceof Node) || !root.contains(target)) return;
      if (isInteractiveSpotTarget(target)) return;
      e.preventDefault();
    };

    root.addEventListener("selectstart", blockNativeSelect);
    root.addEventListener("dragstart", blockNativeSelect);
    return () => {
      root.removeEventListener("selectstart", blockNativeSelect);
      root.removeEventListener("dragstart", blockNativeSelect);
    };
  }, []);

  useEffect(() => {
    if (!menu) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  useEffect(() => {
    if (!editing) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setEditing(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editing]);

  const openMenuAt = useCallback((clientX: number, clientY: number) => {
    const pad = 10;
    const mw = 200;
    const mh = 140;
    let x = clientX - mw / 2;
    x = Math.max(pad, Math.min(x, window.innerWidth - mw - pad));
    let y = clientY - mh - 10;
    if (y < pad) {
      y = clientY + 10;
    }
    if (y + mh > window.innerHeight - pad) {
      y = window.innerHeight - mh - pad;
    }
    y = Math.max(pad, y);
    setMenu({ x, y });
  }, []);

  const openContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (menu) return;
      openMenuAt(e.clientX, e.clientY);
    },
    [menu, openMenuAt],
  );

  const beginLongPress = useCallback(
    (e: React.PointerEvent) => {
      /* Touch hanteras av dedikerade touch-listeners (pointer + touch dubbelväg ger konflikt). */
      if (e.pointerType === "touch") return;
      if (e.pointerType !== "pen") return;
      if (menu || editing) return;
      if (isInteractiveSpotTarget(e.target)) return;
      clearLongPress();
      const x = e.clientX;
      const y = e.clientY;
      longPressStartRef.current = { x, y, pointerId: e.pointerId };
      longPressTimerRef.current = window.setTimeout(() => {
        longPressTimerRef.current = null;
        longPressStartRef.current = null;
        openMenuAt(x, y);
      }, 550);
    },
    [clearLongPress, editing, menu, openMenuAt],
  );

  useEffect(() => {
    const el = articleRef.current;
    if (!el) return;

    let start: { x: number; y: number } | null = null;
    let timer: number | null = null;

    const clearTouch = () => {
      if (timer != null) {
        window.clearTimeout(timer);
        timer = null;
      }
      start = null;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (menu || editing) return;
      if (isInteractiveSpotTarget(e.target)) return;
      /* Ingen preventDefault — annars kan man inte scrolla sidan när fingret börjar på kortet. */
      clearTouch();
      const t = e.touches[0];
      if (!t) return;
      start = { x: t.clientX, y: t.clientY };
      timer = window.setTimeout(() => {
        timer = null;
        if (!start) return;
        openMenuAt(start.x, start.y);
        try {
          window.navigator.vibrate?.(12);
        } catch {
          /* ignore */
        }
      }, 480);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!start) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      if (dx * dx + dy * dy > 400) clearTouch();
    };

    const onTouchEnd = () => {
      clearTouch();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);

    return () => {
      clearTouch();
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [editing, menu, openMenuAt]);

  const onLongPressMove = useCallback(
    (e: React.PointerEvent) => {
      const st = longPressStartRef.current;
      if (!st || st.pointerId !== e.pointerId) return;
      const dx = e.clientX - st.x;
      const dy = e.clientY - st.y;
      if (dx * dx + dy * dy > 120) clearLongPress();
    },
    [clearLongPress],
  );

  const endLongPress = useCallback(
    (e: React.PointerEvent) => {
      if (longPressStartRef.current?.pointerId !== e.pointerId) return;
      clearLongPress();
    },
    [clearLongPress],
  );

  const deleteSpot = useCallback(async () => {
    if (!window.confirm(t(locale, "spots.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/spots?spotId=${encodeURIComponent(spot.id)}`, {
        method: "DELETE",
        headers: { "X-Room-Slug": roomSlug },
      });
      if (!res.ok) {
        window.alert(t(locale, "spots.deleteError"));
        return;
      }
      onPurge();
    } catch {
      window.alert(locale === "en" ? "Network error." : "Nätverksfel.");
    }
  }, [onPurge, roomSlug, spot.id, locale]);

  const openEditor = useCallback(() => {
    setMenu(null);
    setEditName(spot.name);
    setEditNeighborhood(spot.neighborhood ?? "");
    setEditEmoji(spot.emoji ?? "");
    setEditCategory(isCategoryId(spot.category) ? spot.category : "annat");
    setSaveError(null);
    setEditing(true);
  }, [spot]);

  /** 1 = nytt tips, varje anonym +1 höjer totalen. */
  const displayScore = 1 + spot.plusCount;

  const togglePlus = useCallback(async () => {
    const tok = getOrCreateVoterToken();
    if (!tok) return;
    setPlusBusy(true);
    try {
      if (spot.viewerHasPlussed) {
        const res = await fetch(`/api/spots/plus?spotId=${encodeURIComponent(spot.id)}`, {
          method: "DELETE",
          headers: {
            "X-Room-Slug": roomSlug,
            "X-Voter-Token": tok,
          },
        });
        if (!res.ok) return;
      } else {
        const res = await fetch("/api/spots/plus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Room-Slug": roomSlug,
            "X-Voter-Token": tok,
          },
          body: JSON.stringify({ spotId: spot.id }),
        });
        if (!res.ok) return;
      }
      onEdited();
    } finally {
      setPlusBusy(false);
    }
  }, [onEdited, roomSlug, spot.id, spot.viewerHasPlussed]);

  const saveEdit = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/spot-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Room-Slug": roomSlug },
        body: JSON.stringify({
          spotId: spot.id,
          name: editName.trim(),
          category: editCategory,
          emoji: editEmoji.trim() || null,
          neighborhood: editNeighborhood.trim() || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t(locale, "spots.saveError"));
      setEditing(false);
      onEdited();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Okänt fel");
    } finally {
      setSaving(false);
    }
  }, [editCategory, editEmoji, editName, editNeighborhood, onEdited, roomSlug, spot.id, locale]);

  return (
    <>
      <article
        ref={articleRef}
        className="y2k-card flex cursor-default touch-pan-y select-none items-center gap-3 rounded-2xl p-3 [-webkit-touch-callout:none] [&_*]:select-none"
        style={
          {
            WebkitUserSelect: "none",
            userSelect: "none",
            WebkitTouchCallout: "none",
          } as React.CSSProperties
        }
        onContextMenu={openContextMenu}
        onPointerDown={beginLongPress}
        onPointerMove={onLongPressMove}
        onPointerUp={endLongPress}
        onPointerCancel={endLongPress}
      >
        <div
          className="flex h-14 w-14 shrink-0 select-none items-center justify-center rounded-2xl bg-gradient-to-br from-white/90 to-fuchsia-50/80 text-[2.1rem] leading-none shadow-inner shadow-fuchsia-100"
          aria-hidden
        >
          {big}
        </div>
        <div
          className="min-w-0 flex-1 select-none"
          style={
            {
              WebkitUserSelect: "none",
              userSelect: "none",
            } as React.CSSProperties
          }
        >
          <p className="truncate text-[0.95rem] font-extrabold tracking-tight text-indigo-950">{spot.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 lg:flex-nowrap lg:gap-1.5">
            <span className="inline-flex h-8 shrink-0 select-none items-center gap-1 rounded-full border border-fuchsia-200/70 bg-white/70 px-2.5 text-[11px] font-extrabold leading-none text-indigo-900/80 lg:h-7 lg:gap-0.5 lg:px-2 lg:text-[10px]">
              <span>{cat.emoji}</span>
              <span>{t(locale, `cat.${cat.id}`)}</span>
            </span>
            <a
              className="inline-flex h-8 min-h-8 shrink-0 select-none items-center rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-2.5 text-[11px] font-extrabold leading-none text-indigo-950 shadow-sm shadow-cyan-500/20 ring-1 ring-white/60 hover:brightness-110 lg:h-7 lg:min-h-7 lg:px-2 lg:text-[10px]"
              href={mapsOpenForSpot(spot, { cityName: mapsCityName, locale })}
              target="_blank"
              rel="noopener noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              {t(locale, "room.actions.directions")}
            </a>
          </div>
        </div>
        <div className="flex min-h-14 shrink-0 select-none items-center justify-end self-center">
          <div
            className="flex h-14 w-8 shrink-0 flex-col overflow-hidden rounded-full border border-indigo-300/55 bg-indigo-50/40 text-[11px] font-extrabold leading-none lg:h-12 lg:w-7 lg:text-[10px]"
            role="group"
            aria-label={
              spot.viewerHasPlussed
                ? t(locale, "spots.pointsAria.remove").replace("{score}", String(displayScore))
                : t(locale, "spots.pointsAria.add").replace("{score}", String(displayScore))
            }
          >
            <button
              type="button"
              disabled={plusBusy}
              aria-label={
                spot.viewerHasPlussed ? t(locale, "spots.plusAria.remove") : t(locale, "spots.plusAria.add")
              }
              className={`flex flex-1 items-center justify-center transition active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 ${
                spot.viewerHasPlussed
                  ? "bg-gradient-to-b from-indigo-300/75 to-violet-400/70 text-indigo-950 hover:brightness-95"
                  : "bg-gradient-to-b from-indigo-400/65 to-violet-500/60 text-white hover:brightness-105"
              }`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                void togglePlus();
              }}
            >
              {spot.viewerHasPlussed ? "✓" : "+1"}
            </button>
            <div className="flex h-7 items-center justify-center gap-0.5 border-t border-indigo-300/50 bg-indigo-50/95 px-0.5 text-indigo-950 tabular-nums lg:h-6">
              <span aria-hidden className="leading-none">
                🙋
              </span>
              <span className="tabular-nums">{displayScore}</span>
            </div>
          </div>
        </div>
      </article>
      {domReady && menu
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[4998] cursor-default border-0 bg-indigo-950/35 p-0"
                aria-label={t(locale, "spots.menu.close")}
                onClick={() => setMenu(null)}
              />
              <div
                role="menu"
                aria-label="Åtgärder för tips"
                className="fixed z-[5000] min-w-[12.5rem] overflow-visible rounded-xl border border-indigo-200/80 bg-white py-1.5 text-sm font-extrabold shadow-xl ring-1 ring-indigo-950/15"
                style={{ left: menu.x, top: menu.y }}
              >
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-4 py-2.5 text-left text-indigo-950 hover:bg-indigo-50 active:bg-indigo-100"
                  style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenu(null);
                    openEditor();
                  }}
                >
                  {t(locale, "spots.menu.edit")}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="block w-full px-4 py-2.5 text-left text-rose-800 hover:bg-rose-50 active:bg-rose-100"
                  style={{ WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenu(null);
                    void deleteSpot();
                  }}
                >
                  {t(locale, "spots.menu.delete")}
                </button>
              </div>
            </>,
            document.body,
          )
        : null}

      {domReady && editing
        ? createPortal(
            <div
              className="fixed inset-0 z-[420] flex touch-manipulation items-end justify-center overflow-x-hidden bg-indigo-950/45 p-2 sm:items-center sm:p-3"
              role="dialog"
              aria-modal="true"
              aria-label={t(locale, "edit.title")}
              onPointerDown={(e) => {
                if (e.target === e.currentTarget) setEditing(false);
              }}
            >
              <div
                className="y2k-panel max-h-[min(88dvh,560px)] w-full min-w-0 max-w-[min(100vw-1rem,28rem)] overflow-y-auto overflow-x-hidden rounded-[1.75rem] p-4 sm:p-5"
                onPointerDown={(e) => e.stopPropagation()}
              >
            <div className="mb-4 flex items-center justify-between gap-2">
              <p className="text-sm font-extrabold tracking-tight text-indigo-950">{t(locale, "edit.title")}</p>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/70 text-lg font-bold text-indigo-950 shadow-sm hover:bg-white"
                aria-label="Stäng"
                onClick={() => setEditing(false)}
              >
                ×
              </button>
            </div>
            <label className="mb-3 block text-xs font-extrabold text-indigo-900/80">
              {locale === "en" ? "Name" : "Namn"}
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-fuchsia-200/70 bg-white/90 px-3 py-2.5 text-sm font-semibold text-indigo-950 outline-none focus:ring-4 focus:ring-fuchsia-300/50"
              />
            </label>
            <label className="mb-3 block text-xs font-extrabold text-indigo-900/80">
              {locale === "en" ? "Area (optional)" : "Område (valfritt)"}
              <input
                value={editNeighborhood}
                onChange={(e) => setEditNeighborhood(e.target.value)}
                placeholder={locale === "en" ? "e.g. Downtown" : "t.ex. Södermalm"}
                className="mt-1 w-full rounded-2xl border border-fuchsia-200/70 bg-white/90 px-3 py-2.5 text-sm font-semibold text-indigo-950 outline-none focus:ring-4 focus:ring-fuchsia-300/50"
              />
            </label>
            <label className="mb-3 block text-xs font-extrabold text-indigo-900/80">
              {locale === "en" ? "Emoji (optional)" : "Emoji (valfritt)"}
              <input
                value={editEmoji}
                onChange={(e) => setEditEmoji(e.target.value)}
                maxLength={8}
                className="mt-1 w-full max-w-[5rem] rounded-2xl border border-sky-200/70 bg-white/90 py-2 text-center text-2xl outline-none focus:ring-4 focus:ring-sky-300/50"
              />
            </label>
            <p className="mb-2 text-xs font-extrabold text-indigo-900/80">{t(locale, "edit.categoryLabel")}</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {(CATEGORIES as readonly { id: CategoryId; label: string; emoji: string }[]).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setEditCategory(c.id)}
                  className={`rounded-full px-3 py-2 text-xs font-extrabold tracking-tight transition active:scale-[0.98] ${
                    editCategory === c.id ? "y2k-chip-active" : "y2k-chip text-indigo-950 hover:-translate-y-0.5"
                  }`}
                >
                  <span className="mr-1">{c.emoji}</span>
                  {t(locale, `cat.${c.id}`)}
                </button>
              ))}
            </div>
            {saveError ? (
              <p className="mb-3 text-xs font-bold text-rose-600">{saveError}</p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={saving || !editName.trim()}
                onClick={() => void saveEdit()}
                className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2.5 text-sm font-extrabold text-white transition enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? t(locale, "add.saving") : t(locale, "add.save")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditing(false)}
                className="rounded-full border border-indigo-200/80 bg-white px-5 py-2.5 text-sm font-extrabold text-indigo-950 hover:bg-indigo-50"
              >
                {locale === "en" ? "Cancel" : "Avbryt"}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
        : null}
    </>
  );
}
