import { getPosition } from "suncalc";

/** Kompassriktning mot solen: 0 = norr, ökar medurs (öster = π/2). */
export function bearingTowardSunRad(lat: number, lng: number, when: Date): number {
  const { azimuth } = getPosition(when, lat, lng);
  let b = Math.PI + azimuth;
  const twoPi = Math.PI * 2;
  b = ((b % twoPi) + twoPi) % twoPi;
  return b;
}

export function sunAltitudeRad(lat: number, lng: number, when: Date): number {
  return getPosition(when, lat, lng).altitude;
}

/** Snittpunkt för stråle från (cx,cy) i riktning (dirX, dirY) mot rektangeln [0,w]×[0,h]. */
export function rayRectExit(
  cx: number,
  cy: number,
  dirX: number,
  dirY: number,
  w: number,
  h: number,
): { x: number; y: number } {
  const len = Math.hypot(dirX, dirY) || 1;
  const ux = dirX / len;
  const uy = dirY / len;
  const eps = 1e-9;
  let tMin = Infinity;
  const tryT = (t: number) => {
    if (t > eps) tMin = Math.min(tMin, t);
  };
  if (Math.abs(ux) > eps) {
    tryT((0 - cx) / ux);
    tryT((w - cx) / ux);
  }
  if (Math.abs(uy) > eps) {
    tryT((0 - cy) / uy);
    tryT((h - cy) / uy);
  }
  const t = tMin === Infinity ? 0 : tMin;
  return { x: cx + t * ux, y: cy + t * uy };
}

function angularDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** Hitta tid samma lokala kalenderdag som `anchor` där solens azimuth (suncalc) är närmast `targetAzimuth`. */
export function findTimeNearestSunAzimuth(
  lat: number,
  lng: number,
  anchor: Date,
  targetAzimuth: number,
): Date {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  const msDay = 86_400_000;
  const n = 320;
  let best = start;
  let bestD = Infinity;
  for (let i = 0; i <= n; i++) {
    const t = new Date(start.getTime() + (msDay * i) / n);
    const az = getPosition(t, lat, lng).azimuth;
    const d = angularDiff(az, targetAzimuth);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  const span = 20 * 60_000;
  for (let delta = -span; delta <= span; delta += 60_000) {
    const t = new Date(best.getTime() + delta);
    const az = getPosition(t, lat, lng).azimuth;
    const d = angularDiff(az, targetAzimuth);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}

/** Pekbäring från centrum mot (px,py): 0 = norr, medurs. */
export function bearingFromPixelKnob(cx: number, cy: number, px: number, py: number): number {
  const dx = px - cx;
  const dy = py - cy;
  let b = Math.atan2(dx, -dy);
  const twoPi = Math.PI * 2;
  b = ((b % twoPi) + twoPi) % twoPi;
  return b;
}
