/** Öppnar Google Maps med vägbeskrivning till platsen (externt). */
export function mapsDirectionsUrl(googlePlaceId: string) {
  const id = encodeURIComponent(googlePlaceId);
  return `https://www.google.com/maps/dir/?api=1&destination_place_id=${id}`;
}

/** Alternativ: sök/platskort (om du föredrar det). */
export function mapsPlaceUrl(googlePlaceId: string) {
  const id = encodeURIComponent(googlePlaceId);
  return `https://www.google.com/maps/search/?api=1&query_place_id=${id}`;
}
