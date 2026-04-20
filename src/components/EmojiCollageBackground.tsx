import { CATEGORIES } from "@/lib/categories";

type Item = {
  emoji: string;
  top: string;
  left: string;
  rotate: number;
  size: number;
  opacity: number;
  blur: number;
};

const ITEMS: Item[] = [
  { emoji: "✨", top: "-2%", left: "6%", rotate: -18, size: 52, opacity: 0.22, blur: 0.2 },
  { emoji: "☕️", top: "8%", left: "78%", rotate: 14, size: 44, opacity: 0.18, blur: 0.3 },
  { emoji: "🍳", top: "14%", left: "18%", rotate: 8, size: 46, opacity: 0.16, blur: 0.3 },
  { emoji: "🍝", top: "18%", left: "52%", rotate: -9, size: 56, opacity: 0.14, blur: 0.4 },
  { emoji: "🍸", top: "28%", left: "84%", rotate: -22, size: 54, opacity: 0.16, blur: 0.35 },
  { emoji: "🛍️", top: "33%", left: "7%", rotate: 16, size: 50, opacity: 0.14, blur: 0.45 },
  { emoji: "🏨", top: "40%", left: "60%", rotate: 10, size: 62, opacity: 0.12, blur: 0.55 },
  { emoji: "🗽", top: "46%", left: "26%", rotate: -14, size: 58, opacity: 0.12, blur: 0.6 },
  { emoji: "🍻", top: "56%", left: "88%", rotate: 18, size: 48, opacity: 0.14, blur: 0.45 },
  { emoji: "🎧", top: "64%", left: "10%", rotate: -10, size: 52, opacity: 0.12, blur: 0.6 },
  { emoji: "🌆", top: "72%", left: "66%", rotate: 12, size: 60, opacity: 0.11, blur: 0.65 },
  { emoji: "🧁", top: "86%", left: "42%", rotate: -17, size: 50, opacity: 0.12, blur: 0.55 },
];

function pickEmoji(i: number): string {
  const categoryEmoji = CATEGORIES[i % CATEGORIES.length]?.emoji;
  return categoryEmoji || ITEMS[i % ITEMS.length]?.emoji || "✨";
}

export function EmojiCollageBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-50 via-white to-sky-50 opacity-80" />
      {ITEMS.map((it, i) => {
        const emoji = it.emoji || pickEmoji(i);
        return (
          <span
            key={`${emoji}-${i}`}
            className="absolute select-none"
            style={{
              top: it.top,
              left: it.left,
              transform: `rotate(${it.rotate}deg)`,
              fontSize: `${it.size}px`,
              opacity: it.opacity,
              filter: `blur(${it.blur}rem)`,
            }}
          >
            {emoji}
          </span>
        );
      })}
      <div className="absolute inset-0 bg-white/35" />
    </div>
  );
}

