"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { createPortal } from "react-dom";
import { AddSpotForm } from "@/components/AddSpotForm";
import { CreateRoomModal } from "@/components/CreateRoomModal";
import { QrModal } from "@/components/QrModal";
import { CityPickOrCreate } from "@/components/CityPickOrCreate";
import {
  CATEGORIES,
  categoryMeta,
  isCategoryId,
  primaryCategoryId,
  sanitizeCategoryIds,
  type CategoryId,
} from "@/lib/categories";
import type { DashboardBySlug, DashboardSpot } from "@/lib/dashboardTypes";
import { mapsOpenForSpot } from "@/lib/mapsUrl";
import { getOrCreateVoterToken } from "@/lib/voterClient";
import { isMapViewConfigured } from "@/lib/mapEnv";
import { sortSpotsByCreatedAtNewestFirst } from "@/lib/sortSpots";

const SpotsMap = dynamic(
  () => import("@/components/SpotsMap").then((m) => m.SpotsMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-full min-h-[12rem] w-full flex-1 items-center justify-center rounded-2xl border border-indigo-200/70 bg-indigo-50/40 text-sm font-bold text-indigo-900/60"
        role="status"
        aria-live="polite"
      >
        Laddar karta…
      </div>
    ),
  },
);

type City = { id: string; name: string; slug: string; emoji?: string | null; _count?: { spots: number } };

type ToastTone = "success" | "info";

const NEW_TIP_PILL_BASE =
  "pointer-events-auto inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 pl-2.5 pr-3.5 text-sm font-extrabold leading-none tracking-tight text-white shadow-lg shadow-emerald-700/20 ring-1 ring-white/50 transition hover:brightness-110 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200/90";

/** Samma plus-ikon som i Nytt tips-pillen (stroke). */
function NewTipPlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M12 7v10M7 12h10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NewTipPillButton({
  locale,
  onClick,
  /** Mobil: samma bredd som tredelstogglen (listvy under header). */
  fullWidthMaxSm = false,
}: {
  locale: Locale;
  onClick: () => void;
  fullWidthMaxSm?: boolean;
}) {
  const widthCls = fullWidthMaxSm
    ? "w-full max-w-none shrink-0 justify-center sm:w-auto sm:max-w-[min(100%,20rem)] sm:justify-start"
    : "max-w-[min(100%,20rem)] shrink-0";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${NEW_TIP_PILL_BASE} ${widthCls}`}
      aria-label={t(locale, "add.title")}
    >
      <span
        className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/40 bg-white/15"
        aria-hidden
      >
        <NewTipPlusIcon />
      </span>
      <span className="min-w-0 truncate">{t(locale, "add.title")}</span>
    </button>
  );
}

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

type RoomViewSegment = "map" | "popular" | "recent";

const ROOM_VIEW_SEGMENTS: {
  id: RoomViewSegment;
  emoji: string;
  labelKey: "room.view.map" | "room.view.list" | "room.view.latest";
}[] = [
  { id: "map", emoji: "🗺️", labelKey: "room.view.map" },
  { id: "popular", emoji: "🥇", labelKey: "room.view.list" },
  { id: "recent", emoji: "🆕", labelKey: "room.view.latest" },
];

function RoomViewSegmentedToggle({
  locale,
  viewMode,
  listSort,
  onSegment,
}: {
  locale: Locale;
  viewMode: "list" | "map";
  listSort: "popular" | "recent";
  onSegment: (s: RoomViewSegment) => void;
}) {
  const segment: RoomViewSegment =
    viewMode === "map" ? "map" : listSort === "popular" ? "popular" : "recent";

  const activeIndex = ROOM_VIEW_SEGMENTS.findIndex((s) => s.id === segment);

  return (
    <div
      className="relative flex w-full min-w-0 max-w-full rounded-full border border-indigo-200/45 bg-gradient-to-b from-white/22 to-violet-50/14 p-0.5 shadow-sm shadow-indigo-900/[0.05] backdrop-blur-sm sm:max-w-md"
      role="tablist"
      aria-label={locale === "en" ? "View mode" : "Vy"}
    >
      {/* Sliding active pill — translate % is relative to this element’s width (one third of track). */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[2px] top-[2px] bottom-[2px] z-0 w-[calc((100%-4px)/3)] rounded-full y2k-chip-sky-active shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(calc(${Math.max(0, activeIndex)} * 100%))` }}
      />
      {ROOM_VIEW_SEGMENTS.map(({ id, emoji, labelKey }) => {
        const active = segment === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            className={`relative z-10 flex h-9 min-h-9 min-w-0 flex-1 items-center justify-center gap-1 rounded-full px-1.5 text-sm font-extrabold leading-none tracking-tight transition-colors sm:gap-1.5 sm:px-2 ${
              active
                ? "text-white"
                : "text-indigo-900/72 hover:bg-white/30 hover:text-indigo-950"
            } focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent`}
            onClick={() => onSegment(id)}
          >
            <span aria-hidden className="shrink-0">
              {emoji}
            </span>
            <span className="min-w-0 truncate">{t(locale, labelKey)}</span>
          </button>
        );
      })}
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
  // Track slugs whose data arrived via SSR so we can skip the initial client refetch.
  const ssrSlugsRef = useRef(new Set(Object.keys(dashboard)));

  const categoryItems = CATEGORIES as readonly { id: CategoryId; label: string; emoji: string }[];
  const [addOpen, setAddOpen] = useState(false);
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
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
  /** Ordning i listvy: popularitet (server) eller nyast först. */
  const [listSort, setListSort] = useState<"popular" | "recent">("popular");
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone?: ToastTone } | null>(null);
  const mapEnabled = isMapViewConfigured();

  // City edit (long-press on city tab)
  const [editCityTarget, setEditCityTarget] = useState<City | null>(null);
  const [editCityName, setEditCityName] = useState("");
  const [editCityEmoji, setEditCityEmoji] = useState("");
  const [editCityBusy, setEditCityBusy] = useState(false);
  const [editCityErr, setEditCityErr] = useState<string | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onRoomViewSegment = useCallback((s: RoomViewSegment) => {
    if (s === "map") {
      setViewMode("map");
      return;
    }
    setViewMode("list");
    setListSort(s === "popular" ? "popular" : "recent");
  }, []);

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

  const categoryCounts = useMemo(
    () => bundle[activeCity.slug]?.categoryCounts ?? {},
    [bundle, activeCity.slug],
  );

  const filteredByCategory = useMemo(() => {
    if (category === "alla") return baseSpots;
    if (!isCategoryId(category)) return baseSpots;
    return baseSpots.filter((s) => s.categories.includes(category));
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

  const spotsForListView = useMemo(() => {
    if (listSort !== "recent") return displaySpots;
    return [...displaySpots].sort(sortSpotsByCreatedAtNewestFirst);
  }, [displaySpots, listSort]);

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
    // Skip the first client fetch when SSR already provided fresh data for this city.
    // Subsequent visits to the same city (ssrSlugsRef cleared) will refetch normally.
    if (ssrSlugsRef.current.delete(activeCity.slug)) {
      return () => ctrl.abort();
    }
    void refreshCity(activeCity.slug, ctrl.signal);
    return () => ctrl.abort();
  }, [activeCity.slug, refreshCity]);

  const showToast = useCallback((message: string, tone: ToastTone = "success") => {
    setToast({ message, tone });
  }, []);

  /**
   * Anropas av SpotsMap efter lyckad plus/unplus på kartan.
   * Uppdaterar bundle optimistiskt utan att kartan återskapas eller laddas om.
   */
  const handleMapPlusToggled = useCallback(
    (spotId: string, newPlusCount: number, viewerHasPlussed: boolean) => {
      setBundle((prev) => {
        const city = prev[activeCity.slug];
        if (!city) return prev;
        return {
          ...prev,
          [activeCity.slug]: {
            ...city,
            spots: city.spots.map((s) =>
              s.id === spotId ? { ...s, plusCount: newPlusCount, viewerHasPlussed } : s,
            ),
          },
        };
      });
    },
    [activeCity.slug],
  );

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

  const removeSpot = useCallback((spotId: string, slug: string, spotCategories: string[]) => {
    setBundle((prev) => {
      const b = prev[slug];
      if (!b) return prev;
      const nextSpots = b.spots.filter((s) => s.id !== spotId);
      const nextCounts = { ...b.categoryCounts };
      for (const catId of sanitizeCategoryIds(spotCategories)) {
        const cur = nextCounts[catId] ?? 0;
        if (cur <= 1) delete nextCounts[catId];
        else nextCounts[catId] = cur - 1;
      }
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

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function openCityEdit(c: City) {
    setEditCityTarget(c);
    setEditCityName(c.name);
    setEditCityEmoji(c.emoji?.trim() ?? "");
    setEditCityErr(null);
    setEditCityBusy(false);
  }

  function closeCityEdit() {
    setEditCityTarget(null);
    setEditCityErr(null);
  }

  async function saveCityEdit() {
    if (!editCityTarget || editCityBusy) return;
    setEditCityBusy(true);
    setEditCityErr(null);
    try {
      const res = await fetch("/api/cities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Room-Slug": roomSlug },
        body: JSON.stringify({
          cityId: editCityTarget.id,
          name: editCityName.trim() || editCityTarget.name,
          emoji: editCityEmoji,
        }),
      });
      const data = (await res.json()) as { city?: City; error?: string };
      if (!res.ok) throw new Error(data.error ?? t(locale, "room.city.editError"));
      const updated = data.city;
      if (!updated) throw new Error(t(locale, "room.city.editError"));
      setCityList((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      if (activeCity.id === updated.id) setActiveCity(updated);
      closeCityEdit();
      showToast(t(locale, "rename.successToast"), "success");
    } catch (e) {
      setEditCityErr(e instanceof Error ? e.message : t(locale, "room.city.editError"));
    } finally {
      setEditCityBusy(false);
    }
  }

  function cityLongPressStart(c: City) {
    longPressTimerRef.current = setTimeout(() => {
      openCityEdit(c);
    }, 500);
  }

  function cityLongPressCancel() {
    if (longPressTimerRef.current !== null) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }

  const mapScrollShell =
    mapEnabled && viewMode === "map"
      ? "flex min-h-0 flex-1 flex-col overflow-hidden overscroll-y-contain"
      : "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain";

  return (
    <div className="mapsies-body-bg mapsies-room-chrome-y relative mx-auto flex h-dvh max-h-dvh w-full max-w-5xl flex-col overflow-hidden px-[0.96rem] xl:max-w-7xl 2xl:max-w-[min(100%,88rem)]">
      <div className="relative z-40 shrink-0">
        {/* En gemensam gradient-yta för alla chip-rader — annars repeteras radialerna per rad och ger “randiga” band. */}
        <div className="mapsies-body-bg relative space-y-[0.6rem] pb-[0.6rem]">
            <FadingHorizontalChips rowClassName="py-0">
              {cityList.map((c) => {
                const active = c.slug === activeCity.slug;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCity(c)}
                    onPointerDown={() => cityLongPressStart(c)}
                    onPointerUp={cityLongPressCancel}
                    onPointerLeave={cityLongPressCancel}
                    onContextMenu={(e) => { e.preventDefault(); openCityEdit(c); }}
                    className={`pointer-events-auto inline-flex h-9 min-h-9 shrink-0 items-center justify-center gap-[0.45rem] rounded-full px-[0.84rem] text-sm font-extrabold leading-none tracking-tight transition active:scale-95 ${
                      active ? "y2k-chip-active text-white" : "y2k-chip text-indigo-950 hover:-translate-y-0.5"
                    }`}
                  >
                    <span aria-hidden>{c.emoji?.trim() || "🌃"}</span>
                    <span className="max-w-[11rem] truncate">{c.name}</span>
                  </button>
                );
              })}
            </FadingHorizontalChips>

            <div className="flex flex-col gap-[0.6rem]">
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
            </div>

            {mapEnabled ? (
              <div className="w-full">
                <div className="flex w-full flex-col gap-[0.6rem] sm:flex-row sm:items-center sm:gap-[0.6rem]">
                  <div className="min-w-0 w-full max-w-md sm:flex-1">
                    <RoomViewSegmentedToggle
                      locale={locale}
                      viewMode={viewMode}
                      listSort={listSort}
                      onSegment={onRoomViewSegment}
                    />
                  </div>
                  {viewMode === "list" ? (
                    <div className="w-full sm:w-auto sm:shrink-0">
                      <NewTipPillButton
                        fullWidthMaxSm
                        locale={locale}
                        onClick={() => {
                          setAddTargetSlug(activeCity.slug);
                          setAddOpen(true);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="hidden w-full sm:block sm:w-auto sm:shrink-0">
                      <NewTipPillButton
                        locale={locale}
                        onClick={() => {
                          setAddTargetSlug(activeCity.slug);
                          setAddOpen(true);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <NewTipPillButton
                  locale={locale}
                  onClick={() => {
                    setAddTargetSlug(activeCity.slug);
                    setAddOpen(true);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {error ? (
          <p className="shrink-0 rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-2 text-sm font-bold text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col gap-[0.6rem] overflow-hidden">
          <div className={mapScrollShell}>
            <div
              className={
                mapEnabled && viewMode === "map"
                  ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                  : "min-h-0 flex-1"
              }
            >
              {mapEnabled && viewMode === "map" ? (
                <SpotsMap
                  fillHeight
                  spots={displaySpots}
                  boundsFallbackSpots={baseSpots}
                  cityName={activeCity.name}
                  locale={locale}
                  roomSlug={roomSlug}
                  userHereOn={hereOn}
                  onUserHereError={(msg) => showToast(msg, "info")}
                  onPlusToggled={handleMapPlusToggled}
                  overlay={
                  <>
                    <div className="pointer-events-auto sm:hidden">
                      <NewTipPillButton
                        locale={locale}
                        onClick={() => {
                          setAddTargetSlug(activeCity.slug);
                          setAddOpen(true);
                        }}
                      />
                    </div>
                    <div className="pointer-events-auto flex min-w-0 flex-col items-end gap-[0.6rem]">
                      <div className="inline-flex h-9 min-h-9 max-w-[min(70vw,18rem)] items-center gap-2 rounded-full bg-white/85 px-[0.84rem] text-sm font-extrabold leading-none tracking-tight text-indigo-950 shadow-sm shadow-indigo-500/10 ring-1 ring-white/60 backdrop-blur-sm">
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

                      <button
                        type="button"
                        onClick={() => setHereOn((v) => !v)}
                        className="inline-flex h-9 min-h-9 flex-row items-center gap-2 rounded-full bg-white/85 px-[0.84rem] text-sm font-extrabold leading-none tracking-tight text-indigo-950 shadow-sm shadow-indigo-500/10 ring-1 ring-white/60 backdrop-blur-sm transition hover:brightness-105 active:scale-95"
                        aria-label={locale === "en" ? "You are here" : "Här är du"}
                        title={locale === "en" ? "You are here" : "Här är du"}
                      >
                        <span className="whitespace-nowrap">
                          {locale === "en" ? "You are here" : "Här är du"}
                        </span>
                        <span
                          aria-hidden
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border shadow-sm transition ${
                            hereOn
                              ? "border-sky-200/70 bg-sky-500 text-white shadow-sky-500/20"
                              : "border-indigo-200/70 bg-white/85 text-indigo-900/80"
                          }`}
                        >
                          📍
                        </span>
                      </button>
                    </div>
                  </>
                }
                />
              ) : displaySpots.length === 0 ? null : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {spotsForListView.map((s) => (
                    <SpotCard
                      key={s.id}
                      roomSlug={roomSlug}
                      spot={s}
                      mapsCityName={activeCity.name}
                      locale={locale}
                      onPurge={() => removeSpot(s.id, activeCity.slug, s.categories)}
                      onEdited={() => void refreshCity(activeCity.slug)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 space-y-[0.6rem]">
          <div className="grid grid-cols-2 gap-[0.6rem] sm:gap-3">
            <button
              type="button"
              onClick={() => setCreateRoomOpen(true)}
              className="mapsies-room-bar-cta touch-manipulation inline-flex h-10 w-full cursor-default items-center justify-center gap-2 overflow-hidden rounded-full border border-amber-300/90 bg-gradient-to-r from-amber-200/92 via-amber-100/96 to-amber-50/94 px-[0.55rem] text-center text-sm font-extrabold text-amber-950 shadow-sm shadow-amber-900/12 hover:brightness-[1.05] sm:h-11 sm:px-[0.75rem]"
            >
              <span
                className="grid h-7 w-7 shrink-0 cursor-default place-items-center rounded-full border border-amber-400/55 bg-amber-50/95 text-amber-950 shadow-sm shadow-amber-900/8"
                aria-hidden
              >
                <NewTipPlusIcon />
              </span>
              <span className="min-w-0 cursor-default truncate">{t(locale, "room.actions.newMap")}</span>
            </button>
            <button
              type="button"
              onClick={() => void shareRoom()}
              className="mapsies-room-bar-cta touch-manipulation inline-flex h-10 w-full cursor-default items-center justify-center gap-2 overflow-hidden rounded-full border border-sky-300/88 bg-gradient-to-r from-sky-200/90 via-sky-100/95 to-indigo-100/92 px-[0.55rem] text-center text-sm font-extrabold text-indigo-950 shadow-sm shadow-sky-600/12 hover:brightness-[1.05] sm:h-11 sm:px-[0.75rem]"
            >
              <span
                className="grid h-7 w-7 shrink-0 cursor-default place-items-center rounded-full border border-sky-400/50 bg-sky-50/95 text-[15px] leading-none shadow-sm shadow-sky-600/10"
                aria-hidden
              >
                ✈️
              </span>
              <span className="min-w-0 cursor-default truncate">{t(locale, "room.actions.shareMap")}</span>
            </button>
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
                className="ui-press grid h-9 w-9 shrink-0 place-items-center rounded-full border border-indigo-200/60 bg-white/90 text-lg leading-none shadow-sm transition hover:bg-indigo-50/90"
                aria-label={t(locale, "common.close")}
              >
                <span aria-hidden>❌</span>
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
                className="ui-press inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-emerald-500/20 ring-1 ring-white/60 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
              >
                {renameBusy ? t(locale, "rename.saving") : t(locale, "rename.save")}
              </button>
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="ui-press inline-flex min-h-11 items-center justify-center rounded-2xl border border-indigo-200/70 bg-white/80 px-4 py-3 text-sm font-extrabold text-indigo-950 shadow-sm shadow-indigo-500/10 ring-1 ring-white/60 transition hover:brightness-105 active:scale-[0.99]"
              >
                {t(locale, "common.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editCityTarget ? (
        <div
          className="fixed inset-0 z-[67] flex touch-manipulation items-end justify-center bg-indigo-950/35 p-2 sm:items-center sm:p-3"
          role="dialog"
          aria-modal="true"
          aria-label={t(locale, "room.city.editTitle")}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) closeCityEdit();
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-indigo-200/70 bg-white/80 shadow-2xl shadow-indigo-950/25 backdrop-blur-sm sm:rounded-[1.75rem]">
            <header className="flex items-center justify-between gap-3 border-b border-indigo-200/60 bg-white/70 px-4 py-3">
              <h2 className="truncate text-sm font-extrabold tracking-tight text-indigo-950">
                {t(locale, "room.city.editTitle")}
              </h2>
              <button
                type="button"
                onClick={closeCityEdit}
                className="ui-press grid h-9 w-9 shrink-0 place-items-center rounded-full border border-indigo-200/60 bg-white/90 text-lg leading-none shadow-sm transition hover:bg-indigo-50/90"
                aria-label={t(locale, "common.close")}
              >
                <span aria-hidden>❌</span>
              </button>
            </header>

            <div className="space-y-2 p-3">
              <div className="flex min-w-0 items-center gap-2">
                <input
                  value={editCityName}
                  onChange={(e) => setEditCityName(e.target.value)}
                  placeholder={t(locale, "room.city.editNamePlaceholder")}
                  className="mt-1 min-w-0 flex-1 rounded-2xl border border-indigo-200/70 bg-white/90 px-4 py-3 text-sm font-semibold text-indigo-950 outline-none focus:ring-4 focus:ring-indigo-300/45"
                />
                <input
                  value={editCityEmoji}
                  onChange={(e) => setEditCityEmoji(e.target.value)}
                  maxLength={8}
                  placeholder={t(locale, "room.city.editEmojiPlaceholder")}
                  className="mt-1 h-[46px] w-[46px] shrink-0 rounded-2xl border border-sky-200/70 bg-white/90 text-center text-xl leading-none text-indigo-950 shadow-inner shadow-sky-100/80 outline-none placeholder:text-indigo-900/35 focus:ring-2 focus:ring-sky-300/55"
                />
              </div>
              {editCityErr ? (
                <p className="text-xs font-bold text-rose-600">{editCityErr}</p>
              ) : null}
            </div>

            <div className="flex gap-2 border-t border-indigo-200/60 bg-white/60 p-3">
              <button
                type="button"
                disabled={editCityBusy || !editCityName.trim()}
                onClick={() => void saveCityEdit()}
                className="ui-press inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm ring-1 ring-white/60 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
              >
                {editCityBusy ? t(locale, "room.city.editSaving") : t(locale, "room.city.editSave")}
              </button>
              <button
                type="button"
                onClick={closeCityEdit}
                className="ui-press inline-flex min-h-11 items-center justify-center rounded-2xl border border-indigo-200/70 bg-white/80 px-4 py-3 text-sm font-extrabold text-indigo-950 shadow-sm ring-1 ring-white/60 transition hover:brightness-105 active:scale-[0.99]"
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
          aria-label={t(locale, "room.actions.shareMap")}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) setShareOpen(false);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-indigo-200/70 bg-white/80 shadow-2xl shadow-indigo-950/25 backdrop-blur-sm sm:rounded-[1.75rem]">
            <header className="flex items-center justify-between gap-3 border-b border-indigo-200/60 bg-white/70 px-4 py-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-sm font-extrabold tracking-tight text-indigo-950">
                  {t(locale, "room.actions.shareMap")}
                </h2>
                <p className="mt-0.5 text-[12px] font-bold text-indigo-900/55">{t(locale, "share.copy")}</p>
              </div>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="ui-press grid h-9 w-9 shrink-0 place-items-center rounded-full border border-indigo-200/60 bg-white/90 text-lg leading-none shadow-sm transition hover:bg-indigo-50/90"
                aria-label={t(locale, "common.close")}
              >
                <span aria-hidden>❌</span>
              </button>
            </header>

            <div className="grid grid-cols-2 gap-2 p-3">
              <a
                href={sharePayload.sms}
                className="ui-press inline-flex min-h-11 items-center justify-center rounded-2xl border border-indigo-200/70 bg-white/80 px-3 py-3 text-[12px] font-extrabold text-indigo-950 shadow-sm shadow-indigo-500/10 transition hover:brightness-105 active:scale-[0.99]"
              >
                {t(locale, "share.sheet.sms")}
              </a>
              <a
                href={sharePayload.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-press inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-3 text-[12px] font-extrabold text-emerald-950 shadow-sm shadow-emerald-500/10 transition hover:brightness-105 active:scale-[0.99]"
              >
                WhatsApp
              </a>
              <a
                href={sharePayload.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="ui-press inline-flex min-h-11 items-center justify-center rounded-2xl border border-sky-200/80 bg-sky-50/70 px-3 py-3 text-[12px] font-extrabold text-sky-950 shadow-sm shadow-sky-500/10 transition hover:brightness-105 active:scale-[0.99]"
              >
                Facebook
              </a>
              <a
                href={sharePayload.mailto}
                className="ui-press inline-flex min-h-11 items-center justify-center rounded-2xl border border-fuchsia-200/80 bg-fuchsia-50/60 px-3 py-3 text-[12px] font-extrabold text-fuchsia-950 shadow-sm shadow-fuchsia-500/10 transition hover:brightness-105 active:scale-[0.99]"
              >
                Mail
              </a>
            </div>

            <div className="flex gap-2 border-t border-indigo-200/60 bg-white/60 p-3">
              <button
                type="button"
                onClick={() => void copyShare()}
                className="ui-press inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-3 text-sm font-extrabold text-white shadow-sm shadow-emerald-500/20 ring-1 ring-white/60 transition hover:brightness-110 active:scale-[0.99]"
              >
                {t(locale, "share.sheet.copy")}
              </button>
              <button
                type="button"
                onClick={() => { setShareOpen(false); setQrOpen(true); }}
                className="ui-press inline-flex min-h-11 items-center justify-center gap-1.5 rounded-2xl border border-violet-200/80 bg-violet-50/70 px-4 py-3 text-sm font-extrabold text-violet-950 shadow-sm shadow-violet-500/10 ring-1 ring-white/60 transition hover:brightness-105 active:scale-[0.99]"
                title="Visa QR-kod"
              >
                <span aria-hidden>⬛</span> QR
              </button>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="ui-press inline-flex min-h-11 items-center justify-center rounded-2xl border border-indigo-200/70 bg-white/80 px-4 py-3 text-sm font-extrabold text-indigo-950 shadow-sm shadow-indigo-500/10 ring-1 ring-white/60 transition hover:brightness-105 active:scale-[0.99]"
              >
                {t(locale, "share.sheet.close")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {qrOpen ? (
        <QrModal
          url={sharePayload.url}
          title={roomTitleLive.trim() || roomSlug}
          onClose={() => setQrOpen(false)}
        />
      ) : null}

      {createRoomOpen ? (
        <CreateRoomModal locale={locale} onClose={() => setCreateRoomOpen(false)} />
      ) : null}

      {addOpen ? (
        <div
          className="fixed inset-0 z-50 flex touch-manipulation items-end justify-center overflow-x-hidden bg-indigo-950/30 p-2 sm:items-center sm:p-3"
          role="dialog"
          aria-modal="true"
          aria-label={t(locale, "add.title")}
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
                  className="ui-press grid h-9 w-9 shrink-0 place-items-center rounded-full border border-indigo-200/60 bg-white/90 text-lg leading-none shadow-sm backdrop-blur-sm transition hover:bg-indigo-50/90 sm:h-10 sm:w-10"
                  aria-label={t(locale, "common.close")}
                >
                  <span aria-hidden>❌</span>
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
      ? "y2k-chip-active text-white"
      : tone === "muted"
        ? "y2k-chip-active-muted text-white"
        : "y2k-chip-active text-white";

  const inactiveClass = "y2k-chip text-indigo-950 hover:-translate-y-0.5";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 min-h-9 shrink-0 items-center justify-center rounded-full px-[0.84rem] text-sm font-extrabold leading-none tracking-tight transition active:scale-95 ${
        active ? activeClass : inactiveClass
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
  const primaryCat = primaryCategoryId(spot.categories);
  const cat = categoryMeta(primaryCat);
  const big = (spot.emoji?.trim() || cat.emoji).slice(0, 8);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(spot.name);
  const [editNeighborhood, setEditNeighborhood] = useState(spot.neighborhood ?? "");
  const [editEmoji, setEditEmoji] = useState(spot.emoji ?? "");
  const [editCategories, setEditCategories] = useState<Set<CategoryId>>(
    () => new Set(sanitizeCategoryIds(spot.categories)),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [plusBusy, setPlusBusy] = useState(false);
  const [domReady, setDomReady] = useState(false);

  useEffect(() => {
    setDomReady(true);
  }, []);

  useEffect(() => {
    if (!editing) {
      setEditCategories(new Set(sanitizeCategoryIds(spot.categories)));
    }
  }, [spot.categories, spot.id, editing]);

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

  const openActionsMenuFromAnchor = useCallback(
    (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      openMenuAt(r.left + r.width / 2, r.bottom);
    },
    [openMenuAt],
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
    setEditCategories(new Set(sanitizeCategoryIds(spot.categories)));
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
          categories: Array.from(editCategories),
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
  }, [editCategories, editEmoji, editName, editNeighborhood, onEdited, roomSlug, spot.id, locale]);

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
      >
        <div
          className="flex h-14 w-14 shrink-0 select-none items-center justify-center rounded-2xl bg-[#ede9fe] text-[2.1rem] leading-none shadow-inner shadow-violet-300/50 ring-1 ring-violet-300/55"
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
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {sanitizeCategoryIds(spot.categories).map((cid) => {
              const c = categoryMeta(cid);
              return (
                <span
                  key={cid}
                  className="inline-flex h-[1.4rem] min-h-[1.4rem] shrink-0 select-none items-center gap-0.5 rounded-full border border-fuchsia-200/70 bg-white/70 px-[7px] text-[8px] font-extrabold leading-none text-indigo-900/80"
                >
                  <span className="text-[0.65rem] leading-none">{c.emoji}</span>
                  <span>{t(locale, `cat.${c.id}`)}</span>
                </span>
              );
            })}
            <div className="flex shrink-0 items-center gap-1">
              <a
                className="inline-flex h-[1.4rem] min-h-[1.4rem] shrink-0 select-none items-center rounded-full bg-gradient-to-r from-sky-400 to-cyan-400 px-[7px] text-[8px] font-extrabold leading-none text-indigo-950 shadow-sm shadow-cyan-500/20 ring-1 ring-white/60 hover:brightness-110"
                href={mapsOpenForSpot(spot, { cityName: mapsCityName, locale })}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {t(locale, "room.actions.directions")}
              </a>
              <button
                type="button"
                className="grid h-[1.4rem] w-[1.4rem] shrink-0 select-none place-items-center rounded-full border border-indigo-200/70 bg-white/85 text-[11px] leading-none text-indigo-900/85 shadow-sm ring-1 ring-white/55 transition hover:bg-indigo-50/90 active:scale-95"
                aria-label={t(locale, "spots.actionsMenuAria")}
                aria-haspopup="menu"
                aria-expanded={Boolean(menu)}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  if (menu) {
                    setMenu(null);
                    return;
                  }
                  openActionsMenuFromAnchor(e.currentTarget);
                }}
              >
                <span aria-hidden>⚙️</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex min-h-14 shrink-0 select-none items-center justify-end self-center">
          <div
            className="flex h-14 w-8 shrink-0 flex-col overflow-hidden rounded-full border border-emerald-300/60 bg-emerald-50/50 text-[11px] font-extrabold leading-none lg:h-12 lg:w-7 lg:text-[10px]"
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
                  ? "bg-gradient-to-b from-teal-600 to-emerald-700 text-white shadow-inner shadow-emerald-900/20 hover:brightness-110"
                  : "bg-gradient-to-b from-emerald-400 to-teal-500 text-white shadow-inner shadow-emerald-600/25 hover:brightness-105"
              }`}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                void togglePlus();
              }}
            >
              {spot.viewerHasPlussed ? "✓" : "+1"}
            </button>
            <div className="flex h-7 items-center justify-center gap-0.5 border-t border-emerald-300/55 bg-emerald-50/95 px-0.5 text-emerald-950 tabular-nums lg:h-6">
              <span aria-hidden className="leading-none">
                👍
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
                className="ui-press grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/70 text-lg leading-none shadow-sm hover:bg-white"
                aria-label="Stäng"
                onClick={() => setEditing(false)}
              >
                <span aria-hidden>❌</span>
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
                  onClick={() => {
                    setEditCategories((prev) => {
                      const n = new Set(prev);
                      if (n.has(c.id)) {
                        if (n.size <= 1) return n;
                        n.delete(c.id);
                      } else {
                        n.add(c.id);
                      }
                      return n;
                    });
                  }}
                  className={`ui-press rounded-full px-3 py-2 text-xs font-extrabold tracking-tight transition active:scale-[0.98] ${
                    editCategories.has(c.id) ? "y2k-chip-active" : "y2k-chip text-indigo-950 hover:-translate-y-0.5"
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
                disabled={saving || !editName.trim() || editCategories.size === 0}
                onClick={() => void saveEdit()}
                className="ui-press rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2.5 text-sm font-extrabold text-white transition enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? t(locale, "add.saving") : t(locale, "add.save")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setEditing(false)}
                className="ui-press rounded-full border border-indigo-200/80 bg-white px-5 py-2.5 text-sm font-extrabold text-indigo-950 hover:bg-indigo-50"
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
