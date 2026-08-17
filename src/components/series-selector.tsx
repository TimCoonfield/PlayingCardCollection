"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface SeriesOption {
  id: string;
  name: string;
}

export function SeriesSelector({
  options,
  defaultSeriesId,
  defaultSeriesName,
  suggestedName,
}: {
  options: SeriesOption[];
  defaultSeriesId?: string;
  defaultSeriesName?: string;
  suggestedName?: string;
}) {
  const [query, setQuery] = useState(defaultSeriesName ?? "");
  const [selectedId, setSelectedId] = useState(defaultSeriesId ?? "");
  const [newSeriesName, setNewSeriesName] = useState("");
  const [open, setOpen] = useState(false);
  const lastSuggestion = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!suggestedName || suggestedName === lastSuggestion.current) return;
    lastSuggestion.current = suggestedName;
    const exact = options.find((option) => option.name === suggestedName.trim());
    setQuery(suggestedName.trim());
    setSelectedId(exact?.id ?? "");
    setNewSeriesName("");
    setOpen(true);
  }, [options, suggestedName]);

  const trimmed = query.trim();
  const exact = options.find((option) => option.name === trimmed);
  const matches = useMemo(() => {
    const normalized = trimmed.toLocaleLowerCase();
    if (!normalized) return options.slice(0, 8);
    return options
      .filter((option) => option.name.toLocaleLowerCase().includes(normalized))
      .sort((a, b) => {
        const aName = a.name.toLocaleLowerCase();
        const bName = b.name.toLocaleLowerCase();
        const aRank = aName === normalized ? 0 : aName.startsWith(normalized) ? 1 : 2;
        const bRank = bName === normalized ? 0 : bName.startsWith(normalized) ? 1 : 2;
        return aRank - bRank || a.name.localeCompare(b.name);
      })
      .slice(0, 8);
  }, [options, trimmed]);

  function choose(option: SeriesOption) {
    setQuery(option.name);
    setSelectedId(option.id);
    setNewSeriesName("");
    setOpen(false);
  }

  function chooseNew() {
    if (!trimmed) return;
    setSelectedId("");
    setNewSeriesName(trimmed);
    setQuery(trimmed);
    setOpen(false);
  }

  function clear() {
    setQuery("");
    setSelectedId("");
    setNewSeriesName("");
    setOpen(false);
  }

  const selectedName = selectedId
    ? options.find((option) => option.id === selectedId)?.name
    : newSeriesName || undefined;

  return (
    <div className="relative">
      <input type="hidden" name="seriesId" value={selectedId} />
      <input type="hidden" name="newSeriesName" value={newSeriesName} />
      <div className="flex gap-2">
        <input
          type="search"
          name="seriesQuery"
          role="combobox"
          aria-expanded={open}
          aria-controls="series-options"
          aria-autocomplete="list"
          value={query}
          placeholder="Search Series…"
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (exact) choose(exact);
            else setOpen(false);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedId("");
            setNewSeriesName("");
            setOpen(true);
          }}
          className="w-full rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass"
        />
        {(query || selectedId || newSeriesName) && (
          <button
            type="button"
            onClick={clear}
            className="rounded-md border border-felt-line px-3 text-xs text-felt-sub hover:border-brass hover:text-brass"
          >
            Clear
          </button>
        )}
      </div>

      {selectedName && (
        <p className="mt-1 text-xs text-sage">
          {newSeriesName ? `New Series: ${selectedName}` : `Selected: ${selectedName}`}
        </p>
      )}

      {open && (
        <div
          id="series-options"
          role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-felt-line bg-felt-surface p-1 shadow-xl shadow-black/30"
        >
          {matches.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              aria-selected={option.id === selectedId}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
              className="block w-full rounded px-3 py-2 text-left text-sm text-felt-ink hover:bg-felt-surface-2"
            >
              {option.name}
            </button>
          ))}
          {trimmed && !exact && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={chooseNew}
              className="block w-full rounded px-3 py-2 text-left text-sm font-medium text-brass hover:bg-felt-surface-2"
            >
              Create &ldquo;{trimmed}&rdquo; as new Series
            </button>
          )}
          {matches.length === 0 && (!trimmed || exact) && (
            <p className="px-3 py-2 text-sm text-felt-sub">No Series found.</p>
          )}
        </div>
      )}
    </div>
  );
}
