import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { CATEGORIES, isCategoryId, sanitizeCategoryIds } from "@/lib/categories";
import { searchTextPlaceEssentials } from "@/lib/google/placesServer";
import { prisma } from "@/lib/prisma";
import { getAuthorizedRoomFromRequest } from "@/lib/roomAuth";
import type { Locale } from "@/lib/i18n";
import type { TrendingSpot } from "@/lib/dashboardTypes";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const TREND_CACHE_TTL_MS = 10 * 60 * 1000;

type OpenAIPlace = {
  name: string;
  categoryIds: string[];
  reason: string;
  searchQuery: string;
  sourceTitle: string;
  sourceUrl: string;
};

type OpenAITrendingResponse = {
  places?: OpenAIPlace[];
};

type ResponseOutputContent = {
  type?: string;
  text?: string;
};

type ResponseOutputItem = {
  type?: string;
  content?: ResponseOutputContent[];
};

type OpenAIResponsesPayload = {
  output_text?: string;
  output?: ResponseOutputItem[];
  error?: { message?: string };
};

const trendCache = new Map<string, { spots: TrendingSpot[]; expiresAt: number }>();
const DISALLOWED_SOURCE_PATTERN =
  /\b(tripadvisor|yelp|google\s*(reviews?|maps?)|trustpilot|foursquare|restaurantji|wanderlog|wanderlog\.com)\b/i;
const OLD_SOURCE_YEAR_PATTERN = /\b20(?:1\d|2[0-5])\b/;
const MAX_REASON_LENGTH = 38;

function trendLimit(category: string): number {
  return category === "alla" ? 10 : 5;
}

function trendCandidateLimit(category: string): number {
  return category === "alla" ? 24 : 14;
}

function compactReason(value: string): string {
  const clean = value.replace(/…/g, "...").replace(/\s+/g, " ").trim();
  if (!clean) return "Trendigt just nu.";
  if (clean.endsWith("...")) {
    return clean.length <= MAX_REASON_LENGTH
      ? clean
      : `${clean.slice(0, MAX_REASON_LENGTH - 3).trimEnd()}...`;
  }

  const withoutEnding = clean.replace(/[.!?]+$/g, "").trim();
  const withPeriod = `${withoutEnding}.`;
  if (withPeriod.length <= MAX_REASON_LENGTH) return withPeriod;
  return `${withoutEnding.slice(0, MAX_REASON_LENGTH - 3).trimEnd()}...`;
}

function extractResponseText(payload: OpenAIResponsesPayload): string {
  if (payload.output_text?.trim()) return payload.output_text;

  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === "output_text" && content.text?.trim()) {
        return content.text;
      }
    }
  }

  return "";
}

function parseTrendingJson(text: string): OpenAIPlace[] {
  const parsed = JSON.parse(text) as OpenAITrendingResponse;
  if (!Array.isArray(parsed.places)) return [];
  return parsed.places.filter((place): place is OpenAIPlace => {
    return (
      typeof place?.name === "string" &&
      typeof place.reason === "string" &&
      typeof place.searchQuery === "string" &&
      Array.isArray(place.categoryIds)
    );
  });
}

function hasAcceptableTrendSource(place: OpenAIPlace): boolean {
  const sourceText = `${place.sourceTitle} ${place.sourceUrl}`;
  if (DISALLOWED_SOURCE_PATTERN.test(sourceText)) return false;
  if (OLD_SOURCE_YEAR_PATTERN.test(sourceText)) return false;
  return true;
}

function categoryPrompt(category: string): string {
  if (category === "alla") {
    return "Find a varied mix across the allowed categories.";
  }

  const meta = CATEGORIES.find((c) => c.id === category);
  return `Only return places that fit category "${category}" (${meta?.label ?? category}).`;
}

function normalizeNeighborhood(value: unknown): string {
  if (typeof value !== "string") return "alla";
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean || clean === "alla") return "alla";
  if (clean === "ovrigt") return "ovrigt";
  return clean.slice(0, 80);
}

function areaPrompt(neighborhood: string, cityName: string): string {
  if (neighborhood === "alla") return `Search across ${cityName}.`;
  if (neighborhood === "ovrigt") {
    return `Search in ${cityName}, but avoid relying on a specific named neighborhood filter.`;
  }
  return `Only return places in or immediately around "${neighborhood}" in ${cityName}.`;
}

function normalizeForAreaCompare(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function matchesSelectedArea(
  details: { neighborhood: string | null; shortAddress: string | null },
  neighborhood: string,
): boolean {
  if (neighborhood === "alla" || neighborhood === "ovrigt") return true;
  const wanted = normalizeForAreaCompare(neighborhood);
  const actualNeighborhood = details.neighborhood ? normalizeForAreaCompare(details.neighborhood) : "";
  const actualAddress = details.shortAddress ? normalizeForAreaCompare(details.shortAddress) : "";

  if (!actualNeighborhood && !actualAddress) return true;
  return actualNeighborhood === wanted || actualNeighborhood.includes(wanted) || actualAddress.includes(wanted);
}

async function askOpenAIForTrendingPlaces({
  cityName,
  category,
  neighborhood,
  locale,
}: {
  cityName: string;
  category: string;
  neighborhood: string;
  locale: Locale;
}): Promise<OpenAIPlace[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY saknas i miljön.");
  }

  const limit = trendLimit(category);
  const candidateLimit = trendCandidateLimit(category);
  const model = process.env.OPENAI_TRENDING_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const categories = CATEGORIES.map((c) => `${c.id}: ${c.label}`).join("\n");
  const responseLanguage = locale === "en" ? "English" : "Swedish";
  const today = new Date().toISOString().slice(0, 10);
  const year = today.slice(0, 4);

  const body = {
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You find currently trending real-world places for a shared city map. " +
              `Use fresh ${year} web evidence from recent blogs, city guides, culture/food/fashion magazines, local newsletters, event listings, or creator/editorial writeups. ` +
              "Prefer cool current buzz: new openings, popups, viral/social/news attention, current queues, design-led spots, or places locals are talking about now. " +
              "Never use Tripadvisor, Yelp, Google reviews/ratings, rating aggregators, old awards, old reputation, lifetime popularity, or generic best-of lists as the reason to include a place. " +
              "Skip anything without current trend evidence. " +
              "If writing Swedish, use normal Swedish characters å, ä, ö. Never transliterate them to a/a/o. " +
              "Prefer venues that can be visited and found in Google Places. Do not invent coordinates. " +
              "Return compact JSON that matches the schema.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Today is ${today}. Find ${candidateLimit} currently trending place candidates so the app can show exactly ${limit}. ` +
              `${areaPrompt(neighborhood, cityName)} ` +
              `${categoryPrompt(category)} ` +
              `Use ${year} sources first: recent blogs, local/editorial guides, culture/food/fashion media, newsletters, event pages, or creator writeups. ` +
              "Do not use Tripadvisor, Yelp, Google reviews/ratings, rating aggregators, old awards, or generic best-of reputation. " +
              `Avoid sources dated before ${year}; only use evergreen lists if they were clearly updated in ${year} and are trend-forward. ` +
              "Choose places that feel trendy, cool, current, and a little insider. " +
              `Allowed category ids:\n${categories}\n` +
              `Write very short reasons in ${responseLanguage}: 1-4 words, max 38 characters, ending with "." or "...". ` +
              (locale === "sv" ? "Use å, ä and ö correctly in Swedish. Do not write ae/aa/oe/ascii-only Swedish. " : "") +
              "For each place include a Google-friendly searchQuery with place name, selected area if any, and city, " +
              `and one ${year} blog/editorial/local source URL/title from the web evidence.`,
          },
        ],
      },
    ],
    tools: [
      {
        type: "web_search",
        search_context_size: "low",
        user_location: { type: "approximate", city: cityName },
      },
    ],
    tool_choice: "required",
    max_output_tokens: 1800,
    text: {
      format: {
        type: "json_schema",
        name: "trending_places",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["places"],
          properties: {
            places: {
              type: "array",
              minItems: limit,
              maxItems: candidateLimit,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "categoryIds", "reason", "searchQuery", "sourceTitle", "sourceUrl"],
                properties: {
                  name: { type: "string", minLength: 1, maxLength: 120 },
                  categoryIds: {
                    type: "array",
                    minItems: 1,
                    maxItems: 3,
                    items: { type: "string", enum: CATEGORIES.map((c) => c.id) },
                  },
                  reason: { type: "string", minLength: 1, maxLength: 48 },
                  searchQuery: { type: "string", minLength: 1, maxLength: 180 },
                  sourceTitle: { type: "string", maxLength: 160 },
                  sourceUrl: { type: "string", maxLength: 500 },
                },
              },
            },
          },
        },
      },
    },
  };

  const res = await fetch(OPENAI_RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  const payload = (await res.json().catch(() => ({}))) as OpenAIResponsesPayload;
  if (!res.ok) {
    throw new Error(payload.error?.message || `OpenAI misslyckades: ${res.status}`);
  }

  const text = extractResponseText(payload);
  if (!text) return [];
  return parseTrendingJson(text).slice(0, candidateLimit);
}

async function enrichWithGooglePlaces(
  places: OpenAIPlace[],
  cityName: string,
  category: string,
  neighborhood: string,
): Promise<TrendingSpot[]> {
  const seen = new Set<string>();
  const out: TrendingSpot[] = [];

  const resolved = await Promise.all(
    places.filter(hasAcceptableTrendSource).map(async (candidate) => {
      try {
        const area = neighborhood !== "alla" && neighborhood !== "ovrigt" ? neighborhood : "";
        const query = [candidate.searchQuery.trim() || candidate.name, area, cityName].filter(Boolean).join(" ");
        const details = await searchTextPlaceEssentials(query);
        if (!details) return null;
        if (details.lat == null || details.lng == null) return null;

        return {
          candidate,
          details,
          fallbackName: details.displayName ?? query,
          lat: details.lat,
          lng: details.lng,
          areaMatched: matchesSelectedArea(details, neighborhood),
        };
      } catch {
        return null;
      }
    }),
  );

  const ordered = [
    ...resolved.filter((item) => item?.areaMatched),
    ...resolved.filter((item) => item && !item.areaMatched),
  ];

  for (const item of ordered) {
    if (!item) continue;
    const { candidate, details, fallbackName, lat, lng } = item;
    if (seen.has(details.googlePlaceId)) continue;
    seen.add(details.googlePlaceId);

    const categories =
      category === "alla" ? sanitizeCategoryIds(candidate.categoryIds) : sanitizeCategoryIds([category]);

    out.push({
      id: `trend-${details.googlePlaceId}`,
      googlePlaceId: details.googlePlaceId,
      name: candidate.name.trim() || fallbackName,
      categories,
      reason: compactReason(candidate.reason),
      lat,
      lng,
      neighborhood: details.neighborhood,
    });

    if (out.length >= trendLimit(category)) break;
  }

  return out;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthorizedRoomFromRequest(req);
    if (!auth.ok) return auth.response;

    const body = (await req.json()) as {
      citySlug?: string;
      category?: string;
      neighborhood?: string;
      locale?: Locale;
    };

    const citySlug = body.citySlug?.trim();
    if (!citySlug) {
      return NextResponse.json({ error: "citySlug saknas" }, { status: 400 });
    }

    const category = body.category?.trim() || "alla";
    if (category !== "alla" && !isCategoryId(category)) {
      return NextResponse.json({ error: "Ogiltig kategori" }, { status: 400 });
    }
    const neighborhood = normalizeNeighborhood(body.neighborhood);

    const city = await prisma.city.findUnique({
      where: { roomId_slug: { roomId: auth.room.id, slug: citySlug } },
      select: { name: true },
    });
    if (!city) {
      return NextResponse.json({ error: "Staden finns inte" }, { status: 404 });
    }

    const locale: Locale = body.locale === "en" ? "en" : "sv";
    const cacheKey = `${auth.room.id}:${city.name}:${category}:${neighborhood}:${locale}`;
    const cached = trendCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return NextResponse.json({
        spots: cached.spots,
        limit: trendLimit(category),
        cached: true,
        generatedAt: new Date().toISOString(),
      });
    }

    const openAiPlaces = await askOpenAIForTrendingPlaces({
      cityName: city.name,
      category,
      neighborhood,
      locale,
    });
    const spots = await enrichWithGooglePlaces(openAiPlaces, city.name, category, neighborhood);
    trendCache.set(cacheKey, { spots, expiresAt: Date.now() + TREND_CACHE_TTL_MS });

    return NextResponse.json({
      spots,
      limit: trendLimit(category),
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Okänt fel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
