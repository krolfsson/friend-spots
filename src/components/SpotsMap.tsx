"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardSpot } from "@/lib/dashboardTypes";
import { categoryMeta } from "@/lib/categories";
import { mapsOpenForSpot } from "@/lib/mapsUrl";

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

function buildEmojiMarkerIcon(
  emoji: string,
  cache: Map<string, google.maps.Icon>,
): google.maps.Icon {
  const hit = cache.get(emoji);
  if (hit) return hit;
  const size = 44;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-opacity="0.3"/></filter></defs><circle cx="${size / 2}" cy="${size / 2}" r="16.5" fill="#ffffff" stroke="#4f46e5" stroke-width="2" filter="url(#s)"/><text x="${size / 2}" y="${size / 2}" font-size="20" text-anchor="middle" dominant-baseline="central" font-family="system-ui,&quot;Apple Color Emoji&quot;,&quot;Segoe UI Emoji&quot;,&quot;Noto Color Emoji&quot;,sans-serif">${escapeSvgText(emoji)}</text></svg>`;
  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  const icon: google.maps.Icon = {
    url,
    scaledSize: new google.maps.Size(size, size),
    anchor: new google.maps.Point(size / 2, size / 2),
  };
  cache.set(emoji, icon);
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
  overlayLabel,
  onOverlayClick,
}: {
  spots: DashboardSpot[];
  cityName: string;
  overlayLabel?: string;
  onOverlayClick?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
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

        iw = new google.maps.InfoWindow();
        const emojiIconCache = new Map<string, google.maps.Icon>();

        for (const spot of plotted) {
          if (cancelled) return;
          const marker = new google.maps.Marker({
            map,
            position: { lat: spot.lat!, lng: spot.lng! },
            title: spot.name,
            icon: buildEmojiMarkerIcon(spotMapEmoji(spot), emojiIconCache),
          });
          marker.addListener("click", () => {
            if (!map || !iw) return;
            const url = mapsOpenForSpot(spot, { cityName });
            const wrap = document.createElement("div");
            wrap.className = "p-2 max-w-[220px]";
            const titleEl = document.createElement("div");
            titleEl.className =
              "mb-1.5 text-sm font-extrabold leading-snug text-indigo-950";
            titleEl.textContent = spot.name;
            const a = document.createElement("a");
            a.href = url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.className = "text-xs font-bold text-fuchsia-700 underline";
            a.textContent = "Öppna i Hitta";
            wrap.append(titleEl, a);
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
    };
  }, [apiKey, cityName, plotted]);

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
        {overlayLabel && onOverlayClick ? (
          <button
            type="button"
            onClick={onOverlayClick}
            className="absolute left-2 top-2 z-20 inline-flex h-9 min-h-9 items-center justify-center rounded-full bg-white/85 px-3.5 text-sm font-extrabold leading-none tracking-tight text-indigo-950 shadow-sm shadow-indigo-500/10 ring-1 ring-white/60 backdrop-blur-sm transition hover:brightness-105 active:scale-95"
            aria-label={overlayLabel}
          >
            {overlayLabel}
          </button>
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
