import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { CATEGORIES, isCategoryId, sanitizeCategoryIds } from "@/lib/categories";
import { autocompletePlaces, fetchPlaceEssentials } from "@/lib/google/placesServer";
import { prisma } from "@/lib/prisma";
import { getAuthorizedRoomFromRequest } from "@/lib/roomAuth";
import type { Locale } from "@/lib/i18n";
import type { TrendingSpot } from "@/lib/dashboardTypes";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_OPENAI_MODEL = "gpt-5.5";

const TREND_COLORS = [
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#84cc16",
] as const;

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

function trendLimit(category: string): number {
  return category === "alla" ? 10 : 5;
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

function normalizeSourceUrl(value: string): string | null {
  const raw = value.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
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

function categoryPrompt(category: string): string {
  if (category === "alla") {
    return "Find a varied mix across the allowed categories.";
  }

  const meta = CATEGORIES.find((c) => c.id === category);
  return `Only return places that fit category "${category}" (${meta?.label ?? category}).`;
}

async function askOpenAIForTrendingPlaces({
  cityName,
  category,
  locale,
}: {
  cityName: string;
  category: string;
  locale: Locale;
}): Promise<OpenAIPlace[]> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY saknas i miljön.");
  }

  const limit = trendLimit(category);
  const model = process.env.OPENAI_TRENDING_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
  const categories = CATEGORIES.map((c) => `${c.id}: ${c.label}`).join("\n");
  const responseLanguage = locale === "en" ? "English" : "Swedish";

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
              "Use fresh web search results, prefer venues that can be visited and found in Google Places, " +
              "and return only places with clear evidence. Do not invent coordinates. " +
              "Return JSON that matches the schema.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              `Find ${limit} currently trending places in ${cityName}. ` +
              `${categoryPrompt(category)} ` +
              `Allowed category ids:\n${categories}\n` +
              `Write short reasons in ${responseLanguage}. ` +
              "For each place include a Google-friendly searchQuery with place name and city, " +
              "and one source URL/title from the web evidence when available.",
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
              minItems: 0,
              maxItems: limit,
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
                  reason: { type: "string", minLength: 1, maxLength: 220 },
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
  return parseTrendingJson(text).slice(0, limit);
}

async function enrichWithGooglePlaces(
  places: OpenAIPlace[],
  cityName: string,
  category: string,
): Promise<TrendingSpot[]> {
  const seen = new Set<string>();
  const out: TrendingSpot[] = [];

  const resolved = await Promise.all(
    places.map(async (candidate) => {
      try {
        const query = candidate.searchQuery.trim() || `${candidate.name} ${cityName}`;
        const suggestions = await autocompletePlaces(query);
        const first = suggestions[0];
        if (!first) return null;

        const details = await fetchPlaceEssentials(first.placeId);
        if (details.lat == null || details.lng == null) return null;

        return { candidate, details, fallbackName: first.label, lat: details.lat, lng: details.lng };
      } catch {
        return null;
      }
    }),
  );

  for (const item of resolved) {
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
      reason: candidate.reason.trim(),
      sourceTitle: candidate.sourceTitle.trim() || null,
      sourceUrl: normalizeSourceUrl(candidate.sourceUrl),
      lat,
      lng,
      neighborhood: details.neighborhood,
      color: TREND_COLORS[out.length % TREND_COLORS.length],
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

    const city = await prisma.city.findUnique({
      where: { roomId_slug: { roomId: auth.room.id, slug: citySlug } },
      select: { name: true },
    });
    if (!city) {
      return NextResponse.json({ error: "Staden finns inte" }, { status: 404 });
    }

    const locale: Locale = body.locale === "en" ? "en" : "sv";
    const openAiPlaces = await askOpenAIForTrendingPlaces({
      cityName: city.name,
      category,
      locale,
    });
    const spots = await enrichWithGooglePlaces(openAiPlaces, city.name, category);

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
