"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateRoomLandingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pin, setPin] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
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
          slug: slug.trim() || undefined,
          pin: pin.trim(),
          pinConfirm: pinConfirm.trim(),
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
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-xs font-extrabold text-indigo-900/80">
        Namn (valfritt)
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="t.ex. Sommarresan 2026"
          className="mt-1 w-full rounded-2xl border border-fuchsia-200/70 bg-white/90 px-4 py-3 text-sm font-semibold text-indigo-950 outline-none focus:ring-4 focus:ring-fuchsia-300/50"
        />
      </label>
      <label className="block text-xs font-extrabold text-indigo-900/80">
        Adress i webbläsaren (valfritt)
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="tom = genereras automatiskt"
          className="mt-1 w-full rounded-2xl border border-indigo-200/70 bg-white/90 px-4 py-3 text-sm font-semibold text-indigo-950 outline-none focus:ring-4 focus:ring-indigo-300/45"
        />
        <span className="mt-1 block text-[11px] font-bold text-indigo-900/45">
          Blir en sökväg som <span className="text-indigo-800">…/mitt-namn</span>
        </span>
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
          className="mt-1 w-full rounded-2xl border border-fuchsia-200/70 bg-white/90 px-4 py-3 text-base font-semibold tracking-widest text-indigo-950 outline-none focus:ring-4 focus:ring-fuchsia-300/50"
        />
      </label>
      <label className="block text-xs font-extrabold text-indigo-900/80">
        Upprepa pinkod
        <input
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          value={pinConfirm}
          onChange={(e) => setPinConfirm(e.target.value)}
          required
          minLength={4}
          className="mt-1 w-full rounded-2xl border border-fuchsia-200/70 bg-white/90 px-4 py-3 text-base font-semibold tracking-widest text-indigo-950 outline-none focus:ring-4 focus:ring-fuchsia-300/50"
        />
      </label>
      {error ? <p className="text-sm font-bold text-rose-600">{error}</p> : null}
      <button
        type="submit"
        disabled={busy || pin.trim().length < 4 || pinConfirm.trim().length < 4}
        className="w-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 py-3 text-sm font-extrabold text-white transition enabled:hover:brightness-110 enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Skapar…" : "Skapa karta"}
      </button>
    </form>
  );
}
