"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cityNewEmojiInputClassName } from "@/lib/cityEmojiUi";
import { t, type Locale } from "@/lib/i18n";

export function CreateCityForm({ roomSlug, locale }: { roomSlug: string; locale: Locale }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Room-Slug": roomSlug },
        body: JSON.stringify({ name, emoji: emoji.trim() || undefined }),
      });
      const data = (await res.json()) as { city?: { slug: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? t(locale, "room.city.createError"));
      if (!data.city?.slug) throw new Error(t(locale, "room.city.missingSlug"));
      setName("");
      setEmoji("");
      router.replace(`/${roomSlug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t(locale, "room.city.unknownError"));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder={t(locale, "room.city.namePlaceholder")}
            aria-label={t(locale, "room.city.nameAria")}
            className="box-border h-11 min-h-11 min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none ring-emerald-600 focus:ring-2"
          />
          <div className="flex shrink-0 flex-col items-end">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={8}
              placeholder="🇸🇪"
              aria-label={t(locale, "room.city.emojiAria")}
              className={cityNewEmojiInputClassName}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40 sm:self-start"
        >
          {busy ? t(locale, "home.create.ctaBusy") : t(locale, "room.city.createCta")}
        </button>
        {busy ? (
          <div className="home-cta-progress max-w-xs" aria-hidden>
            <div className="home-cta-progress__inner" />
          </div>
        ) : null}
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
