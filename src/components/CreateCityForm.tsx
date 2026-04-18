"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateCityForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { city?: { slug: string }; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Kunde inte skapa stad");
      setName("");
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Okänt fel");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1 text-sm">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Stad"
            className="mt-1 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none ring-emerald-600 focus:ring-2"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Skapar…" : "Skapa"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </form>
  );
}
