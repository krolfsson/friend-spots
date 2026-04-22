import { getPosition } from "suncalc";

/**
 * True om solen är över horisonten vid denna plats, för ett givet ögonblick.
 * `when` ska vara t.ex. `new Date()` (samma ögonblick som i användarens lokala klocka).
 */
export function isSunUpAtSpot(lat: number, lng: number, when: Date = new Date()): boolean {
  const { altitude } = getPosition(when, lat, lng);
  return altitude > 0;
}
