/** Opens Google Maps directions using a place id (legacy). */
export function mapsDirectionsUrl(googlePlaceId: string) {
  const id = encodeURIComponent(googlePlaceId.replace(/^places\//, "").trim());
  return `https://www.google.com/maps/dir/?api=1&destination_place_id=${id}`;
}

/** Opens Google Maps search using a place id (legacy). */
export function mapsPlaceUrl(googlePlaceId: string) {
  const id = encodeURIComponent(googlePlaceId.replace(/^places\//, "").trim());
  return `https://www.google.com/maps/search/?api=1&query_place_id=${id}`;
}

type SpotForMaps = {
  googlePlaceId: string;
  name: string;
  lat?: number | null;
  lng?: number | null;
};

export type MapsContext = {
  /** Active tab city; appended after the card title for clearer search. */
  cityName?: string;
};

function sanitizeMapsQuery(raw: string): string {
  return raw
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

/**
 * Opens Google Maps in a new tab with a plain text search = card title (+ city).
 * Uses the documented URL shape so the native Maps app can open the link reliably.
 * @see https://developers.google.com/maps/documentation/urls/get-started#search-action
 */
export function mapsOpenForSpot(spot: SpotForMaps, ctx?: MapsContext): string {
  const city = ctx?.cityName?.trim();
  const joined = [spot.name.trim(), city].filter(Boolean).join(" ").trim() || spot.name.trim();
  const query = sanitizeMapsQuery(joined) || sanitizeMapsQuery(spot.name) || "Google Maps";
  const encoded = encodeURIComponent(query);
  return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
}
