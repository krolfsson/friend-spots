import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type HomeDeviceMockupProps = {
  locale: Locale;
  /** Desktop — lägg fil i `public/`, t.ex. `/mapsies-home-mac.png` */
  macScreenSrc?: string;
  /** Vänster iPhone */
  phoneLeftScreenSrc?: string;
  /** Höger iPhone */
  phoneRightScreenSrc?: string;
  /** Om bara denna sätts används samma bild i båda telefonerna. */
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

function PhoneFrame({
  screenSrc,
  placeholderLabel,
  island,
}: {
  screenSrc?: string;
  placeholderLabel: string;
  island: boolean;
}) {
  return (
    <div
      className={[
        "relative w-full max-w-[5.85rem] shrink-0",
        "drop-shadow-[0_18px_36px_rgba(30,27,75,0.38)]",
        "before:pointer-events-none before:absolute before:-inset-3 before:rounded-[2rem] before:bg-gradient-to-b before:from-indigo-500/12 before:via-violet-500/8 before:to-transparent before:blur-md before:content-['']",
      ].join(" ")}
    >
      <div
        className={[
          "rounded-[1.72rem] border border-slate-600/85 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 p-[6px]",
          "shadow-[0_22px_44px_-12px_rgba(15,23,42,0.55),0_0_0_1px_rgba(255,255,255,0.07)_inset,0_-1px_0_rgba(0,0,0,0.35)_inset]",
        ].join(" ")}
      >
        <div className="relative aspect-[9/19.35] overflow-hidden rounded-[1.38rem] bg-slate-950 ring-1 ring-black/40">
          {island && !screenSrc ? (
            <div
              className="pointer-events-none absolute left-1/2 top-[9px] z-10 h-[10px] w-[30%] -translate-x-1/2 rounded-full bg-black/92 ring-1 ring-white/12"
              aria-hidden
            />
          ) : null}
          {screenSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={screenSrc} alt="" className="h-full w-full object-cover object-top" />
          ) : (
            <ScreenPlaceholder label={placeholderLabel} variant="phone" />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * MacBook i mitten, två iPhones i porträtt på sidorna — utan rotation, med djupa skuggor.
 * Skärmbilder: `macScreenSrc`, `phoneLeftScreenSrc`, `phoneRightScreenSrc` (eller bara `phoneScreenSrc` för båda).
 */
export function HomeDeviceMockup({
  locale,
  macScreenSrc,
  phoneLeftScreenSrc,
  phoneRightScreenSrc,
  phoneScreenSrc,
}: HomeDeviceMockupProps) {
  const leftSrc = phoneLeftScreenSrc ?? phoneScreenSrc;
  const rightSrc = phoneRightScreenSrc ?? phoneScreenSrc;

  const desktopLabel = t(locale, "home.mockup.placeholderDesktop");
  const phoneLabel = t(locale, "home.mockup.placeholderPhone");

  return (
    <div className="mx-auto w-[min(100%,38rem)] max-w-[38rem] shrink-0 select-none">
      <div className="relative px-1 pb-3 pt-6 sm:px-2 sm:pb-4 sm:pt-8">
        {/* Mjuk “golv”-reflex */}
        <div
          className="pointer-events-none absolute bottom-0 left-[8%] right-[8%] h-10 rounded-[100%] bg-gradient-to-r from-indigo-600/[0.07] via-violet-600/[0.12] to-fuchsia-500/[0.07] blur-2xl"
          aria-hidden
        />

        <div className="relative z-10 flex items-end justify-center gap-0 sm:gap-1">
          {/* Vänster iPhone */}
          <div className="relative z-20 mb-[2px] w-[26%] min-w-0 max-w-[6rem] sm:-mr-3 sm:w-[24%] lg:-mr-5">
            <PhoneFrame screenSrc={leftSrc} placeholderLabel={phoneLabel} island />
          </div>

          {/* MacBook */}
          <div
            className={[
              "relative z-10 w-[min(54%,17.5rem)] min-w-0 shrink",
              "drop-shadow-[0_26px_52px_rgba(30,27,75,0.42)]",
              "before:pointer-events-none before:absolute before:-inset-x-4 before:-top-6 before:bottom-[-6px] before:rounded-[2rem] before:bg-gradient-to-b before:from-indigo-400/15 before:via-violet-500/10 before:to-transparent before:blur-2xl before:content-['']",
            ].join(" ")}
          >
            <div className="rounded-t-[1.12rem] border border-slate-300/90 bg-gradient-to-b from-slate-200 via-slate-200 to-slate-300 p-[8px] shadow-[0_26px_52px_-14px_rgba(15,23,42,0.42),0_0_0_1px_rgba(255,255,255,0.35)_inset]">
              <div className="overflow-hidden rounded-[0.5rem] bg-slate-950 p-[5px] shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                <div className="relative flex aspect-[16/10] flex-col overflow-hidden rounded-[0.32rem] bg-[#0f172a] ring-1 ring-black/50">
                  {macScreenSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
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
              className="h-[10px] rounded-b-[0.62rem] border border-t-0 border-slate-300/80 bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_14px_28px_-10px_rgba(15,23,42,0.35)]"
              aria-hidden
            />
          </div>

          {/* Höger iPhone */}
          <div className="relative z-20 mb-[2px] w-[26%] min-w-0 max-w-[6rem] sm:-ml-3 sm:w-[24%] lg:-ml-5">
            <PhoneFrame screenSrc={rightSrc} placeholderLabel={phoneLabel} island />
          </div>
        </div>
      </div>

      <p className="mt-1 text-center text-[10px] font-semibold leading-snug tracking-wide text-indigo-900/40 sm:mt-2">
        {t(locale, "home.mockup.caption")}
      </p>
    </div>
  );
}
