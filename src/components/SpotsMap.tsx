"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardSpot } from "@/lib/dashboardTypes";
import { categoryMeta } from "@/lib/categories";
import { t, type Locale } from "@/lib/i18n";
import { mapsOpenForSpot } from "@/lib/mapsUrl";
import { getOrCreateVoterToken } from "@/lib/voterClient";

const DEFAULT_CENTER = { lat: 59.33, lng: 18.07 };

/** Samma emoji som i listan: egen emoji eller kategorins standard. */
function spotMapEmoji(spot: DashboardSpot): string {
  const cat = categoryMeta(spot.category);
  return (spot.emoji?.trim() || cat.emoji).slice(0, 8);
}

function escapeSvgText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Samma poäng som i listan: 1 bas + antal plussar. */
function spotDisplayScore(spot: DashboardSpot): number {
  return 1 + spot.plusCount;
}

function buildSpotMarkerIcon(
  emoji: string,
  score: number,
  cache: Map<string, google.maps.Icon>,
): google.maps.Icon {
  const scoreLabel = score > 99 ? "99+" : String(score);
  const cacheKey = `${emoji}\0${scoreLabel}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const size = 38;
  const mainCx = 18;
  const mainCy = 18;
  const mainR = 12.5;
  const emojiFont = 15;
  const badgeCx = 28.5;
  const badgeCy = 25.5;
  const badgeR = scoreLabel.length > 2 ? 8.8 : 7.6;
  const badgeFont = scoreLabel.length > 2 ? 7.5 : 9;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><filter id="s" x="-35%" y="-35%" width="170%" height="170%"><feDropShadow dx="0" dy="1" stdDeviation="1.2" flood-opacity="0.28"/></filter></defs><circle cx="${mainCx}" cy="${mainCy}" r="${mainR}" fill="#ffffff" stroke="#4f46e5" stroke-width="1.75" filter="url(#s)"/><text x="${mainCx}" y="${mainCy}" font-size="${emojiFont}" text-anchor="middle" dominant-baseline="central" font-family="system-ui,&quot;Apple Color Emoji&quot;,&quot;Segoe UI Emoji&quot;,&quot;Noto Color Emoji&quot;,sans-serif">${escapeSvgText(emoji)}</text><circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR}" fill="#10b981" stroke="#ffffff" stroke-width="1.75"/><text x="${badgeCx}" y="${badgeCy}" font-size="${badgeFont}" font-weight="800" text-anchor="middle" dominant-baseline="central" fill="#ffffff" font-family="system-ui,ui-sans-serif,sans-serif">${escapeSvgText(scoreLabel)}</text></svg>`;
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  const icon: google.maps.Icon = {
    url,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(mainCx, mainCy),
  };
  cache.set(cacheKey, icon);
  return icon;
}

function hasCoords(s: DashboardSpot): boolean {
  return (
    s.lat != null && s.lng != null && !Number.isNaN(s.lat) && !Number.isNaN(s.lng)
  );
}

function describeMapLoadError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("ApiNotActivatedMapError") || msg.includes("ApiNotActivated")) {
    return "Maps JavaScript API är inte aktiverat för den här nyckeln. Aktivera det i Google Cloud → APIs → Maps JavaScript API.";
  }
  if (msg.includes("RefererNotAllowedMapError") || msg.includes("referer")) {
    return "Nyckeln tillåter inte den här webbplatsen. I Google Cloud → Credentials → din nyckel → Application restrictions → HTTP referrers: lägg till https://friend-spots.vercel.app/* och ev. https://*.vercel.app/*";
  }
  if (msg.includes("InvalidKeyMapError") || msg.includes("InvalidKey")) {
    return "Ogiltig API-nyckel. Kontrollera NEXT_PUBLIC_GOOGLE_MAPS_API_KEY i Vercel (om du just lade till den: gör en ny deploy så värdet följer med i bygget).";
  }
  if (msg.includes("BillingNotEnabled") || msg.includes("billing")) {
    return "Fakturering är inte påslagen för Google Maps-projektet. Aktivera billing i Google Cloud.";
  }
  return msg || "Kunde inte ladda Google Maps.";
}

export function isMapViewConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());
}

export function SpotsMap({
  spots,
  cityName,
  locale = "sv",
  roomSlug,
  userHereOn = false,
  onUserHereError,
  overlay,
}: {
  spots: DashboardSpot[];
  cityName: string;
  locale?: Locale;
  roomSlug: string;
  userHereOn?: boolean;
  onUserHereError?: (message: string) => void;
  /** Lägg t.ex. vänster knapp + höger kolumn som syskon — raden är `justify-between`. */
  overlay?: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const hereMarkerRef = useRef<google.maps.Marker | null>(null);
  const hereCircleRef = useRef<google.maps.Circle | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const didCenterHereRef = useRef(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";

  const plotted = useMemo(() => spots.filter(hasCoords), [spots]);
  const missingCount = spots.length - plotted.length;

  useEffect(() => {
    if (!apiKey) {
      setLoadError(
        "Sätt NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (samma nyckel som kan ha Maps JavaScript API aktiverat).",
      );
      setLoading(false);
      return;
    }

    let cancelled = false;
    const markers: google.maps.Marker[] = [];
    let map: google.maps.Map | null = null;
    let iw: google.maps.InfoWindow | null = null;

    setLoading(true);
    setLoadError(null);

    void (async () => {
      try {
        setOptions({ key: apiKey, v: "weekly" });
        await importLibrary("maps");
        if (cancelled || !containerRef.current) return;

        map = new google.maps.Map(containerRef.current, {
          center: DEFAULT_CENTER,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          gestureHandling: "greedy",
        });
        mapRef.current = map;

        iw = new google.maps.InfoWindow();
        const emojiIconCache = new Map<string, google.maps.Icon>();

        for (const spot of plotted) {
          if (cancelled) return;
          const marker = new google.maps.Marker({
            map,
            position: { lat: spot.lat!, lng: spot.lng! },
            title: spot.name,
            icon: buildSpotMarkerIcon(spotMapEmoji(spot), spotDisplayScore(spot), emojiIconCache),
          });
          marker.addListener("click", () => {
            if (!map || !iw) return;
            const url = mapsOpenForSpot(spot, { cityName, locale });
            const wrap = document.createElement("div");
            wrap.className = "p-0 max-w-[220px]";

            const card = document.createElement("div");
            card.className =
              "rounded-2xl bg-white/95 px-3.5 py-3 shadow-lg shadow-indigo-900/10";

            const titleEl = document.createElement("div");
            titleEl.className =
              "text-[15px] font-extrabold leading-snug tracking-tight text-indigo-950";
            titleEl.textContent = spot.name;

            const meta = document.createElement("div");
            meta.className = "mt-1 text-[12px] font-bold text-indigo-900/55";
            const parts: string[] = [];
            const nb = spot.neighborhood?.trim();
            if (nb) parts.push(nb);
            const cat = categoryMeta(spot.category);
            parts.push(`${cat.emoji} ${t(locale, `cat.${cat.id}`)}`);
            meta.textContent = parts.join(" · ");
            if (!meta.textContent) meta.style.display = "none";

            const actions = document.createElement("div");
            actions.className = "mt-3 flex items-center gap-2";

            // Local state inside this InfoWindow instance:
            let viewerHasPlussed = Boolean(spot.viewerHasPlussed);
            let plusCount = spot.plusCount;

            const plusWrap = document.createElement("button");
            plusWrap.type = "button";
            plusWrap.className =
              "ui-press inline-flex h-9 items-stretch overflow-hidden rounded-full border border-emerald-200/70 bg-white/90 text-[12px] font-extrabold leading-none text-emerald-950 shadow-sm shadow-emerald-500/10 ring-1 ring-white/70";

            const plusLeft = document.createElement("span");
            plusLeft.className =
              "inline-flex min-w-[3.4rem] items-center justify-center bg-gradient-to-b from-emerald-400 to-teal-500 px-3 text-white";

            const plusRight = document.createElement("span");
            plusRight.className =
              "inline-flex items-center justify-center gap-1 bg-emerald-50/80 px-3 text-emerald-950 tabular-nums";

            const plusEmoji = document.createElement("span");
            plusEmoji.setAttribute("aria-hidden", "true");
            plusEmoji.textContent = "👍";

            const plusNum = document.createElement("span");

            const setPlusUi = () => {
              plusLeft.textContent = viewerHasPlussed ? "✓" : "+1";
              plusNum.textContent = String(1 + plusCount);
            };
            setPlusUi();

            plusRight.append(plusEmoji, plusNum);
            plusWrap.append(plusLeft, plusRight);

            // Prevent clicks from bubbling to the map (Google listens aggressively).
            for (const ev of ["pointerdown", "mousedown", "touchstart", "click"] as const) {
              plusWrap.addEventListener(ev, (e) => {
                e.stopPropagation();
              });
            }

            plusWrap.addEventListener("click", async (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (plusWrap.disabled) return;
              plusWrap.disabled = true;
              try {
                const tok = getOrCreateVoterToken();
                const isUndo = viewerHasPlussed;
                const endpoint = isUndo
                  ? `/api/spots/plus?spotId=${encodeURIComponent(spot.id)}`
                  : "/api/spots/plus";

                const res = await fetch(endpoint, {
                  method: isUndo ? "DELETE" : "POST",
                  headers: isUndo
                    ? { "X-Room-Slug": roomSlug, "X-Voter-Token": tok }
                    : {
                        "Content-Type": "application/json",
                        "X-Room-Slug": roomSlug,
                        "X-Voter-Token": tok,
                      },
                  ...(isUndo ? {} : { body: JSON.stringify({ spotId: spot.id }) }),
                });
                const data = (await res.json().catch(() => ({}))) as {
                  plusCount?: number;
                  viewerHasPlussed?: boolean;
                };
                if (!res.ok) throw new Error("plus_failed");
                if (typeof data.plusCount === "number") plusCount = data.plusCount;
                if (typeof data.viewerHasPlussed === "boolean") viewerHasPlussed = data.viewerHasPlussed;
                else viewerHasPlussed = !isUndo;

                setPlusUi();
                marker.setIcon(
                  buildSpotMarkerIcon(spotMapEmoji(spot), 1 + plusCount, emojiIconCache),
                );
              } finally {
                plusWrap.disabled = false;
              }
            });

            const a = document.createElement("a");
            a.href = url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.className =
              "inline-flex h-9 items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 text-[12px] font-extrabold text-white shadow-sm shadow-fuchsia-500/15 ring-1 ring-white/70 transition hover:brightness-110 active:scale-[0.99]";
            a.textContent = locale === "en" ? "Directions" : "Hitta";

            for (const ev of ["pointerdown", "mousedown", "touchstart", "click"] as const) {
              a.addEventListener(ev, (e) => e.stopPropagation());
            }

            actions.append(plusWrap, a);
            card.append(titleEl, meta, actions);
            wrap.append(card);
            iw.setContent(wrap);
            iw.open({ map, anchor: marker });
          });
          markers.push(marker);
        }

        google.maps.event.addListenerOnce(map, "idle", () => {
          if (cancelled || !map) return;
          if (plotted.length === 0) {
            map.setCenter(DEFAULT_CENTER);
            map.setZoom(11);
          } else if (plotted.length === 1) {
            map.setCenter({ lat: plotted[0].lat!, lng: plotted[0].lng! });
            map.setZoom(14);
          } else {
            const bounds = new google.maps.LatLngBounds();
            plotted.forEach((s) => bounds.extend({ lat: s.lat!, lng: s.lng! }));
            map.fitBounds(bounds, 64);
          }
          if (!cancelled) setLoading(false);
        });
      } catch (e) {
        if (!cancelled) {
          setLoadError(describeMapLoadError(e));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      markers.forEach((m) => m.setMap(null));
      iw?.close();
      mapRef.current = null;
    };
  }, [apiKey, cityName, plotted, locale]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function clearWatch() {
      if (watchIdRef.current != null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      hereMarkerRef.current?.setMap(null);
      hereMarkerRef.current = null;
      hereCircleRef.current?.setMap(null);
      hereCircleRef.current = null;
      didCenterHereRef.current = false;
    }

    if (!userHereOn) {
      clearWatch();
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      onUserHereError?.(locale === "en" ? "Location not available in this browser." : "Plats är inte tillgänglig i den här webbläsaren.");
      return;
    }

    // Create marker/circle lazily on first position update.
    const dotSymbol: google.maps.Symbol = {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: "#3b82f6",
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeOpacity: 1,
      strokeWeight: 3,
      scale: 6.5,
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = Math.max(0, pos.coords.accuracy ?? 0);
        const center = { lat, lng };

        if (!hereMarkerRef.current) {
          hereMarkerRef.current = new google.maps.Marker({
            map,
            position: center,
            icon: dotSymbol,
            zIndex: 99999,
            clickable: false,
          });
        } else {
          hereMarkerRef.current.setPosition(center);
        }

        if (!hereCircleRef.current) {
          hereCircleRef.current = new google.maps.Circle({
            map,
            center,
            radius: acc,
            strokeColor: "#60a5fa",
            strokeOpacity: 0.55,
            strokeWeight: 2,
            fillColor: "#60a5fa",
            fillOpacity: 0.18,
            clickable: false,
          });
        } else {
          hereCircleRef.current.setCenter(center);
          hereCircleRef.current.setRadius(acc);
        }

        // Center once when toggled on; after that keep updating marker/ring only.
        if (!didCenterHereRef.current) {
          didCenterHereRef.current = true;
          map.panTo(center);
        }
      },
      () => {
        onUserHereError?.(
          locale === "en"
            ? "Location permission denied."
            : "Platsdelning nekades.",
        );
        clearWatch();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10_000,
        timeout: 10_000,
      },
    );

    return () => clearWatch();
  }, [userHereOn, locale, onUserHereError]);

  if (!apiKey) {
    return (
      <p className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm font-bold text-amber-950">
        Kartvy kräver{" "}
        <code className="rounded bg-white/80 px-1 py-0.5 text-xs">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </code>{" "}
        i miljön (aktivera Maps JavaScript API för nyckeln).
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {loadError ? (
        <p className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm font-bold text-rose-900">
          {loadError}
        </p>
      ) : null}
      {missingCount > 0 ? (
        <p className="text-xs font-bold text-indigo-900/55">
          {missingCount} ställe{missingCount === 1 ? "" : "n"} saknar koordinat och
          visas inte på kartan.
        </p>
      ) : null}
      <div className="relative h-[min(420px,55dvh)] w-full overflow-hidden rounded-2xl border border-indigo-200/70 bg-indigo-50/30 shadow-inner shadow-indigo-100/80">
        {loading && !loadError ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-50/80 text-sm font-bold text-indigo-900/70">
            Laddar karta…
          </div>
        ) : null}
        {overlay ? (
          <div className="pointer-events-none absolute inset-x-2 top-2 z-20 flex items-start justify-between gap-2">
            {overlay}
          </div>
        ) : null}
        <div
          ref={containerRef}
          className="h-full w-full"
          role="application"
          aria-label="Karta med tips"
        />
      </div>
    </div>
  );
}
