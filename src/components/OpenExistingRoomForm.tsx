"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

function normalizeSlug(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  return v.replace(/^\/+/, "").trim();
}

export function OpenExistingRoomForm() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const slug = useMemo(() => normalizeSlug(value), [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!slug) return;
        router.push(`/${slug}`);
      }}
      className="space-y-3"
    >
      <label className="block text-xs font-extrabold text-indigo-900/80">
        Har du redan en karta?
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="t.ex. /rolfsson"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="url"
          className="mt-1 box-border h-10 w-full rounded-xl border border-sky-200/70 bg-white/90 px-3 text-sm font-semibold text-indigo-950 shadow-inner shadow-sky-100/80 outline-none placeholder:text-indigo-900/35 placeholder:opacity-40 focus:ring-2 focus:ring-sky-300/55 sm:h-11 sm:rounded-2xl sm:px-3.5"
        />
      </label>

      <button
        type="submit"
        disabled={!slug}
        className="w-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 py-2.5 text-sm font-extrabold text-white transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:py-3"
      >
        Öppna karta
      </button>
    </form>
  );
}

