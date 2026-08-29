"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export interface CreatorOption {
  id: string;
  name: string;
}

interface PickerNames {
  query: string;
  creatorId: string;
  newCreatorName: string;
}

export function CreatorSelector({
  options,
  names,
  defaultCreator,
  suggestedName,
}: {
  options: CreatorOption[];
  names: PickerNames;
  defaultCreator?: CreatorOption;
  suggestedName?: string;
}) {
  return (
    <CreatorPicker
      options={options}
      names={names}
      defaultCreator={defaultCreator}
      suggestedName={suggestedName}
    />
  );
}

export function CreatorMultiSelector({
  options,
  defaultCreators = [],
  suggestedNames,
}: {
  options: CreatorOption[];
  defaultCreators?: CreatorOption[];
  suggestedNames?: string[];
}) {
  type CreatorPickerItem = {
    key: number;
    creator?: CreatorOption;
    suggestion?: string;
  };
  const nextKey = useRef(defaultCreators.length);
  const [items, setItems] = useState<CreatorPickerItem[]>(() =>
    defaultCreators.map((creator, key) => ({ key, creator }))
  );
  const makeItem = (creator?: CreatorOption, suggestion?: string) => ({
    key: nextKey.current++,
    creator,
    suggestion,
  });
  const lastSuggestion = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!suggestedNames) return;
    const token = suggestedNames.join("\u0000");
    if (token === lastSuggestion.current) return;
    lastSuggestion.current = token;
    setItems(
      suggestedNames.map((name) =>
        makeItem(options.find((option) => option.name === name), name)
      )
    );
  }, [options, suggestedNames]);

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.key} className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <CreatorPicker
              options={options}
              names={{
                query: "designerQueries",
                creatorId: "designerCreatorIds",
                newCreatorName: "newDesignerNames",
              }}
              defaultCreator={item.creator}
              suggestedName={item.suggestion}
            />
          </div>
          <button
            type="button"
            onClick={() => setItems((current) => current.filter(({ key }) => key !== item.key))}
            className="mt-2 shrink-0 text-xs text-felt-sub hover:text-brick"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems((current) => [...current, makeItem()])}
        className="self-start rounded-md border border-felt-line px-3 py-1.5 text-xs text-felt-sub hover:border-brass hover:text-brass"
      >
        + Add designer
      </button>
    </div>
  );
}

function CreatorPicker({
  options,
  names,
  defaultCreator,
  suggestedName,
}: {
  options: CreatorOption[];
  names: PickerNames;
  defaultCreator?: CreatorOption;
  suggestedName?: string;
}) {
  const listId = useId();
  const [query, setQuery] = useState(defaultCreator?.name ?? suggestedName ?? "");
  const [selectedId, setSelectedId] = useState(defaultCreator?.id ?? "");
  const [newCreatorName, setNewCreatorName] = useState("");
  const [open, setOpen] = useState(false);
  const lastSuggestion = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!suggestedName || suggestedName === lastSuggestion.current) return;
    lastSuggestion.current = suggestedName;
    const trimmedSuggestion = suggestedName.trim();
    const exact = options.find((option) => option.name === trimmedSuggestion);
    setQuery(trimmedSuggestion);
    setSelectedId(exact?.id ?? "");
    setNewCreatorName("");
    setOpen(true);
  }, [options, suggestedName]);

  const trimmed = query.trim();
  const exact = options.find((option) => option.name === trimmed);
  const matches = useMemo(() => {
    const normalized = trimmed.toLocaleLowerCase();
    if (!normalized) return options.slice(0, 8);
    return options
      .filter((option) => option.name.toLocaleLowerCase().includes(normalized))
      .sort((left, right) => {
        const leftName = left.name.toLocaleLowerCase();
        const rightName = right.name.toLocaleLowerCase();
        const leftRank = leftName === normalized ? 0 : leftName.startsWith(normalized) ? 1 : 2;
        const rightRank = rightName === normalized ? 0 : rightName.startsWith(normalized) ? 1 : 2;
        return leftRank - rightRank || left.name.localeCompare(right.name);
      })
      .slice(0, 8);
  }, [options, trimmed]);

  function choose(option: CreatorOption) {
    setQuery(option.name);
    setSelectedId(option.id);
    setNewCreatorName("");
    setOpen(false);
  }

  function chooseNew() {
    if (!trimmed) return;
    setSelectedId("");
    setNewCreatorName(trimmed);
    setQuery(trimmed);
    setOpen(false);
  }

  function clear() {
    setQuery("");
    setSelectedId("");
    setNewCreatorName("");
    setOpen(false);
  }

  const selectedName = selectedId
    ? options.find((option) => option.id === selectedId)?.name
    : newCreatorName || undefined;

  return (
    <div className="relative">
      <input type="hidden" name={names.creatorId} value={selectedId} />
      <input type="hidden" name={names.newCreatorName} value={newCreatorName} />
      <div className="flex gap-2">
        <input
          type="search"
          name={names.query}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          value={query}
          placeholder="Search Creators…"
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (exact) choose(exact);
            else setOpen(false);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedId("");
            setNewCreatorName("");
            setOpen(true);
          }}
          className="w-full rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass"
        />
        {(query || selectedId || newCreatorName) && (
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
          {newCreatorName ? `New Creator: ${selectedName}` : `Selected: ${selectedName}`}
        </p>
      )}

      {open && (
        <div
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-felt-line bg-felt-surface p-1 shadow-xl shadow-black/30"
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
              Create &ldquo;{trimmed}&rdquo; as new Creator
            </button>
          )}
          {matches.length === 0 && (!trimmed || exact) && (
            <p className="px-3 py-2 text-sm text-felt-sub">No Creators found.</p>
          )}
        </div>
      )}
    </div>
  );
}
