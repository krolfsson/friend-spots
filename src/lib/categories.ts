export const CATEGORIES = [
  { id: "frukost", label: "Frukost", emoji: "🥐" },
  { id: "lunch", label: "Lunch", emoji: "🍜" },
  { id: "middag", label: "Middag", emoji: "🍱" },
  { id: "fika", label: "Fika", emoji: "🧋" },
  { id: "bar", label: "Bar", emoji: "🍹" },
  { id: "pub", label: "Pub", emoji: "🍺" },
  { id: "klubb", label: "Klubb", emoji: "💿" },
  { id: "sevardhet", label: "Sevärdhet", emoji: "🗼" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "boende", label: "Boende", emoji: "🏨" },
  { id: "annat", label: "Annat", emoji: "✨" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORIES.some((c) => c.id === value);
}

export function categoryMeta(id: string) {
  const hit = CATEGORIES.find((c) => c.id === id);
  return hit ?? { id: "annat", label: "Annat", emoji: "✨" as const };
}
