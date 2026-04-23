"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t, tReplace } from "@/lib/i18n";
import { normalizeRoomSlugInput } from "@/lib/roomSlugInput";
import { HomeDeviceMockup } from "@/components/HomeDeviceMockup";

type Step = null | "create" | "open";

function useCountUp(target: number, durationMs: number) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const t = Math.max(0, Math.floor(target));
    if (t === 0) {
      setValue(0);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - p) ** 3;
      setValue(Math.round(eased * t));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

export function HomeLandingClient({ locale, totalSpots }: { locale: Locale; totalSpots: number }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(null);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [slugInput, setSlugInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const animatedTotal = useCountUp(totalSpots, 1100);
  const totalFmt = new Intl.NumberFormat(locale === "sv" ? "sv-SE" : "en-US").format(animatedTotal);

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
      setBusy(false);
    }
  }

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col items-stretch justify-center px-4 pb-10 pt-8 sm:px-6 sm:pb-14 sm:pt-10 lg:px-10">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-12 xl:gap-x-16">
          <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
            <div className="flex w-full justify-center overflow-visible px-2 sm:px-4 lg:justify-start lg:px-0">
              <div
                className="select-none whitespace-nowrap bg-gradient-to-r from-indigo-800 via-violet-600 to-indigo-700 bg-clip-text px-1 pb-2.5 pt-0.5 text-[clamp(2.85rem,12vw,4.25rem)] font-extrabold leading-[1.02] tracking-tight text-transparent drop-shadow-[0_12px_32px_rgba(67,56,202,0.2)] sm:text-[clamp(3.2rem,10vw,4.5rem)]"
                style={{
                  fontFamily: "var(--font-logo), var(--font-y2k), system-ui, sans-serif",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                }}
              >
                Mapsies
              </div>
            </div>

            <p className="mt-5 max-w-[min(100%,24rem)] text-[0.98rem] font-bold leading-snug tracking-tight text-indigo-950 sm:mt-6 sm:max-w-md sm:text-lg lg:max-w-none">
              {t(locale, "home.hero.lead")}
            </p>
            <p className="mt-3 max-w-[min(100%,26rem)] px-1 text-[0.8125rem] font-medium leading-relaxed text-indigo-900/62 sm:mt-3.5 sm:max-w-lg sm:text-sm lg:max-w-none">
              {t(locale, "home.hero.sub")}
            </p>

            <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:mt-11 lg:max-w-[20rem]">
              <button
                type="button"
                onClick={openCreate}
                className="ui-press inline-flex h-12 w-full cursor-default items-center justify-center gap-2 rounded-full bg-gradient-to-br from-indigo-800 to-violet-700 px-5 text-sm font-extrabold tracking-tight text-white shadow-[0_14px_36px_-10px_rgba(49,46,129,0.5)] ring-1 ring-white/25 transition hover:brightness-[1.05] active:scale-[0.99] sm:h-14 sm:text-base"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/30 bg-white/15" aria-hidden>
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
                className="ui-press inline-flex h-12 w-full cursor-default items-center justify-center gap-2 rounded-full border border-indigo-200/85 bg-white/90 px-5 text-sm font-extrabold tracking-tight text-indigo-950 shadow-md shadow-indigo-500/10 backdrop-blur-sm transition hover:brightness-[1.03] active:scale-[0.99] sm:h-14 sm:text-base"
              >
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-indigo-200/60 bg-indigo-50/50 text-[1.05rem] leading-none"
                  aria-hidden
                >
                  🔑
                </span>
                {t(locale, "home.cta.open")}
              </button>
            </div>

            <p
              className="mt-6 max-w-sm px-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-indigo-900/38 tabular-nums sm:mt-7 sm:px-0 sm:text-[0.72rem] lg:text-left"
              aria-live="polite"
            >
              {tReplace(locale, "home.stats.line", { count: totalFmt })}
            </p>
          </div>

          <div className="flex min-w-0 w-full justify-center">
            {/* Skärmdumpar: lägg PNG i public/ (mapsies-home-mac.png, mapsies-home-phone-left.png, mapsies-home-phone-right.png) och sätt props nedan. */}
            <HomeDeviceMockup locale={locale} />
          </div>
        </div>
      </main>

      {step ? (
        <div
          className="mapsies-home-modal-backdrop-in fixed inset-0 z-40 flex items-end justify-center bg-indigo-950/45 p-3 pt-14 backdrop-blur-[3px] sm:items-center sm:p-4"
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
          <div className="mapsies-home-modal-panel-in relative z-10 w-full max-w-md overflow-hidden rounded-[1.75rem] border border-indigo-200/75 bg-white/92 shadow-2xl shadow-indigo-950/20">
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
                      aria-busy={busy}
                      className="ui-press mt-1 w-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 py-3 text-sm font-extrabold text-white shadow-md shadow-indigo-500/20 transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {busy ? t(locale, "unlock.ctaBusy") : t(locale, "home.step.open.submit")}
                    </button>
                    {busy ? (
                      <div className="home-cta-progress mt-2" aria-hidden>
                        <div className="home-cta-progress__inner" />
                      </div>
                    ) : null}
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
