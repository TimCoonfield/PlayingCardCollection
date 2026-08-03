"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "./icons";

const ALL_TAGS = [
  "Modern",
  "Vintage",
  "Antique",
  "Gilded",
  "Signed",
  "Mini",
  "Tarot",
  "Prototype",
  "Edge Painted",
];

const DEBOUNCE_MS = 1000;

export function CollectionFilters({
  designers,
  producers,
  seriesList,
}: {
  designers: string[];
  producers: string[];
  seriesList: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = searchParams.get("q") ?? "";
  const designer = searchParams.get("designer") ?? "";
  const producer = searchParams.get("producer") ?? "";
  const series = searchParams.get("series") ?? "";
  const tags = searchParams.getAll("tag");
  const type = searchParams.get("type") ?? "all";
  // "creator" isn't a filter surfaced in this UI (see collection/page.tsx) — it's a link-only
  // param from the homepage's featured-creator cards — but it still needs to count here so
  // "Clear all" appears and the extra filters start expanded when arriving via that link.
  const creator = searchParams.get("creator") ?? "";
  const nonSearchFilterCount =
    [designer, producer, series, creator].filter(Boolean).length + tags.length;
  const hasFilters = Boolean(q) || nonSearchFilterCount > 0 || type !== "all";

  // On mobile the extra filters start collapsed to save space, unless some are already
  // applied (e.g. arriving from a Stats page link) — then show them open so nothing's hidden.
  const [expanded, setExpanded] = useState(() => nonSearchFilterCount > 0);

  // Tracks the last value *this component* pushed to the URL, so the sync effect below
  // can tell "the URL changed because of our own debounce/Enter" apart from "the URL
  // changed some other way (Clear all, browser back/forward)" — only the latter should
  // touch the input's live DOM value while the user might still be typing in it.
  const lastPushedQRef = useRef(q);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (q !== lastPushedQRef.current && document.activeElement !== inputRef.current) {
      if (inputRef.current) inputRef.current.value = q;
    }
    lastPushedQRef.current = q;
  }, [q]);

  function pushParams(mutate: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.delete("page");
    startTransition(() => {
      router.push(`/collection?${params.toString()}`);
    });
  }

  function commitQ(value: string) {
    lastPushedQRef.current = value;
    pushParams((params) => {
      if (value.trim()) params.set("q", value);
      else params.delete("q");
    });
  }

  function handleQChange(value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => commitQ(value), DEBOUNCE_MS);
  }

  function handleQKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      commitQ(e.currentTarget.value);
    }
  }

  function handleTypeChange(value: "all" | "deck" | "coin") {
    pushParams((params) => {
      if (value === "all") params.delete("type");
      else params.set("type", value);
    });
  }

  function handleSelectChange(key: "designer" | "producer" | "series", value: string) {
    pushParams((params) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  function handleTagToggle(tag: string, checked: boolean) {
    pushParams((params) => {
      const remaining = params.getAll("tag").filter((t) => t !== tag);
      params.delete("tag");
      for (const t of checked ? [...remaining, tag] : remaining) params.append("tag", t);
    });
  }

  function clearAll() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setExpanded(false);
    startTransition(() => router.push("/collection"));
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-felt-line bg-felt-surface p-4">
      <div className="flex w-fit rounded-md border border-felt-line p-0.5">
        {(["all", "deck", "coin"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleTypeChange(option)}
            className={`rounded px-3 py-1 text-sm transition-colors ${
              type === option ? "bg-brass text-felt-bg" : "text-felt-sub hover:text-felt-ink"
            }`}
          >
            {option === "all" ? "All" : option === "deck" ? "Decks" : "Coins"}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="search"
            defaultValue={q}
            onChange={(e) => handleQChange(e.target.value)}
            onKeyDown={handleQKeyDown}
            placeholder="Search name, series, designer, producer, notes..."
            className="w-full rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink placeholder:text-felt-sub/60 outline-none focus:border-brass"
          />
          {isPending && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-felt-sub">
              Searching…
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="flex items-center justify-center gap-1.5 rounded-md border border-felt-line px-3 py-2 text-sm text-felt-sub hover:border-brass hover:text-felt-ink sm:hidden"
        >
          Filters
          {nonSearchFilterCount > 0 && (
            <span className="rounded-full bg-brass px-1.5 text-xs font-medium text-felt-bg">
              {nonSearchFilterCount}
            </span>
          )}
          <ChevronDownIcon
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        <select
          value={designer}
          onChange={(e) => handleSelectChange("designer", e.target.value)}
          className={`${expanded ? "flex" : "hidden"} rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass sm:flex sm:w-52`}
        >
          <option value="">All designers</option>
          {designers.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={producer}
          onChange={(e) => handleSelectChange("producer", e.target.value)}
          className={`${expanded ? "flex" : "hidden"} rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass sm:flex sm:w-52`}
        >
          <option value="">All producers</option>
          {producers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={series}
          onChange={(e) => handleSelectChange("series", e.target.value)}
          className={`${expanded ? "flex" : "hidden"} rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass sm:flex sm:w-52`}
        >
          <option value="">{type === "coin" ? "All associated decks" : "All series"}</option>
          {seriesList.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div
        className={`${expanded ? "flex" : "hidden"} flex-wrap items-center gap-x-4 gap-y-2 sm:flex`}
      >
        {ALL_TAGS.map((tag) => (
          <label key={tag} className="flex items-center gap-1.5 text-sm text-felt-sub">
            <input
              type="checkbox"
              checked={tags.includes(tag)}
              onChange={(e) => handleTagToggle(tag, e.target.checked)}
              className="accent-brass"
            />
            {tag}
          </label>
        ))}
      </div>

      {hasFilters && (
        <div>
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-felt-sub hover:text-felt-ink"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
