"use client";

import { getPosition } from "suncalc";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/** Innerstad — bra för 3D-byggnader i MapTiler. */
const STOCKHOLM = { lng: 18.0719, lat: 59.3251 };

function mapTilerKey(): string {
  return (
    process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim() ||
    process.env.NEXT_PUBLIC_MAPTILER_API_KEY?.trim() ||
    ""
  );
}

/** Kompass mot solen: 0 = norr, medurs. */
function bearingTowardSunRad(lat: number, lng: number, when: Date): number {
  const { azimuth } = getPosition(when, lat, lng);
  const b = Math.PI + azimuth;
  const twoPi = Math.PI * 2;
  return ((b % twoPi) + twoPi) % twoPi;
}

function shadowOverlayStyle(when: Date): { background: string; opacity: number } {
  const { altitude } = getPosition(when, STOCKHOLM.lat, STOCKHOLM.lng);
  const b = bearingTowardSunRad(STOCKHOLM.lat, STOCKHOLM.lng, when);
  const shadowDeg = (b * 180) / Math.PI + 180;
  const day = altitude > 0;
  const baseA = day ? 0.12 + Math.min(0.14, Math.cos(altitude) * 0.08) : 0.28;
  const background = [
    `linear-gradient(${shadowDeg}deg, rgba(15,23,42,${baseA}) 0%, transparent 58%)`,
    day ? "" : `linear-gradient(180deg, rgba(30,58,138,0.1) 0%, transparent 45%)`,
  ]
    .filter(Boolean)
    .join(",");
  return { background, opacity: 1 };
}

export function StockholmShadowDemo() {
  const key = useMemo(() => mapTilerKey(), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [sliderMin, setSliderMin] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });
  const when = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setMinutes(sliderMin);
    return d;
  }, [sliderMin]);
  const overlay = useMemo(() => shadowOverlayStyle(when), [when]);
  const sun = useMemo(() => getPosition(when, STOCKHOLM.lat, STOCKHOLM.lng), [when]);

  const tryAddBuildings = useCallback((map: maplibregl.Map) => {
    if (map.getLayer("demo-3d-buildings")) return;
    const style = map.getStyle();
    const sourceIds = Object.keys(style.sources ?? {}).filter((id) => {
      const s = style.sources![id];
      return s.type === "vector";
    });
    for (const sourceId of sourceIds) {
      try {
        const before =
          map.getStyle().layers?.find((l) => l.type === "symbol" && !l.id.includes("building"))?.id;
        map.addLayer(
          {
            id: "demo-3d-buildings",
            type: "fill-extrusion",
            source: sourceId,
            "source-layer": "building",
            minzoom: 13,
            paint: {
              "fill-extrusion-color": "#d1d5db",
              "fill-extrusion-height": ["coalesce", ["get", "render_height"], ["get", "height"], 12],
              "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
              "fill-extrusion-opacity": 0.92,
            },
          },
          before,
        );
        return;
      } catch {
        /* nästa källa */
      }
    }
  }, []);

  useEffect(() => {
    if (!key || !containerRef.current) return;
    let cancelled = false;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(key)}`,
      center: [STOCKHOLM.lng, STOCKHOLM.lat],
      zoom: 15.2,
      pitch: 58,
      bearing: -25,
      maxPitch: 85,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");

    const onLoad = () => {
      if (cancelled) return;
      tryAddBuildings(map);
      map.resize();
    };
    map.on("load", onLoad);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      cancelled = true;
      ro.disconnect();
      map.off("load", onLoad);
      map.remove();
      mapRef.current = null;
    };
  }, [key, tryAddBuildings]);

  const timeLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("sv-SE", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(when),
    [when],
  );

  if (!key) {
    return (
      <div className="flex min-h-dvh flex-col gap-4 bg-indigo-950 p-6 text-white">
        <h1 className="text-xl font-extrabold tracking-tight">Stockholm 3D (demo)</h1>
        <p className="max-w-lg text-sm font-bold text-indigo-100/90">
          Sätt en gratis MapTiler-nyckel i miljön och deploya/bygg om, t.ex. i{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">.env.local</code>:
        </p>
        <pre className="overflow-x-auto rounded-2xl border border-white/15 bg-black/30 p-4 text-xs font-mono text-indigo-50">
          NEXT_PUBLIC_MAPTILER_KEY=din_nyckel_här
        </pre>
        <p className="text-sm font-bold text-indigo-100/80">
          Skapa nyckel på{" "}
          <a className="text-amber-200 underline hover:text-amber-100" href="https://cloud.maptiler.com/">
            cloud.maptiler.com
          </a>{" "}
          (gratis nivå räcker för test).
        </p>
      </div>
    );
  }

  const altDeg = (sun.altitude * 180) / Math.PI;
  const sunUp = sun.altitude > 0;

  return (
    <div className="flex h-dvh min-h-0 flex-col bg-indigo-950 text-indigo-950">
      <header className="shrink-0 border-b border-white/10 bg-indigo-950 px-4 py-3 text-white">
        <h1 className="text-base font-extrabold tracking-tight">Stockholm · 3D + skuggriktning (demo)</h1>
        <p className="mt-1 text-xs font-bold text-indigo-100/85">
          Byggnader från MapTiler. Skugggradienten följer solen (suncalc) — inte riktiga kastskuggor per hus som Hint,
          men samma idé för snabb test.
        </p>
      </header>

      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="absolute inset-0" />
        <div
          className="pointer-events-none absolute inset-0 z-10 transition-[background,opacity] duration-300"
          style={overlay}
          aria-hidden
        />
      </div>

      <footer className="shrink-0 border-t border-white/10 bg-indigo-900/95 px-4 py-3 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.35)]">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-indigo-100/90">
            <span className="tabular-nums">Tid (lokal dator): {timeLabel}</span>
            <span className="tabular-nums">
              Sol: {sunUp ? `${altDeg.toFixed(1)}° över horisonten` : `under horisonten (${altDeg.toFixed(1)}°)`}
            </span>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-indigo-200/90">
              Dra — minuter från midnatt idag (0–1439)
            </span>
            <input
              type="range"
              min={0}
              max={1439}
              value={sliderMin}
              onChange={(e) => setSliderMin(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
          </label>
        </div>
      </footer>
    </div>
  );
}
