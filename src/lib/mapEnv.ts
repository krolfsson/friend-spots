/** Miljöflagga utan att importera kartkomponenten (håller Google Maps ur initial JS-bundle). */
export function isMapViewConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());
}
