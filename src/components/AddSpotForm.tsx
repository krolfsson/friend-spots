"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, type CategoryId, isCategoryId } from "@/lib/categories";

type Suggestion = { placeId: string; label: string };

/** Biasar sökning mot vald stad (samma beteende oavsett vilken stad som är aktiv). */
function composePlacesAutocompleteInput(query: string, cityName?: string): string {
  const q = query.trim();
  const c = cityName?.trim();
  if (!c) return q;
  if (q.toLowerCase().includes(c.toLowerCase())) return q;
  return `${q} ${c}`.trim();
}

const GUEST_LS = "friend_spots_guest";

function useGuestContributor() {
  const [name, setName] = useState("");
  useEffect(() => {
    let v = window.localStorage.getItem(GUEST_LS);
    if (!v) {
      v = `Gäst_${Math.random().toString(36).slice(2, 8)}`;
      window.localStorage.setItem(GUEST_LS, v);
    }
    setName(v);
  }, []);
  return name;
}

export function AddSpotForm({
  citySlug,
  placeSearchBiasName,
  onSaved,
  onRequestClose,
}: {
  citySlug: string;
  /** Stad där tipset sparas — skickas med i platssök så förslag inte domineras av en annan ort. */
  placeSearchBiasName?: string;
  onSaved: () => void;
  onRequestClose?: () => void;
}) {
  const contributorName = useGuestContributor();

  const [category, setCategory] = useState<CategoryId | "">("");
  const [emoji, setEmoji] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pickOpen, setPickOpen] = useState(false);
  const [selected, setSelected] = useState<Suggestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (selected && query.trim() === selected.label.trim()) {
      setSuggestions([]);
      setSearchError(null);
      setPickOpen(false);
      return;
    }
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setSearchError(null);
      return;
    }
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const input = composePlacesAutocompleteInput(query, placeSearchBiasName);
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input }),
          signal: ctrl.signal,
        });
        const data = (await res.json()) as { suggestions?: Suggestion[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? "Autocomplete fel");
        const raw = data.suggestions ?? [];
        const seen = new Set<string>();
        const deduped = raw.filter((s) => {
          if (seen.has(s.placeId)) return false;
          seen.add(s.placeId);
          return true;
        });
        setSuggestions(deduped);
        setSearchError(null);
        setPickOpen(deduped.length > 0);
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setSuggestions([]);
        setSearchError(e instanceof Error ? e.message : "Kunde inte söka");
        setPickOpen(false);
      }
    }, 250);

    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [query, selected, placeSearchBiasName]);

  const canSave = useMemo(() => {
    return Boolean(selected && category && contributorName.trim());
  }, [selected, category, contributorName]);

  async function save() {
    if (!canSave || !selected) return;
    if (!isCategoryId(category)) return;

    setSaving(true);
    setNote(null);
    try {
      const res = await fetch("/api/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          citySlug,
          googlePlaceId: selected.placeId,
          displayName: selected.label,
          category,
          emoji: emoji.trim() || null,
          contributorName: contributorName.trim(),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Kunde inte spara");

      setQuery("");
      setSuggestions([]);
      setSelected(null);
      setEmoji("");
      setCategory("");
      setPickOpen(false);
      onSaved();
      setNote("Sparat ✨");
      window.setTimeout(() => setNote(null), 2000);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Okänt fel");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="add-tip"
      className={`y2k-panel rounded-[1.75rem] p-4 sm:p-5 ${onRequestClose ? "mt-1 border-t border-indigo-100/70 pt-4" : ""}`}
    >
      {onRequestClose ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-extrabold tracking-tight text-indigo-950">Nytt tips</p>
          <button
            type="button"
            onClick={() => onRequestClose()}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/70 text-lg font-bold text-indigo-950 shadow-sm hover:bg-white"
            aria-label="Stäng"
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-3 py-2 text-sm font-extrabold tracking-tight transition active:scale-95 ${
              category === c.id ? "y2k-chip-active" : "y2k-chip text-indigo-950 hover:-translate-y-0.5"
            }`}
          >
            <span className="mr-1">{c.emoji}</span>
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_92px] sm:items-end">
        <div className="relative">
          <input
            id="add-tip-search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            onFocus={() => {
              if (selected && query.trim() === selected.label.trim()) return;
              if (suggestions.length) setPickOpen(true);
            }}
            placeholder=""
            aria-label="Sök ställe"
            className="w-full rounded-2xl border border-fuchsia-200/70 bg-white/80 px-4 py-3 text-sm font-semibold text-indigo-950 shadow-inner shadow-fuchsia-100 outline-none ring-0 transition focus:border-transparent focus:ring-4 focus:ring-fuchsia-300/60"
          />
          {searchError ? <p className="mt-2 text-xs font-bold text-rose-600">{searchError}</p> : null}
          {pickOpen && suggestions.length ? (
            <div className="y2k-card absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl p-1">
              {suggestions.map((s) => (
                <button
                  key={s.placeId}
                  type="button"
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-indigo-950 hover:bg-fuchsia-50"
                  onClick={() => {
                    setSelected(s);
                    setQuery(s.label);
                    setPickOpen(false);
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <input
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={8}
          placeholder="🌟"
          aria-label="Emoji"
          className="rounded-2xl border border-sky-200/70 bg-white/80 py-3 text-center text-2xl leading-none shadow-inner shadow-sky-100 outline-none focus:ring-4 focus:ring-sky-300/60"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canSave || saving}
          onClick={() => void save()}
          className="rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-6 py-2.5 text-sm font-extrabold text-white transition enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Sparar…" : "Spara"}
        </button>
        {note ? <span className="text-sm font-bold text-indigo-900/70">{note}</span> : null}
      </div>
    </section>
  );
}
