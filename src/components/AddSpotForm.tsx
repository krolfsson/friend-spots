"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

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
  roomSlug,
  citySlug,
  placeSearchBiasName,
  locale,
  embeddedInModal = false,
  onSaved,
  onRequestClose,
}: {
  roomSlug: string;
  citySlug: string;
  /** Stad där tipset sparas — skickas med i platssök så förslag inte domineras av en annan ort. */
  placeSearchBiasName?: string;
  locale: Locale;
  /** Ingen egen panel/stäng-knapp — ligger i gemensam modal (CityClient). */
  embeddedInModal?: boolean;
  onSaved: () => void;
  onRequestClose?: () => void;
}) {
  const contributorName = useGuestContributor();

  const categoryItems = CATEGORIES as readonly { id: CategoryId; label: string; emoji: string }[];

  const [pickedCategories, setPickedCategories] = useState<Set<CategoryId>>(new Set());
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
    return Boolean(selected && pickedCategories.size > 0 && contributorName.trim());
  }, [selected, pickedCategories, contributorName]);

  function toggleCategory(id: CategoryId) {
    setPickedCategories((prev) => {
      const n = new Set(prev);
      if (n.has(id)) {
        if (n.size <= 1) return n;
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  }

  async function save() {
    if (!canSave || !selected) return;

    setSaving(true);
    setNote(null);
    try {
      const res = await fetch("/api/spots", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Room-Slug": roomSlug },
        body: JSON.stringify({
          citySlug,
          googlePlaceId: selected.placeId,
          displayName: selected.label,
          categories: Array.from(pickedCategories),
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
      setPickedCategories(new Set());
      setPickOpen(false);
      onSaved();
      setNote(t(locale, "add.savedToast"));
      window.setTimeout(() => setNote(null), 2000);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Okänt fel");
    } finally {
      setSaving(false);
    }
  }

  const showLocalClose = Boolean(onRequestClose && !embeddedInModal);

  const inner = (
    <>
      <div className="flex flex-wrap gap-x-1 gap-y-1.5">
        {categoryItems.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => toggleCategory(c.id)}
            className={`ui-press rounded-full px-2.5 py-1.5 text-xs font-extrabold tracking-tight transition active:scale-95 sm:px-3 sm:py-2 sm:text-sm ${
              pickedCategories.has(c.id) ? "y2k-chip-active" : "y2k-chip text-indigo-950 hover:-translate-y-0.5"
            }`}
          >
            <span className="mr-0.5 sm:mr-1">{c.emoji}</span>
            {t(locale, `cat.${c.id}`)}
          </button>
        ))}
      </div>

      <div className="mt-2 flex min-w-0 max-w-full items-center gap-2">
        <div className="relative min-w-0 flex-1">
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
            placeholder={t(locale, "add.searchPlaceholder")}
            aria-label="Sök ställe"
            className="box-border h-10 w-full min-w-0 rounded-xl border border-fuchsia-200/70 bg-white/90 px-3 text-sm font-semibold text-indigo-950 shadow-inner shadow-fuchsia-100/80 outline-none ring-0 transition focus:border-transparent focus:ring-2 focus:ring-fuchsia-300/55 sm:h-11 sm:rounded-2xl sm:px-3.5"
          />
          {searchError ? <p className="mt-2 text-xs font-bold text-rose-600">{searchError}</p> : null}
          {pickOpen && suggestions.length ? (
            <div className="y2k-card absolute left-0 right-0 z-30 mt-2 max-h-64 min-w-0 overflow-auto rounded-2xl p-1">
              {suggestions.map((s) => (
                <button
                  key={s.placeId}
                  type="button"
                  className="ui-press block w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-indigo-950 hover:bg-fuchsia-50"
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

        <div className="flex shrink-0 flex-col items-end">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            maxLength={8}
            placeholder="😊"
            aria-label="Emoji"
            className="box-border h-10 w-10 rounded-xl border border-sky-200/70 bg-white/90 text-center text-lg leading-none text-indigo-950 shadow-inner shadow-sky-100/80 outline-none placeholder:text-indigo-900/35 placeholder:opacity-40 focus:ring-2 focus:ring-sky-300/55 sm:h-11 sm:w-11 sm:text-xl"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          disabled={!canSave || saving}
          onClick={() => void save()}
          className="ui-press rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 py-2 text-sm font-extrabold text-white transition enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:px-6 sm:py-2.5"
        >
          {saving ? t(locale, "add.saving") : t(locale, "add.save")}
        </button>
        {note ? <span className="text-sm font-bold text-indigo-900/70">{note}</span> : null}
      </div>
    </>
  );

  if (embeddedInModal) {
    return (
      <div id="add-tip" className="min-w-0 space-y-3">
        {inner}
      </div>
    );
  }

  return (
    <section
      id="add-tip"
      className={`y2k-panel min-w-0 max-w-full rounded-[1.75rem] p-3 sm:p-5 ${onRequestClose ? "mt-1 border-t border-indigo-100/70 pt-3" : ""}`}
    >
      {showLocalClose ? (
        <div className="mb-3 flex justify-end">
          <button
            type="button"
            onClick={() => onRequestClose?.()}
            className="ui-press grid h-10 w-10 place-items-center rounded-full border border-white/70 bg-white/70 text-lg leading-none shadow-sm hover:bg-white"
            aria-label="Stäng lägg till"
          >
            <span aria-hidden>❌</span>
          </button>
        </div>
      ) : null}
      {inner}
    </section>
  );
}
