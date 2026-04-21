import type { CSSProperties } from "react";
import { CATEGORIES } from "@/lib/categories";

type Item = {
  emoji: string;
  top: string;
  left: string;
  rotate: number;
  size: number;
  opacity: number;
};

const ITEMS: Item[] = [
  { emoji: "🗺️", top: "-3%", left: "4%", rotate: -18, size: 54, opacity: 0.46 },
  { emoji: "☕️", top: "6%", left: "80%", rotate: 14, size: 44, opacity: 0.42 },
  { emoji: "🍳", top: "12%", left: "16%", rotate: 8, size: 46, opacity: 0.4 },
  { emoji: "🍝", top: "16%", left: "52%", rotate: -9, size: 58, opacity: 0.38 },
  { emoji: "🍸", top: "26%", left: "86%", rotate: -22, size: 56, opacity: 0.42 },
  { emoji: "📍", top: "18%", left: "2%", rotate: 12, size: 52, opacity: 0.34 },
  { emoji: "🛍️", top: "31%", left: "6%", rotate: 16, size: 50, opacity: 0.38 },
  { emoji: "🏨", top: "38%", left: "62%", rotate: 10, size: 64, opacity: 0.36 },
  { emoji: "🗽", top: "44%", left: "24%", rotate: -14, size: 60, opacity: 0.36 },
  { emoji: "🍻", top: "54%", left: "90%", rotate: 18, size: 48, opacity: 0.38 },
  { emoji: "🎧", top: "62%", left: "1%", rotate: -10, size: 54, opacity: 0.34 },
  { emoji: "🌆", top: "70%", left: "68%", rotate: 12, size: 62, opacity: 0.34 },
  { emoji: "🥡", top: "73%", left: "3%", rotate: -10, size: 50, opacity: 0.3 },
  { emoji: "🧁", top: "84%", left: "44%", rotate: -17, size: 50, opacity: 0.36 },
  { emoji: "🥐", top: "4%", left: "20%", rotate: -6, size: 46, opacity: 0.34 },
  { emoji: "🧃", top: "30%", left: "1%", rotate: 8, size: 46, opacity: 0.28 },
  { emoji: "🍜", top: "22%", left: "34%", rotate: 10, size: 52, opacity: 0.32 },
  { emoji: "🍣", top: "10%", left: "92%", rotate: -12, size: 48, opacity: 0.34 },
  { emoji: "🍷", top: "36%", left: "86%", rotate: 8, size: 46, opacity: 0.32 },
  { emoji: "🧋", top: "48%", left: "72%", rotate: -8, size: 50, opacity: 0.3 },
  { emoji: "🧇", top: "58%", left: "32%", rotate: 14, size: 48, opacity: 0.3 },
  { emoji: "🍦", top: "74%", left: "12%", rotate: -14, size: 52, opacity: 0.32 },
  { emoji: "🥟", top: "88%", left: "10%", rotate: 10, size: 50, opacity: 0.3 },
  { emoji: "🍕", top: "82%", left: "78%", rotate: -9, size: 56, opacity: 0.32 },
  { emoji: "🍔", top: "60%", left: "56%", rotate: 6, size: 50, opacity: 0.3 },
];

function pickEmoji(i: number): string {
  const categoryEmoji = CATEGORIES[i % CATEGORIES.length]?.emoji;
  return categoryEmoji || ITEMS[i % ITEMS.length]?.emoji || "✨";
}

export function EmojiCollageBackground() {
  const topOffset = "6%";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-50 via-white to-sky-50 opacity-100" />
      {ITEMS.map((it, i) => {
        const emoji = it.emoji || pickEmoji(i);
        return (
          <span
            key={`${emoji}-${i}`}
            className="mapsies-emoji-drift absolute select-none"
            style={
              {
                top: `calc(${it.top} + ${topOffset})`,
                left: it.left,
                ["--emoji-rot" as string]: `${it.rotate}deg`,
                fontSize: `${it.size}px`,
                opacity: it.opacity,
                animationDelay: `${(i % 12) * 0.18}s`,
              } as CSSProperties
            }
          >
            {emoji}
          </span>
        );
      })}
      <div className="absolute inset-0 bg-white/0" />
    </div>
  );
}

