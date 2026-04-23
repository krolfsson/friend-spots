import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type HomeDeviceMockupProps = {
  locale: Locale;
  /** Desktop — t.ex. `/cph1.png` i `public/` */
  macScreenSrc?: string;
  /** iPhone längst till vänster (bakom den andra). */
  phoneLeftScreenSrc?: string;
  /** iPhone närmast Mac (ligger ovanpå vänster-telefonen). */
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
  narrow,
}: {
  screenSrc?: string;
  placeholderLabel: string;
  island: boolean;
  /** Något smalare bakre telefon i stacken. */
  narrow?: boolean;
}) {
  const w = narrow ? "max-w-[4.95rem]" : "max-w-[5.35rem]";
  return (
    <div
      className={[
        "relative w-full shrink-0",
        w,
        "drop-shadow-[0_18px_36px_rgba(30,27,75,0.4)]",
        "before:pointer-events-none before:absolute before:-inset-3 before:rounded-[2rem] before:bg-gradient-to-b before:from-indigo-500/14 before:via-violet-500/10 before:to-transparent before:blur-md before:content-['']",
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
 * MacBook i samma storlek som tidigare (~28rem), två iPhones stående till vänster —
 * överlappar varandra och skärmens vänsterkant, med djupa skuggor.
 */
export function HomeDeviceMockup({
  locale,
  macScreenSrc,
  phoneLeftScreenSrc,
  phoneRightScreenSrc,
  phoneScreenSrc,
}: HomeDeviceMockupProps) {
  const rearSrc = phoneLeftScreenSrc ?? phoneScreenSrc;
  const frontSrc = phoneRightScreenSrc ?? phoneScreenSrc;

  const desktopLabel = t(locale, "home.mockup.placeholderDesktop");
  const phoneLabel = t(locale, "home.mockup.placeholderPhone");

  return (
    <div className="mx-auto w-[min(100%,28rem)] max-w-[28rem] shrink-0 select-none overflow-visible">
      <div className="relative overflow-visible pb-1 pt-4 sm:pt-6">
        <div
          className="pointer-events-none absolute bottom-0 left-[6%] right-[6%] h-10 rounded-[100%] bg-gradient-to-r from-indigo-600/[0.08] via-violet-600/[0.12] to-fuchsia-500/[0.08] blur-2xl"
          aria-hidden
        />

        {/* Två iPhones till vänster om Mac: bakre + främre (överlappar varandra & Mac) */}
        <div
          className="pointer-events-none absolute bottom-[2px] left-0 z-30 flex items-end sm:bottom-[3px]"
          aria-hidden
        >
          <div className="relative z-20 w-[min(32%,5.1rem)] max-w-[5.1rem] -translate-x-[8%] sm:-translate-x-[4%] sm:-mr-[2.15rem]">
            <PhoneFrame screenSrc={rearSrc} placeholderLabel={phoneLabel} island narrow />
          </div>
          <div className="relative z-40 -ml-[2.35rem] w-[min(34%,5.45rem)] max-w-[5.45rem] sm:-ml-[2.65rem]">
            <PhoneFrame screenSrc={frontSrc} placeholderLabel={phoneLabel} island />
          </div>
        </div>

        {/* MacBook — samma proportioner som tidigare singel-layout */}
        <div
          className={[
            "relative z-10 mx-auto w-full max-w-[28rem]",
            "drop-shadow-[0_28px_56px_-12px_rgba(30,27,75,0.42)]",
            "before:pointer-events-none before:absolute before:-inset-x-3 before:-top-5 before:bottom-[-4px] before:rounded-[2rem] before:bg-gradient-to-b before:from-indigo-400/14 before:via-violet-500/10 before:to-transparent before:blur-2xl before:content-['']",
          ].join(" ")}
        >
          <div className="rounded-t-[1.15rem] border border-slate-300/90 bg-gradient-to-b from-slate-200 via-slate-200 to-slate-300 p-[9px] shadow-[0_28px_60px_-12px_rgba(15,23,42,0.35)]">
            <div className="overflow-hidden rounded-[0.55rem] bg-slate-950 p-[6px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)]">
              <div className="relative flex aspect-[16/10] flex-col overflow-hidden rounded-[0.35rem] bg-[#0f172a] shadow-inner ring-1 ring-black/45">
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
            className="h-[11px] rounded-b-[0.65rem] border border-t-0 border-slate-300/80 bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_12px_24px_-8px_rgba(15,23,42,0.28)]"
            aria-hidden
          />
        </div>
      </div>

      <p className="mt-2 text-center text-[10px] font-semibold leading-snug tracking-wide text-indigo-900/40 sm:mt-3">
        {t(locale, "home.mockup.caption")}
      </p>
    </div>
  );
}
