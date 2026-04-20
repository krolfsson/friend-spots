"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateRoomLandingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      if (!res.ok) throw new Error(data.error ?? "Kunde inte skapa karta");
      if (!data.slug) throw new Error("Saknar adress till kartan");
      router.push(`/${data.slug}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Okänt fel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block text-xs font-extrabold text-indigo-900/80">
        Namn (du kan ändra detta senare)
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="t.ex. Bucketlist 4 Lyfe"
          className="mt-1 box-border h-10 w-full rounded-xl border border-fuchsia-200/70 bg-white/90 px-3 text-sm font-semibold text-indigo-950 shadow-inner shadow-fuchsia-100/80 outline-none placeholder:text-indigo-900/35 placeholder:opacity-40 focus:ring-2 focus:ring-fuchsia-300/55 sm:h-11 sm:rounded-2xl sm:px-3.5"
        />
      </label>
      <label className="block text-xs font-extrabold text-indigo-900/80">
        Pinkod
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
          minLength={4}
          placeholder="t.ex. 1234"
          className="mt-1 box-border h-10 w-full rounded-xl border border-fuchsia-200/70 bg-white/90 px-3 text-base font-semibold tracking-widest text-indigo-950 shadow-inner shadow-fuchsia-100/80 outline-none placeholder:text-sm placeholder:tracking-normal placeholder:text-indigo-900/35 placeholder:opacity-40 focus:ring-2 focus:ring-fuchsia-300/55 sm:h-11 sm:rounded-2xl sm:px-3.5"
        />
      </label>
      {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy || pin.trim().length < 4}
        className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 py-2.5 text-sm font-extrabold text-white transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 sm:py-3"
      >
        {busy ? "Skapar…" : "Skapa karta"}
      </button>
    </form>
  );
}
