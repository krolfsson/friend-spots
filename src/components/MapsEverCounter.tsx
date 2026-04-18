"use client";

import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3;
}

export function MapsEverCounter({ total }: { total: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (total <= 0) {
      setDisplay(0);
      return;
    }
    const start = performance.now();
    const duration = 900;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setDisplay(Math.round(easeOutCubic(t) * total));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [total]);

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white/90 via-violet-50/50 to-cyan-50/40 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_40px_rgba(99,102,241,0.12)] sm:px-5 sm:py-5">
      <div
        className="pointer-events-none absolute -right-6 -top-10 h-48 w-48 rounded-full bg-gradient-to-br from-fuchsia-400/25 to-violet-500/20 blur-2xl"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-1 text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-indigo-900/60">Kartor sedan start</p>
        <span
          className="inline-flex items-baseline gap-0.5 rounded-xl px-2 py-0.5 text-4xl font-black tabular-nums tracking-tight sm:text-5xl"
          style={{
            background: "linear-gradient(120deg, #6366f1 0%, #a855f7 35%, #ec4899 65%, #22d3ee 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            textShadow: "0 0 40px rgba(99, 102, 241, 0.15)",
          }}
        >
          {display}
        </span>
        <p className="max-w-[18rem] text-xs font-semibold leading-snug text-indigo-900/55">
          Unika kartor som skapats i appen â varje ny karta rÃ¤knas en gÃ¥ng.
        </p>
      </div>
    </div>
  );
}
