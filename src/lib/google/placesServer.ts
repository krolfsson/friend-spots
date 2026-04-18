import { resolveNeighborhood, type AddressDescriptor } from "@/lib/parseNeighborhood";

const AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";

export type AutocompleteSuggestion = {
  placeId: string;
  label: string;
};

export async function autocompletePlaces(input: string, regionCode?: string) {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new Error("GOOGLE_MAPS_API_KEY saknas i .env (starta om dev-servern efter du lagt in nyckeln)");
  }

  // Autocomplete (New) kräver fältmask annars blir svaret ofta tomt / fel.
  // Se: https://developers.google.com/maps/documentation/places/web-service/place-autocomplete#fieldmask
  const fieldMask = ["suggestions.placePrediction.placeId", "suggestions.placePrediction.text.text"].join(",");

  const res = await fetch(AUTOCOMPLETE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key.trim(),
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify({
      input,
      languageCode: "sv",
      ...(regionCode ? { includedRegionCodes: [regionCode] } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Autocomplete misslyckades: ${res.status} ${text}`);
  }

  const data = (await res.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        place?: string;
        text?: { text?: string };
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
      };
    }>;
  };

  const out: AutocompleteSuggestion[] = [];
  for (const s of data.suggestions ?? []) {
    const p = s.placePrediction;
    if (!p) continue;

    const placeId =
      p.placeId?.trim() ||
      p.place?.replace(/^places\//, "").trim() ||
      "";

    if (!placeId) continue;

    const label =
      p.text?.text?.trim() ||
      [p.structuredFormat?.mainText?.text, p.structuredFormat?.secondaryText?.text]
        .filter(Boolean)
        .join(", ") ||
      placeId;

    out.push({ placeId, label });
  }

  return out;
}

export type PlaceEssentials = {
  googlePlaceId: string;
  lat: number | null;
  lng: number | null;
  neighborhood: string | null;
  shortAddress: string | null;
};

export async function fetchPlaceEssentials(placeId: string): Promise<PlaceEssentials> {
  const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    throw new Error("GOOGLE_MAPS_API_KEY saknas i .env (starta om dev-servern efter du lagt in nyckeln)");
  }

  const name = placeId.startsWith("places/") ? placeId : `places/${placeId}`;
  // `languageCode=en` ger oftast tydligare NYC-microhoods (SoHo, Nolita, …) i `addressDescriptor`.
  const url = `https://places.googleapis.com/v1/${name}?languageCode=en`;

  const res = await fetch(url, {
    headers: {
      "X-Goog-Api-Key": key.trim(),
      "X-Goog-FieldMask": "id,location,addressComponents,shortFormattedAddress,addressDescriptor",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Place Details misslyckades: ${res.status} ${text}`);
  }

  const place = (await res.json()) as {
    id?: string;
    location?: { latitude?: number; longitude?: number };
    addressComponents?: Array<{
      longText?: string;
      shortText?: string;
      types?: string[];
    }>;
    shortFormattedAddress?: string;
    addressDescriptor?: AddressDescriptor;
  };

  const rawId = place.id?.replace(/^places\//, "") ?? placeId.replace(/^places\//, "");

  return {
    googlePlaceId: rawId,
    lat: place.location?.latitude ?? null,
    lng: place.location?.longitude ?? null,
    neighborhood: resolveNeighborhood({
      addressDescriptor: place.addressDescriptor,
      addressComponents: place.addressComponents,
    }),
    shortAddress: place.shortFormattedAddress ?? null,
  };
}
