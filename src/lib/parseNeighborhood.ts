type AddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

type LocalizedText = { text?: string };

export type AddressDescriptor = {
  areas?: Array<{
    displayName?: LocalizedText;
    containment?: string;
  }>;
};

/** Områden som ofta “äter” allt i NYC men sällan är det användaren menar som filter. */
const BROAD_AREA = new Set(
  [
    "manhattan",
    "brooklyn",
    "queens",
    "bronx",
    "the bronx",
    "staten island",
    "new york county",
    "kings county",
    "queens county",
    "richmond county",
    "bronx county",
  ].map((s) => s.toLowerCase()),
);

function norm(s: string) {
  return s.trim().toLowerCase();
}

function isBroadAreaLabel(label: string) {
  return BROAD_AREA.has(norm(label));
}

/**
 * Google rankar `addressDescriptor.areas` med **finast först** (t.ex. SoHo före Manhattan).
 * Vi hoppar över rena borough-namn om det finns finare alternativ längre ner i listan.
 */
export function neighborhoodFromAddressDescriptor(descriptor: AddressDescriptor | undefined) {
  const areas = descriptor?.areas;
  if (!areas?.length) return null;

  const labels = areas
    .map((a) => a.displayName?.text?.trim())
    .filter((t): t is string => Boolean(t));

  if (!labels.length) return null;

  const specific = labels.find((t) => !isBroadAreaLabel(t));
  if (specific) return specific;

  return labels[0] ?? null;
}

/**
 * Fallback från `addressComponents` när `addressDescriptor` saknas / är tomt.
 */
const TYPE_SCORE: Record<string, number> = {
  neighborhood: 100,
  premise: 92,
  sublocality_level_5: 90,
  sublocality_level_4: 88,
  sublocality_level_3: 86,
  sublocality_level_2: 84,
  sublocality: 70,
  sublocality_level_1: 48,
  administrative_area_level_3: 40,
  locality: 25,
};

export function neighborhoodFromAddressComponents(components: AddressComponent[] | undefined) {
  if (!components?.length) return null;

  let bestText: string | null = null;
  let bestScore = -1;

  for (const c of components) {
    const text = (c.longText || c.shortText || "").trim();
    if (!text) continue;

    for (const t of c.types ?? []) {
      const score = TYPE_SCORE[t];
      if (score == null) continue;
      if (score > bestScore) {
        bestScore = score;
        bestText = text;
      }
    }
  }

  if (bestText && isBroadAreaLabel(bestText)) {
    const finer = components
      .flatMap((c) => {
        const text = (c.longText || c.shortText || "").trim();
        if (!text || isBroadAreaLabel(text)) return [];
        for (const t of c.types ?? []) {
          if (TYPE_SCORE[t] != null && TYPE_SCORE[t]! >= 70) return [text];
        }
        return [];
      })
      .find(Boolean);
    if (finer) return finer;
  }

  return bestText;
}

export function resolveNeighborhood(input: {
  addressDescriptor?: AddressDescriptor;
  addressComponents?: AddressComponent[];
}) {
  return (
    neighborhoodFromAddressDescriptor(input.addressDescriptor) ??
    neighborhoodFromAddressComponents(input.addressComponents)
  );
}
