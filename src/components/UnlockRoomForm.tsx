"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function UnlockRoomForm({
  roomSlug,
  title,
  locale,
}: {
  roomSlug: string;
  title: string;
  locale: Locale;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomSlug)}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t(locale, "unlock.errorDefault"));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Okänt fel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-12">
      <div className="y2k-panel rounded-[1.75rem] p-6 sm:p-8">
        <h1 className="mb-1 text-xl font-extrabold tracking-tight text-indigo-950">{title}</h1>
        <p className="mb-6 text-sm font-semibold text-indigo-900/60">{t(locale, "unlock.lede")}</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-xs font-extrabold text-indigo-900/80">
            {t(locale, "unlock.pinLabel")}
            <input
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              minLength={4}
              className="mt-1 w-full rounded-2xl border border-fuchsia-200/70 bg-white/90 px-4 py-3 text-base font-semibold tracking-widest text-indigo-950 outline-none focus:ring-4 focus:ring-fuchsia-300/50"
            />
          </label>
          {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
          <button
            type="submit"
            disabled={busy || pin.trim().length < 4}
            className="w-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 py-3 text-sm font-extrabold text-white transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? t(locale, "unlock.ctaBusy") : t(locale, "unlock.cta")}
          </button>
        </form>
        <p className="mt-6 text-center text-xs font-bold text-indigo-900/45">
          <Link
            href="/"
            className="text-indigo-800 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-950"
          >
            {t(locale, "unlock.createLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
