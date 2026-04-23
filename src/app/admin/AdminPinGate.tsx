"use client";

import { useState } from "react";

export function AdminPinGate({ children }: { children: React.ReactNode }) {
  const [pin, setPin] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (res.ok) {
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (authed) return <>{children}</>;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#fdf4ff] px-4">
      <div className="w-full max-w-xs">
        <p className="mb-1 text-center text-2xl font-extrabold tracking-tight text-indigo-950">
          Mapsies Admin
        </p>
        <p className="mb-6 text-center text-sm font-medium text-indigo-900/50">
          Enter your admin PIN to continue.
        </p>
        <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-3">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="h-12 w-full rounded-2xl border border-indigo-200/70 bg-white/90 px-4 text-center text-xl font-bold tracking-widest text-indigo-950 outline-none focus:ring-2 focus:ring-violet-300/60"
          />
          {error && (
            <p className="text-center text-sm font-bold text-rose-500">Wrong PIN.</p>
          )}
          <button
            type="submit"
            disabled={pin.length < 4}
            className="h-12 w-full rounded-full bg-gradient-to-br from-indigo-800 to-violet-700 font-extrabold text-white shadow-md transition hover:brightness-110 disabled:opacity-40"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}
