"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import {
  updateDeckReleaseYear,
  type QuickReleaseYearState,
} from "@/app/(app)/decks/actions";
import { CollectionActiveFilter } from "@/components/collection-filter-controls";
import { CollectionFilterPanel } from "@/components/collection-filter-panel";

interface MissingYearDeck {
  id: string;
  name: string;
  series: string | null;
  producer: string | null;
  designers: string[];
}

export function MissingYearsWorkbench({ initialDecks }: { initialDecks: MissingYearDeck[] }) {
  // Keep the original rows for this working session so successful saves do not cause the table
  // to jump while the owner is moving quickly from one field to the next.
  const [decks] = useState(initialDecks);
  const [query, setQuery] = useState("");
  const [series, setSeries] = useState("");
  const [producer, setProducer] = useState("");
  const [artist, setArtist] = useState("");

  const options = useMemo(
    () => ({
      series: uniqueSorted(decks.map((deck) => deck.series)),
      producers: uniqueSorted(decks.map((deck) => deck.producer)),
      artists: uniqueSorted(decks.flatMap((deck) => deck.designers)),
    }),
    [decks]
  );
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleDecks = decks.filter(
    (deck) =>
      (!normalizedQuery ||
        [deck.name, deck.series, deck.producer, ...deck.designers].some((value) =>
          value?.toLocaleLowerCase().includes(normalizedQuery)
        )) &&
      (!series || deck.series === series) &&
      (!producer || deck.producer === producer) &&
      (!artist || deck.designers.includes(artist))
  );
  const activeFilterCount = Number(Boolean(series)) + Number(Boolean(producer)) + Number(Boolean(artist));
  const hasFilters = Boolean(query || activeFilterCount);

  function clearFilters() {
    setQuery("");
    setSeries("");
    setProducer("");
    setArtist("");
  }

  return (
    <div className="flex flex-col gap-4">
      <CollectionFilterPanel
        searchControl={
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search deck, Series, producer, or artist…"
            aria-label="Search decks missing a year"
            className="w-full rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink placeholder:text-felt-sub/60 outline-none focus:border-brass"
          />
        }
        sortControl={null}
        surpriseControl={null}
        advancedFilterCount={activeFilterCount}
        resultCount={visibleDecks.length}
        advancedControls={
          <div className="grid gap-3 sm:grid-cols-3">
            <FilterSelect label="Series" value={series} options={options.series} onChange={setSeries} />
            <FilterSelect label="Producer" value={producer} options={options.producers} onChange={setProducer} />
            <FilterSelect label="Artist" value={artist} options={options.artists} onChange={setArtist} />
          </div>
        }
        activeFilters={
          hasFilters ? (
            <>
              {query && <CollectionActiveFilter label={`Search: ${query}`} onRemove={() => setQuery("")} />}
              {series && <CollectionActiveFilter label={series} onRemove={() => setSeries("")} />}
              {producer && <CollectionActiveFilter label={producer} onRemove={() => setProducer("")} />}
              {artist && <CollectionActiveFilter label={artist} onRemove={() => setArtist("")} />}
            </>
          ) : undefined
        }
        onClear={hasFilters ? clearFilters : undefined}
      />

      <div className="overflow-x-auto rounded-lg border border-felt-line bg-felt-surface">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-felt-header text-xs uppercase tracking-[0.12em] text-brass">
            <tr>
              <th className="px-4 py-3 font-semibold">Deck</th>
              <th className="px-4 py-3 font-semibold">Series</th>
              <th className="px-4 py-3 font-semibold">Producer</th>
              <th className="px-4 py-3 font-semibold">Artist</th>
              <th className="w-36 px-4 py-3 font-semibold">Launch year</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-felt-line">
            {visibleDecks.map((deck) => (
              <tr key={deck.id} className="transition-colors hover:bg-felt-surface-2/50">
                <td className="px-4 py-3">
                  <Link
                    href={`/decks/${deck.id}`}
                    prefetch={false}
                    className="font-display font-semibold text-felt-ink hover:text-brass"
                  >
                    {deck.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-felt-sub">{deck.series ?? "—"}</td>
                <td className="px-4 py-3 text-felt-sub">{deck.producer ?? "—"}</td>
                <td className="px-4 py-3 text-felt-sub">{deck.designers.join(" / ") || "—"}</td>
                <td className="px-4 py-2.5"><QuickYearField deckId={deck.id} deckName={deck.name} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {visibleDecks.length === 0 && (
          <p className="px-4 py-12 text-center text-felt-sub">
            {decks.length === 0 ? "Every deck has a launch year." : "No decks match these filters."}
          </p>
        )}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-felt-sub">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass"
      >
        <option value="">All {label.toLocaleLowerCase()}</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function QuickYearField({ deckId, deckName }: { deckId: string; deckName: string }) {
  const action = updateDeckReleaseYear.bind(null, deckId);
  const [state, formAction, pending] = useActionState<QuickReleaseYearState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);
  const lastSavedYear = useRef("");
  const [localError, setLocalError] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (state.status === "saved" && state.savedYear) {
      lastSavedYear.current = String(state.savedYear);
    }
  }, [state]);

  function save(value: string) {
    const year = value.trim();
    if (!year || year === lastSavedYear.current) return;
    if (!/^\d{4}$/.test(year)) {
      setLocalError("Use 4 digits");
      return;
    }
    setLocalError("");
    setDirty(false);
    formRef.current?.requestSubmit();
  }

  const feedback = pending
    ? "Saving…"
    : localError
      ? localError
      : dirty
        ? ""
        : state.message ?? "";
  const isError = Boolean(localError) || (!dirty && state.status === "error");

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <label className="sr-only" htmlFor={`release-year-${deckId}`}>Launch year for {deckName}</label>
      <input
        id={`release-year-${deckId}`}
        name="releaseYear"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        pattern="[0-9]{4}"
        aria-invalid={isError}
        onChange={() => {
          setDirty(true);
          setLocalError("");
        }}
        onBlur={(event) => save(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={`w-20 rounded-md border bg-felt-bg px-2.5 py-1.5 text-center font-mono text-sm tabular-nums text-felt-ink outline-none focus:border-brass ${
          isError ? "border-brick" : state.status === "saved" && !dirty ? "border-sage" : "border-felt-line"
        }`}
      />
      <span
        aria-live="polite"
        className={`min-w-14 text-[11px] ${isError ? "text-brick" : state.status === "saved" && !dirty ? "text-sage" : "text-felt-sub"}`}
      >
        {feedback}
      </span>
    </form>
  );
}

function uniqueSorted(values: Array<string | null>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((a, b) =>
    a.localeCompare(b)
  );
}
