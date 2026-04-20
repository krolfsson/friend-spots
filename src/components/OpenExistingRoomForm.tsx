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
          className="mt-1 w-full rounded-2xl border border-sky-200/70 bg-white/90 px-4 py-3 text-sm font-semibold text-indigo-950 outline-none placeholder:text-indigo-900/35 placeholder:opacity-60 focus:ring-4 focus:ring-sky-300/50"
        />
      </label>

      <button
        type="submit"
        disabled={!slug}
        className="w-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-600 py-3 text-sm font-extrabold text-white transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Öppna karta
      </button>
    </form>
  );
}

