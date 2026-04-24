"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function CreateRoomModal({
  locale,
  onClose,
}: {
  locale: Locale;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBackdropPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pin.trim().length < 4) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          pin: pin.trim(),
        }),
      });
      const data = (await res.json()) as { slug?: string; error?: string };
      if (!res.ok)
        throw new Error(
          data.error ??
            (locale === "en" ? "Could not create map" : "Kunde inte skapa karta"),
        );
      if (!data.slug)
        throw new Error(
          locale === "en" ? "Missing map URL" : "Saknar adress till kartan",
        );
      router.push(`/${data.slug}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : locale === "en"
            ? "Unknown error"
            : "Okänt fel",
      );
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-indigo-950/45 p-3 pt-14 backdrop-blur-[3px] sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-room-modal-title"
      onPointerDown={handleBackdropPointer}
    >
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-indigo-200/75 bg-white/92 shadow-2xl shadow-indigo-950/20">
        <div className="max-h-[min(88dvh,34rem)] overflow-y-auto overscroll-contain px-5 pb-6 pt-4 sm:px-6 sm:pb-7 sm:pt-5">
          <div className="mb-4 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="ui-press rounded-full border border-indigo-200/70 bg-white/90 px-3 py-1.5 text-xs font-extrabold text-indigo-900/80 shadow-sm transition hover:bg-indigo-50"
            >
              ← {t(locale, "home.step.back")}
            </button>
          </div>

          <h2
            id="create-room-modal-title"
            className="text-lg font-extrabold tracking-tight text-indigo-950 sm:text-xl"
          >
            {t(locale, "home.step.create.title")}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-indigo-900/65">
            {t(locale, "home.step.create.lede")}
          </p>
          <p className="mt-3 text-xs font-semibold leading-relaxed text-indigo-900/50">
            {t(locale, "home.step.create.pinHint")}
          </p>

          <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-3">
            <label className="block text-xs font-extrabold text-indigo-900/80">
              {t(locale, "home.step.mapNameLabel")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t(locale, "home.create.namePlaceholder")}
                className="mt-1 box-border h-11 w-full rounded-2xl border border-fuchsia-200/70 bg-white/95 px-3.5 text-sm font-semibold text-indigo-950 shadow-inner shadow-fuchsia-100/70 outline-none placeholder:text-indigo-900/35 placeholder:opacity-50 focus:ring-2 focus:ring-fuchsia-300/55"
              />
            </label>
            <label className="block text-xs font-extrabold text-indigo-900/80">
              {t(locale, "home.create.pinLabel")}
              <input
                type="password"
                inputMode="numeric"
                autoComplete="new-password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                minLength={4}
                placeholder={t(locale, "home.create.pinPlaceholder")}
                className="mt-1 box-border h-11 w-full rounded-2xl border border-fuchsia-200/70 bg-white/95 px-3.5 text-base font-semibold tracking-widest text-indigo-950 shadow-inner shadow-fuchsia-100/70 outline-none placeholder:text-sm placeholder:tracking-normal placeholder:text-indigo-900/35 placeholder:opacity-50 focus:ring-2 focus:ring-fuchsia-300/55"
              />
            </label>

            {error ? (
              <p className="text-sm font-bold text-rose-600">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={busy || pin.trim().length < 4}
              aria-busy={busy}
              className="ui-press mt-1 w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 py-3 text-sm font-extrabold text-white shadow-md shadow-emerald-600/25 transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? t(locale, "home.create.ctaBusy") : t(locale, "home.create.cta")}
            </button>

            {busy ? (
              <div className="home-cta-progress mt-2" aria-hidden>
                <div className="home-cta-progress__inner" />
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </div>
  );
}
