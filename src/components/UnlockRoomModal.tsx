"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * PIN-upplåsning ovanpå mapsien (gästläge). Efter lyckad unlock: router.refresh().
 */
export function UnlockRoomModal({
  roomSlug,
  title,
  locale,
  open,
  onClose,
}: {
  roomSlug: string;
  title: string;
  locale: Locale;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

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
      setPin("");
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Okänt fel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex touch-manipulation items-end justify-center bg-indigo-950/50 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unlock-modal-title"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="y2k-panel w-full max-w-md rounded-[1.75rem] p-6 shadow-2xl sm:p-8">
        <h2 id="unlock-modal-title" className="mb-1 text-lg font-extrabold tracking-tight text-indigo-950">
          {title}
        </h2>
        <p className="mb-4 text-sm font-semibold text-indigo-900/60">{t(locale, "room.publicUnlock.lede")}</p>
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-press flex-1 rounded-full border border-indigo-200/70 bg-white/80 py-3 text-sm font-extrabold text-indigo-950"
            >
              {t(locale, "common.cancel")}
            </button>
            <button
              type="submit"
              disabled={busy || pin.trim().length < 4}
              className="ui-press flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 py-3 text-sm font-extrabold text-white disabled:opacity-40"
            >
              {busy ? t(locale, "unlock.ctaBusy") : t(locale, "unlock.cta")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
