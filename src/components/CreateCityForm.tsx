"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cityNewEmojiInputClassName } from "@/lib/cityEmojiUi";

export function CreateCityForm({ roomSlug }: { roomSlug: string }) {
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
      if (!res.ok) throw new Error(data.error ?? "Kunde inte skapa stad");
      setName("");
      setEmoji("");
      router.replace(`/${roomSlug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Okänt fel");
    } finally {
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
            placeholder="Stad"
            aria-label="Stadens namn"
            className="box-border h-11 min-h-11 min-w-0 flex-1 rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none ring-emerald-600 focus:ring-2"
          />
          <div className="flex shrink-0 flex-col items-end">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              maxLength={8}
              placeholder="🇸🇪"
              aria-label="Stad-emoji eller flagga"
              className={cityNewEmojiInputClassName}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40 sm:self-start"
        >
          {busy ? "Skapar…" : "Skapa"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
