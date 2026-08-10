"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDownIcon } from "./icons";
import { SurpriseMeButton } from "./surprise-me-button";
import { isCollectionSort, type CollectionSort } from "@/lib/collection-sort";
import {
  CollectionTagPills,
  CollectionFacetPicker,
  CollectionActiveFilter,
  CollectionSortSelector,
  CollectionTypeSelector,
  CollectionYearRange,
  ALL_COLLECTION_TAGS,
  type CollectionItemType,
} from "./collection-filter-controls";

const DEBOUNCE_MS = 1000;

export function CollectionFilters({
  designers,
  producers,
  seriesList,
  availableMinYear,
  availableMaxYear,
  surpriseDeckIds,
  surpriseDeckIdsWithImages,
  surpriseCoinIds,
  surpriseCoinIdsWithImages,
}: {
  designers: string[];
  producers: string[];
  seriesList: string[];
  availableMinYear: number;
  availableMaxYear: number;
  surpriseDeckIds: string[];
  surpriseDeckIdsWithImages: string[];
  surpriseCoinIds: string[];
  surpriseCoinIdsWithImages: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const q = searchParams.get("q") ?? "";
  const selectedDesigners = searchParams.getAll("designer");
  const selectedProducers = searchParams.getAll("producer");
  const selectedSeries = searchParams.getAll("series");
  const tags = searchParams.getAll("tag");
  const type = searchParams.get("type") ?? "all";
  const rawSort = searchParams.get("sort") ?? "";
  const sort: CollectionSort = isCollectionSort(rawSort) ? rawSort : "featured";
  const rawMinYear = searchParams.get("minYear");
  const rawMaxYear = searchParams.get("maxYear");
  const urlMinYear = rawMinYear ? Number(rawMinYear) : null;
  const urlMaxYear = rawMaxYear ? Number(rawMaxYear) : null;
  const selectedMinYear = urlMinYear !== null && Number.isInteger(urlMinYear)
    ? Math.max(availableMinYear, Math.min(urlMinYear, availableMaxYear))
    : availableMinYear;
  const selectedMaxYear = urlMaxYear !== null && Number.isInteger(urlMaxYear)
    ? Math.max(selectedMinYear, Math.min(urlMaxYear, availableMaxYear))
    : availableMaxYear;
  const hasYearFilter =
    selectedMinYear !== availableMinYear || selectedMaxYear !== availableMaxYear;
  // "creator" isn't a filter surfaced in this UI (see collection/page.tsx) — it's a link-only
  // param from the homepage's featured-creator cards — but it still needs to count here so
  // "Clear all" appears and the extra filters start expanded when arriving via that link.
  const creator = searchParams.get("creator") ?? "";
  const advancedFilterCount =
    selectedDesigners.length +
    selectedProducers.length +
    selectedSeries.length +
    (hasYearFilter ? 1 : 0);
  const nonSearchFilterCount =
    advancedFilterCount + (creator ? 1 : 0) + tags.length;
  const hasFilters = Boolean(q) || nonSearchFilterCount > 0 || type !== "all";

  // On mobile the extra filters start collapsed to save space, unless some are already
  // applied (e.g. arriving from a Stats page link) — then show them open so nothing's hidden.
  const [expanded, setExpanded] = useState(() => advancedFilterCount > 0 || Boolean(creator));

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

  function handleTypeChange(value: CollectionItemType) {
    pushParams((params) => {
      if (value === "all") params.delete("type");
      else params.set("type", value);
    });
  }

  function handleSortChange(value: CollectionSort) {
    pushParams((params) => {
      if (value === "featured") params.delete("sort");
      else params.set("sort", value);
      if (value === "random") {
        params.set("randomSeed", String(crypto.getRandomValues(new Uint32Array(1))[0]));
      } else {
        params.delete("randomSeed");
      }
    });
  }

  function addFacet(key: "designer" | "producer" | "series", value: string) {
    pushParams((params) => {
      const current = params.getAll(key);
      if (!current.includes(value)) params.append(key, value);
    });
  }

  function removeParam(key: string, value?: string) {
    pushParams((params) => {
      if (value === undefined) {
        params.delete(key);
        return;
      }
      const remaining = params.getAll(key).filter((item) => item !== value);
      params.delete(key);
      for (const item of remaining) params.append(key, item);
    });
  }

  function handleTagToggle(tag: string, checked: boolean) {
    pushParams((params) => {
      const remaining = params.getAll("tag").filter((t) => t !== tag);
      params.delete("tag");
      for (const t of checked ? [...remaining, tag] : remaining) params.append("tag", t);
    });
  }

  function commitYearRange(minYear: number, maxYear: number) {
    pushParams((params) => {
      if (minYear === availableMinYear && maxYear === availableMaxYear) {
        params.delete("minYear");
        params.delete("maxYear");
      } else {
        params.set("minYear", String(minYear));
        params.set("maxYear", String(maxYear));
      }
    });
  }

  function clearAll() {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setExpanded(false);
    startTransition(() => router.push("/collection"));
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-felt-line bg-felt-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CollectionTypeSelector value={type as CollectionItemType} onChange={handleTypeChange} />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
          <CollectionSortSelector
            value={sort}
            onChange={handleSortChange}
            includeFeatured
          />
          <SurpriseMeButton
            preferredDeckIds={surpriseDeckIdsWithImages}
            fallbackDeckIds={surpriseDeckIds}
            preferredCoinIds={surpriseCoinIdsWithImages}
            fallbackCoinIds={surpriseCoinIds}
          />
        </div>
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
      </div>

      <div>
        <CollectionTagPills
          availableTags={ALL_COLLECTION_TAGS}
          selectedTags={tags}
          onToggle={handleTagToggle}
          useCheckboxes
        />
      </div>

      <div className="border-t border-felt-line pt-3">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-brass">
            Advanced filters
            {advancedFilterCount > 0 && (
              <span className="rounded-full bg-brass px-1.5 py-0.5 font-sans text-[10px] tracking-normal text-felt-bg">
                {advancedFilterCount}
              </span>
            )}
          </span>
          <ChevronDownIcon
            className={`h-4 w-4 text-felt-sub transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {expanded && (
          <div className="mt-4 flex flex-col gap-4 border-t border-felt-line/70 pt-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <CollectionFacetPicker
                label="Creators / designers"
                options={designers}
                selected={selectedDesigners}
                onAdd={(value) => addFacet("designer", value)}
              />
              <CollectionFacetPicker
                label="Producers / publishers"
                options={producers}
                selected={selectedProducers}
                onAdd={(value) => addFacet("producer", value)}
              />
              <CollectionFacetPicker
                label={type === "coin" ? "Associated decks" : "Series"}
                options={seriesList}
                selected={selectedSeries}
                onAdd={(value) => addFacet("series", value)}
              />
            </div>
            <CollectionYearRange
              key={`${selectedMinYear}-${selectedMaxYear}`}
              availableMinYear={availableMinYear}
              availableMaxYear={availableMaxYear}
              selectedMinYear={selectedMinYear}
              selectedMaxYear={selectedMaxYear}
              onCommit={commitYearRange}
            />
          </div>
        )}
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 border-t border-felt-line pt-3">
          {q && <CollectionActiveFilter label={`Search: ${q}`} onRemove={() => removeParam("q")} />}
          {type !== "all" && (
            <CollectionActiveFilter
              label={type === "deck" ? "Decks" : "Coins"}
              onRemove={() => removeParam("type")}
            />
          )}
          {creator && <CollectionActiveFilter label={creator} onRemove={() => removeParam("creator")} />}
          {selectedDesigners.map((value) => (
            <CollectionActiveFilter
              key={`designer-${value}`}
              label={value}
              onRemove={() => removeParam("designer", value)}
            />
          ))}
          {selectedProducers.map((value) => (
            <CollectionActiveFilter
              key={`producer-${value}`}
              label={value}
              onRemove={() => removeParam("producer", value)}
            />
          ))}
          {selectedSeries.map((value) => (
            <CollectionActiveFilter
              key={`series-${value}`}
              label={value}
              onRemove={() => removeParam("series", value)}
            />
          ))}
          {tags.map((value) => (
            <CollectionActiveFilter key={`tag-${value}`} label={value} onRemove={() => removeParam("tag", value)} />
          ))}
          {hasYearFilter && (
            <CollectionActiveFilter
              label={`${selectedMinYear}–${selectedMaxYear}`}
              onRemove={() => {
                pushParams((params) => {
                  params.delete("minYear");
                  params.delete("maxYear");
                });
              }}
            />
          )}
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
