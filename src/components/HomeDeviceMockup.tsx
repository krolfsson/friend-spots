import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type HomeDeviceMockupProps = {
  locale: Locale;
  /** Lägg t.ex. `/mapsies-mac.png` i `public/` och skicka in här. */
  macScreenSrc?: string;
  /** Lägg t.ex. `/mapsies-iphone.png` i `public/` och skicka in här. */
  phoneScreenSrc?: string;
};

function ScreenPlaceholder({
  label,
  variant,
}: {
  label: string;
  variant: "desktop" | "phone";
}) {
  return (
    <div
      className={
        variant === "desktop"
          ? "flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-100/95 via-white to-violet-100/90 p-4 ring-1 ring-inset ring-indigo-200/55"
          : "flex h-full w-full flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-violet-100/95 via-indigo-50/95 to-sky-100/90 p-3 pt-7 ring-1 ring-inset ring-violet-200/50"
      }
    >
      <div
        className={
          variant === "desktop"
            ? "h-12 w-[72%] max-w-[10rem] rounded-lg border-2 border-dashed border-indigo-300/70 bg-white/40"
            : "h-8 w-[58%] rounded-md border-2 border-dashed border-violet-300/70 bg-white/45"
        }
        aria-hidden
      />
      <div
        className={
          variant === "desktop"
            ? "h-2.5 w-[45%] max-w-[6rem] rounded-full bg-indigo-200/80"
            : "h-2 w-[40%] rounded-full bg-violet-200/80"
        }
        aria-hidden
      />
      <p className="px-2 text-center text-[9px] font-bold uppercase tracking-[0.12em] text-indigo-500/85 sm:text-[10px]">
        {label}
      </p>
    </div>
  );
}

/**
 * MacBook med iPhone framför. Skärmarna är placeholders tills `macScreenSrc` / `phoneScreenSrc` sätts.
 */
export function HomeDeviceMockup({ locale, macScreenSrc, phoneScreenSrc }: HomeDeviceMockupProps) {
  const desktopLabel = t(locale, "home.mockup.placeholderDesktop");
  const phoneLabel = t(locale, "home.mockup.placeholderPhone");

  return (
    <div className="mx-auto w-[min(100%,28rem)] max-w-[28rem] shrink-0 select-none">
      <div className="relative pb-1">
        {/* MacBook (bakgrund) */}
        <div className="relative z-0">
          <div className="rounded-t-[1.15rem] border border-slate-300/90 bg-gradient-to-b from-slate-200 via-slate-200 to-slate-300 p-[9px] shadow-[0_28px_60px_-12px_rgba(15,23,42,0.35)]">
            <div className="overflow-hidden rounded-[0.55rem] bg-slate-950 p-[6px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)]">
              <div className="relative flex aspect-[16/10] flex-col overflow-hidden rounded-[0.35rem] bg-[#0f172a] shadow-inner">
                {macScreenSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element -- valfri statisk asset; byt till next/image vid behov
                  <img src={macScreenSrc} alt="" className="h-full w-full object-cover object-top" />
                ) : (
                  <>
                    <div className="flex h-7 shrink-0 items-center gap-2 border-b border-slate-700/80 bg-slate-900/95 px-2.5">
                      <span className="flex gap-1" aria-hidden>
                        <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                        <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                        <span className="h-2 w-2 rounded-full bg-[#28c840]" />
                      </span>
                    </div>
                    <div className="relative min-h-0 flex-1">
                      <ScreenPlaceholder label={desktopLabel} variant="desktop" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div
            className="h-[11px] rounded-b-[0.65rem] border border-t-0 border-slate-300/80 bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_12px_24px_-8px_rgba(15,23,42,0.28)]"
            aria-hidden
          />
        </div>

        {/* iPhone (framför, överlappar Mac) */}
        <div
          className="absolute bottom-[2px] left-[6%] z-20 w-[min(31%,8.75rem)] -rotate-[5deg] drop-shadow-[0_22px_40px_rgba(15,23,42,0.45)] sm:left-[8%] sm:w-[min(30%,9.25rem)]"
          style={{ transformOrigin: "center bottom" }}
        >
          <div className="rounded-[1.85rem] border border-slate-700/90 bg-gradient-to-b from-slate-800 to-slate-950 p-[7px] shadow-2xl ring-1 ring-black/25">
            <div className="relative aspect-[9/19.2] overflow-hidden rounded-[1.45rem] bg-slate-950">
              {!phoneScreenSrc ? (
                <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-[11px] w-[32%] -translate-x-1/2 rounded-full bg-black/90 ring-1 ring-white/10" aria-hidden />
              ) : null}
              {phoneScreenSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={phoneScreenSrc} alt="" className="h-full w-full object-cover object-top" />
              ) : (
                <ScreenPlaceholder label={phoneLabel} variant="phone" />
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] font-semibold tracking-wide text-indigo-900/40">
        {t(locale, "home.mockup.caption")}
      </p>
    </div>
  );
}
