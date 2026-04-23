import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/**
 * Statisk produkt-preview i laptop-ram (ingen extern bild krävs).
 * Byt gärna mot `next/image` + `/public/mapsies-home-preview.png` när ni har en riktig skärmdump.
 */
export function HomeMacBookMockup({ locale }: { locale: Locale }) {
  const city = locale === "en" ? "Stockholm" : "Stockholm";
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,26rem)] select-none">
      <div className="rounded-t-[1.15rem] border border-slate-300/90 bg-gradient-to-b from-slate-200 via-slate-200 to-slate-300 p-[9px] shadow-[0_28px_60px_-12px_rgba(15,23,42,0.35)]">
        <div className="overflow-hidden rounded-[0.55rem] bg-slate-950 p-[6px] shadow-[inset_0_2px_8px_rgba(0,0,0,0.45)]">
          <div className="relative flex aspect-[16/10] flex-col overflow-hidden rounded-[0.35rem] bg-[#f8fafc] shadow-inner">
            {/* Window chrome */}
            <div className="flex h-7 shrink-0 items-center gap-2 border-b border-slate-200/90 bg-white/95 px-2.5">
              <span className="flex gap-1" aria-hidden>
                <span className="h-2 w-2 rounded-full bg-[#ff5f57]" />
                <span className="h-2 w-2 rounded-full bg-[#febc2e]" />
                <span className="h-2 w-2 rounded-full bg-[#28c840]" />
              </span>
              <span className="min-w-0 flex-1 truncate text-center text-[10px] font-bold tracking-tight text-slate-500">
                Mapsies · {city}
              </span>
            </div>
            {/* Fake app body */}
            <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-2">
              <div className="flex flex-wrap gap-1">
                <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-extrabold text-violet-900">
                  {locale === "en" ? "Map" : "Karta"}
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-slate-600 ring-1 ring-slate-200/90">
                  {locale === "en" ? "List" : "Topplista"}
                </span>
              </div>
              <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg border border-indigo-100/90 bg-gradient-to-br from-indigo-50 via-white to-sky-50 shadow-sm">
                <div className="absolute inset-0 opacity-[0.35]" aria-hidden>
                  <div className="absolute left-[12%] top-[38%] h-3 w-3 rounded-full border-2 border-white bg-emerald-400 shadow-md shadow-emerald-600/25" />
                  <div className="absolute left-[48%] top-[22%] h-3 w-3 rounded-full border-2 border-white bg-violet-500 shadow-md shadow-violet-600/25" />
                  <div className="absolute right-[18%] top-[52%] h-3 w-3 rounded-full border-2 border-white bg-fuchsia-500 shadow-md shadow-fuchsia-600/25" />
                </div>
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-1">
                  <div className="h-6 flex-1 rounded-md bg-white/90 shadow-sm ring-1 ring-slate-200/80" />
                  <div className="h-6 w-14 rounded-md bg-gradient-to-r from-emerald-400 to-teal-500 shadow-sm" />
                </div>
              </div>
              <div className="grid shrink-0 grid-cols-2 gap-1">
                <div className="rounded-lg border border-slate-200/80 bg-white/95 p-1.5 shadow-sm">
                  <div className="text-[11px] leading-none">🍕</div>
                  <div className="mt-0.5 h-1.5 w-[70%] rounded bg-slate-200/90" />
                </div>
                <div className="rounded-lg border border-slate-200/80 bg-white/95 p-1.5 shadow-sm">
                  <div className="text-[11px] leading-none">☕</div>
                  <div className="mt-0.5 h-1.5 w-[55%] rounded bg-slate-200/90" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Base / keyboard deck */}
      <div
        className="h-[11px] rounded-b-[0.65rem] border border-t-0 border-slate-300/80 bg-gradient-to-b from-slate-300 to-slate-400 shadow-[0_12px_24px_-8px_rgba(15,23,42,0.28)]"
        aria-hidden
      />
      <p className="mt-2 text-center text-[10px] font-semibold tracking-wide text-indigo-900/40">
        {t(locale, "home.mockup.caption")}
      </p>
    </div>
  );
}
