import {
  bearingFromPixelKnob,
  bearingTowardSunRad,
  findTimeNearestSunAzimuth,
  rayRectExit,
  sunAltitudeRad,
} from "@/lib/sunMapMath";

function mapInstance(
  m: google.maps.Map | google.maps.StreetViewPanorama | null | undefined,
): google.maps.Map | null {
  if (!m || typeof (m as google.maps.Map).getDiv !== "function") return null;
  return m as google.maps.Map;
}

export type MapSunAtmosphereOptions = {
  getWhen: () => Date;
  getCenterLatLng: () => google.maps.LatLng | null;
  onSeekTime: (d: Date) => void;
  onResetLive: () => void;
  locale: "sv" | "en";
};

/**
 * Skugga under markörer (overlayLayer) + dragsol ovanpå (floatPane).
 */
export class MapSunAtmosphereOverlay extends google.maps.OverlayView {
  private readonly shadowDiv: HTMLDivElement;
  private readonly knobWrap: HTMLDivElement;
  private opts: MapSunAtmosphereOptions;
  private dragActive = false;
  private seekRaf = 0;
  private lastMoveEv: PointerEvent | null = null;

  constructor(opts: MapSunAtmosphereOptions) {
    super();
    this.opts = opts;

    this.shadowDiv = document.createElement("div");
    this.shadowDiv.style.cssText =
      "position:absolute;left:0;top:0;pointer-events:none;transition:opacity 0.45s ease;";
    this.shadowDiv.setAttribute("aria-hidden", "true");

    this.knobWrap = document.createElement("div");
    this.knobWrap.style.cssText =
      "position:absolute;width:44px;height:44px;margin:-22px 0 0 -22px;pointer-events:auto;touch-action:none;cursor:grab;display:grid;place-items:center;z-index:3;";
    this.knobWrap.innerHTML = `<div style="width:38px;height:38px;border-radius:9999px;background:linear-gradient(145deg,#fde68a,#f59e0b);box-shadow:0 2px 10px rgba(0,0,0,0.28),inset 0 1px 0 rgba(255,255,255,0.65);border:2px solid rgba(255,255,255,0.9);font-size:20px;line-height:1;display:grid;place-items:center;user-select:none;">☀️</div>`;
    const title =
      opts.locale === "en"
        ? "Drag around the map edge to change time of day. Double-click for live clock."
        : "Dra längs kartkanten för att ändra tid på dygnet. Dubbelklick för live-klocka.";
    this.knobWrap.title = title;
    this.knobWrap.setAttribute("aria-label", title);

    this.knobWrap.addEventListener("pointerdown", this.onKnobPointerDown);
    this.knobWrap.addEventListener("dblclick", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.opts.onResetLive();
    });
  }

  setOptions(opts: MapSunAtmosphereOptions) {
    this.opts = opts;
    this.knobWrap.title =
      opts.locale === "en"
        ? "Drag around the map edge to change time of day. Double-click for live clock."
        : "Dra längs kartkanten för att ändra tid på dygnet. Dubbelklick för live-klocka.";
  }

  onAdd(): void {
    const panes = this.getPanes();
    if (!panes?.overlayLayer || !panes.floatPane) return;
    panes.overlayLayer.appendChild(this.shadowDiv);
    panes.floatPane.appendChild(this.knobWrap);
  }

  onRemove(): void {
    this.shadowDiv.remove();
    this.knobWrap.remove();
    this.stopDrag();
  }

  /** Anropas när klockan ändrats utifrån (t.ex. varje sekund live). */
  refresh(): void {
    if (this.dragActive) return;
    this.draw();
  }

  draw(): void {
    const map = mapInstance(this.getMap());
    const proj = this.getProjection();
    if (!map || !proj) return;
    const center = this.opts.getCenterLatLng() ?? map.getCenter();
    if (!center) return;

    const lat = center.lat();
    const lng = center.lng();
    const when = this.opts.getWhen();
    const b = bearingTowardSunRad(lat, lng, when);
    const alt = sunAltitudeRad(lat, lng, when);

    const mapDiv = map.getDiv();
    const W = mapDiv.clientWidth;
    const H = mapDiv.clientHeight;
    const pc = proj.fromLatLngToDivPixel(center);
    if (!pc) return;

    const dirX = Math.sin(b);
    const dirY = -Math.cos(b);
    const edge = rayRectExit(pc.x, pc.y, dirX, dirY, W, H);
    this.knobWrap.style.left = `${edge.x}px`;
    this.knobWrap.style.top = `${edge.y}px`;

    const shadowDeg = (b * 180) / Math.PI + 180;
    const day = alt > 0;
    const baseA = day ? 0.1 + Math.min(0.14, Math.cos(alt) * 0.08) : 0.26;
    const tintA = day ? 0 : 0.08;
    this.shadowDiv.style.left = "0px";
    this.shadowDiv.style.top = "0px";
    this.shadowDiv.style.width = `${W}px`;
    this.shadowDiv.style.height = `${H}px`;
    this.shadowDiv.style.background = [
      `linear-gradient(${shadowDeg}deg, rgba(15,23,42,${baseA}) 0%, transparent 56%)`,
      day ? "" : `linear-gradient(180deg, rgba(30,58,138,${tintA}) 0%, transparent 45%)`,
    ]
      .filter(Boolean)
      .join(",");
  }

  private onKnobPointerDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    this.dragActive = true;
    this.knobWrap.style.cursor = "grabbing";
    try {
      this.knobWrap.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    window.addEventListener("pointermove", this.onWindowPointerMove);
    window.addEventListener("pointerup", this.onWindowPointerUp, { capture: true });
    window.addEventListener("pointercancel", this.onWindowPointerUp, { capture: true });
  };

  private onWindowPointerMove = (e: PointerEvent) => {
    if (!this.dragActive) return;
    this.lastMoveEv = e;
    if (this.seekRaf) return;
    this.seekRaf = requestAnimationFrame(() => {
      this.seekRaf = 0;
      const ev = this.lastMoveEv;
      if (!ev || !this.dragActive) return;
      const map = mapInstance(this.getMap());
      if (!map) return;
      const rect = map.getDiv().getBoundingClientRect();
      const px = ev.clientX - rect.left;
      const py = ev.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const bearing = bearingFromPixelKnob(cx, cy, px, py);
      const targetAz = bearing - Math.PI;
      const center = this.opts.getCenterLatLng() ?? map.getCenter();
      if (!center) return;
      const next = findTimeNearestSunAzimuth(center.lat(), center.lng(), this.opts.getWhen(), targetAz);
      this.opts.onSeekTime(next);
    });
  };

  private onWindowPointerUp = () => {
    this.stopDrag();
    this.draw();
  };

  private stopDrag() {
    if (this.seekRaf) {
      cancelAnimationFrame(this.seekRaf);
      this.seekRaf = 0;
    }
    this.lastMoveEv = null;
    this.dragActive = false;
    this.knobWrap.style.cursor = "grab";
    window.removeEventListener("pointermove", this.onWindowPointerMove);
    window.removeEventListener("pointerup", this.onWindowPointerUp, { capture: true });
    window.removeEventListener("pointercancel", this.onWindowPointerUp, { capture: true });
  }
}
