export const CATEGORIES = [
  { id: "frukost", label: "Frukost", emoji: "🥐" },
  { id: "lunch", label: "Lunch", emoji: "🍜" },
  { id: "middag", label: "Middag", emoji: "🍱" },
  { id: "fika", label: "Fika", emoji: "🧋" },
  { id: "bar", label: "Bar", emoji: "🍹" },
  { id: "pub", label: "Pub", emoji: "🍺" },
  { id: "klubb", label: "Klubb", emoji: "💿" },
  { id: "sevardhet", label: "Sevärdhet", emoji: "🗽" },
  { id: "shopping", label: "Shopping", emoji: "🛍️" },
  { id: "boende", label: "Boende", emoji: "🏨" },
  { id: "annat", label: "Gå inte hit", emoji: "🙅" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORIES.some((c) => c.id === value);
}

export function categoryMeta(id: string) {
  const hit = CATEGORIES.find((c) => c.id === id);
  return hit ?? { id: "annat", label: "Gå inte hit", emoji: "🙅" as const };
}

/** Unika giltiga kategorier i stabil ordning; tom lista → annat. */
export function sanitizeCategoryIds(ids: readonly string[]): CategoryId[] {
  const out: CategoryId[] = [];
  const seen = new Set<string>();
  for (const raw of ids) {
    const id = String(raw).trim();
    if (!isCategoryId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.length ? out : ["annat"];
}

/** Första träffen i CATEGORIES-ordning — t.ex. för emoji/markör. */
export function primaryCategoryId(categories: readonly string[]): CategoryId {
  const set = new Set(sanitizeCategoryIds([...categories]));
  for (const c of CATEGORIES) {
    if (set.has(c.id)) return c.id;
  }
  return "annat";
}

export function mergeCategoryIds(a: readonly string[], b: readonly string[]): CategoryId[] {
  return sanitizeCategoryIds([...a, ...b]);
}
