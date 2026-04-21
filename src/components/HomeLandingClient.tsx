"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { normalizeRoomSlugInput } from "@/lib/roomSlugInput";

type Step = null | "create" | "open";

export function HomeLandingClient({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(null);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForms = useCallback(() => {
    setName("");
    setPin("");
    setSlugInput("");
    setError(null);
    setBusy(false);
  }, []);

  const openCreate = useCallback(() => {
    resetForms();
    setStep("create");
  }, [resetForms]);

  const openExisting = useCallback(() => {
    resetForms();
    setStep("open");
  }, [resetForms]);

  const closePanel = useCallback(() => {
    setStep(null);
    resetForms();
  }, [resetForms]);

  async function onCreateSubmit(e: React.FormEvent) {
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
      if (!res.ok) throw new Error(data.error ?? (locale === "en" ? "Could not create map" : "Kunde inte skapa karta"));
      if (!data.slug) throw new Error(locale === "en" ? "Missing map URL" : "Saknar adress till kartan");
      router.push(`/${data.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : locale === "en" ? "Unknown error" : "Okänt fel");
    } finally {
      setBusy(false);
    }
  }

  async function onOpenSubmit(e: React.FormEvent) {
    e.preventDefault();
    const slug = normalizeRoomSlugInput(slugInput);
    if (!slug || pin.trim().length < 4) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(slug)}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? t(locale, "unlock.errorDefault"));
      router.push(`/${slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : locale === "en" ? "Unknown error" : "Okänt fel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-10 pt-8 sm:pb-14 sm:pt-10">
        <div className="flex w-full justify-center overflow-visible px-2 sm:px-4">
          <div
            className="select-none whitespace-nowrap bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500 bg-clip-text pb-1.5 text-[clamp(3.1rem,15vw,4.6rem)] font-extrabold leading-[0.92] tracking-tight text-transparent drop-shadow-[0_14px_38px_rgba(236,72,153,0.24)] sm:text-[clamp(3.6rem,13vw,5.25rem)]"
            style={{
              fontFamily: "var(--font-logo), var(--font-y2k), system-ui, sans-serif",
            }}
          >
            Mapsies
          </div>
        </div>

        <p className="mt-6 max-w-[min(100%,22rem)] text-center text-[0.98rem] font-extrabold leading-snug tracking-tight text-indigo-950 sm:mt-7 sm:max-w-md sm:text-lg">
          {t(locale, "home.hero.lead")}
        </p>
        <p className="mt-3 max-w-[min(100%,24rem)] px-1 text-center text-[0.8125rem] font-semibold leading-relaxed text-indigo-900/58 sm:mt-4 sm:max-w-lg sm:text-sm">
          {t(locale, "home.hero.sub")}
        </p>

        <div className="mt-12 flex w-full max-w-sm flex-col gap-3 sm:mt-14">
          <button
            type="button"
            onClick={openCreate}
            className="ui-press inline-flex h-12 w-full cursor-default items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 px-5 text-sm font-extrabold tracking-tight text-white shadow-lg shadow-emerald-700/25 ring-1 ring-white/50 transition hover:brightness-110 active:scale-[0.99] sm:h-14 sm:text-base"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/35 bg-white/15" aria-hidden>
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
                <path
                  d="M12 7v10M7 12h10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            {t(locale, "home.cta.create")}
          </button>
          <button
            type="button"
            onClick={openExisting}
            className="ui-press inline-flex h-12 w-full cursor-default items-center justify-center gap-2.5 rounded-full border border-indigo-200/80 bg-white/90 px-5 text-sm font-extrabold tracking-tight text-indigo-950 shadow-md shadow-indigo-500/10 ring-1 ring-white/70 transition hover:brightness-105 active:scale-[0.99] sm:h-14 sm:text-base"
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-violet-200/90 bg-gradient-to-br from-white to-violet-50/90 text-lg leading-none shadow-inner shadow-violet-200/50 ring-2 ring-fuchsia-200/50 ring-offset-2 ring-offset-white/80"
              aria-hidden
            >
              🔑
            </span>
            {t(locale, "home.cta.open")}
          </button>
        </div>
      </main>

      {step ? (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-indigo-950/45 p-3 pt-14 backdrop-blur-[3px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="home-step-title"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={t(locale, "home.step.closeOverlayAria")}
            onClick={closePanel}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-indigo-200/75 bg-white/92 shadow-2xl shadow-indigo-950/20">
            <div className="max-h-[min(88dvh,34rem)] overflow-y-auto overscroll-contain px-5 pb-6 pt-4 sm:px-6 sm:pb-7 sm:pt-5">
              <div className="mb-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={closePanel}
                  className="ui-press rounded-full border border-indigo-200/70 bg-white/90 px-3 py-1.5 text-xs font-extrabold text-indigo-900/80 shadow-sm transition hover:bg-indigo-50"
                >
                  ← {t(locale, "home.step.back")}
                </button>
              </div>

              {step === "create" ? (
                <>
                  <h2 id="home-step-title" className="text-lg font-extrabold tracking-tight text-indigo-950 sm:text-xl">
                    {t(locale, "home.step.create.title")}
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-indigo-900/65">{t(locale, "home.step.create.lede")}</p>
                  <p className="mt-3 text-xs font-semibold leading-relaxed text-indigo-900/50">{t(locale, "home.step.create.pinHint")}</p>
                  <form onSubmit={onCreateSubmit} className="mt-5 space-y-3">
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
                    {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
                    <button
                      type="submit"
                      disabled={busy || pin.trim().length < 4}
                      className="ui-press mt-1 w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 py-3 text-sm font-extrabold text-white shadow-md shadow-emerald-600/25 transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busy ? (locale === "en" ? "Creating…" : "Skapar…") : t(locale, "home.create.cta")}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <h2 id="home-step-title" className="text-lg font-extrabold tracking-tight text-indigo-950 sm:text-xl">
                    {t(locale, "home.step.open.title")}
                  </h2>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-indigo-900/65">{t(locale, "home.step.open.lede")}</p>
                  <p className="mt-3 text-xs font-semibold leading-relaxed text-indigo-900/50">{t(locale, "home.step.open.pinHint")}</p>
                  <form onSubmit={onOpenSubmit} className="mt-5 space-y-3">
                    <label className="block text-xs font-extrabold text-indigo-900/80">
                      {t(locale, "home.step.open.slugLabel")}
                      <input
                        value={slugInput}
                        onChange={(e) => setSlugInput(e.target.value)}
                        placeholder={t(locale, "home.step.open.slugPlaceholder")}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className="mt-1 box-border h-11 w-full rounded-2xl border border-sky-200/75 bg-white/95 px-3.5 text-sm font-semibold text-indigo-950 shadow-inner shadow-sky-100/70 outline-none placeholder:text-indigo-900/35 placeholder:opacity-50 focus:ring-2 focus:ring-sky-300/55"
                      />
                    </label>
                    <label className="block text-xs font-extrabold text-indigo-900/80">
                      {t(locale, "home.create.pinLabel")}
                      <input
                        type="password"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        required
                        minLength={4}
                        placeholder={t(locale, "home.create.pinPlaceholder")}
                        className="mt-1 box-border h-11 w-full rounded-2xl border border-sky-200/75 bg-white/95 px-3.5 text-base font-semibold tracking-widest text-indigo-950 shadow-inner shadow-sky-100/70 outline-none placeholder:text-sm placeholder:tracking-normal placeholder:text-indigo-900/35 placeholder:opacity-50 focus:ring-2 focus:ring-sky-300/55"
                      />
                    </label>
                    {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
                    <button
                      type="submit"
                      disabled={busy || !normalizeRoomSlugInput(slugInput) || pin.trim().length < 4}
                      className="ui-press mt-1 w-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 py-3 text-sm font-extrabold text-white shadow-md shadow-indigo-500/20 transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busy ? t(locale, "unlock.ctaBusy") : t(locale, "home.step.open.submit")}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
