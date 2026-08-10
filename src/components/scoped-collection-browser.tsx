"use client";

import { useMemo, useState } from "react";
import { CoinCard, type CoinCardData } from "./coin-card";
import { DeckCard, type DeckCardData } from "./deck-card";
import { DeckSpotlightCard } from "./deck-spotlight-card";
import { ChevronDownIcon, SearchIcon } from "./icons";
import { SurpriseMeButton } from "./surprise-me-button";
import {
  ALL_COLLECTION_TAGS,
  CURATED_COLLECTION_TAGS,
  CollectionTagPills,
  CollectionTypeSelector,
  CollectionYearRange,
  type CollectionItemType,
} from "./collection-filter-controls";

export type FilterableScopedDeck = DeckCardData & {
  releaseYear: number | null;
  notes: string | null;
};

export type FilterableScopedCoin = CoinCardData & {
  releaseYear: number | null;
  notes: string | null;
};

export function ScopedCollectionBrowser({
  decks,
  coins,
  showFeaturedDecks,
  tagSet = "curated",
}: {
  decks: FilterableScopedDeck[];
  coins: FilterableScopedCoin[];
  showFeaturedDecks: boolean;
  tagSet?: "curated" | "all";
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<CollectionItemType>("all");
  const [tags, setTags] = useState<string[]>([]);

  const yearValues = useMemo(
    () =>
      [...decks, ...coins]
        .map((item) => item.releaseYear)
        .filter((year): year is number => year !== null),
    [coins, decks]
  );
  const availableMinYear = yearValues.length > 0 ? Math.min(...yearValues) : new Date().getFullYear();
  const availableMaxYear = yearValues.length > 0 ? Math.max(...yearValues) : availableMinYear;
  const [yearRange, setYearRange] = useState<[number, number]>([
    availableMinYear,
    availableMaxYear,
  ]);
  const isFullYearRange =
    yearRange[0] === availableMinYear && yearRange[1] === availableMaxYear;

  const normalizedQuery = query.trim().toLocaleLowerCase();

  function matchesCommonFields(item: FilterableScopedDeck | FilterableScopedCoin) {
    const matchesQuery =
      !normalizedQuery ||
      [item.name, item.series, item.designer, item.producer, item.notes]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalizedQuery));
    const matchesTags = tags.every((tag) => item.tags.includes(tag));
    const matchesYear =
      isFullYearRange ||
      (item.releaseYear !== null &&
        item.releaseYear >= yearRange[0] &&
        item.releaseYear <= yearRange[1]);
    return matchesQuery && matchesTags && matchesYear;
  }

  const filteredDecks = type === "coin" ? [] : decks.filter(matchesCommonFields);
  const filteredCoins = type === "deck" ? [] : coins.filter(matchesCommonFields);
  const filteredItems = [
    ...filteredDecks.map((deck) => ({ kind: "deck" as const, item: deck })),
    ...filteredCoins.map((coin) => ({ kind: "coin" as const, item: coin })),
  ].sort((a, b) => a.item.name.localeCompare(b.item.name));
  const featuredDecks = showFeaturedDecks
    ? filteredDecks.filter((deck) => deck.favorite).slice(0, 3)
    : [];
  const activeFilterCount =
    (normalizedQuery ? 1 : 0) +
    (type === "all" ? 0 : 1) +
    tags.length +
    (isFullYearRange ? 0 : 1);
  const availableTags = tagSet === "all" ? ALL_COLLECTION_TAGS : CURATED_COLLECTION_TAGS;

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
    );
  }

  function clearFilters() {
    setQuery("");
    setType("all");
    setTags([]);
    setYearRange([availableMinYear, availableMaxYear]);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            aria-expanded={expanded}
            className="flex min-w-0 flex-1 items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-felt-surface-2"
          >
            <span className="flex items-center gap-2">
              <span className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-brass">
                Filter collection
              </span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-brass px-1.5 py-0.5 text-[10px] font-semibold text-felt-bg">
                  {activeFilterCount}
                </span>
              )}
            </span>
            <span className="flex items-center gap-3 text-xs text-felt-sub">
              <span className="hidden sm:inline">
                {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
              </span>
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </span>
          </button>
          <div className="shrink-0 pr-3">
            <SurpriseMeButton
              preferredDeckIds={filteredDecks
                .filter((deck) => deck.images.length > 0)
                .map((deck) => deck.id)}
              fallbackDeckIds={filteredDecks.map((deck) => deck.id)}
            />
          </div>
        </div>

        {expanded && (
          <div className="flex flex-col gap-4 border-t border-felt-line p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-felt-sub" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search this collection..."
                  className="w-full rounded-md border border-felt-line bg-felt-bg py-2 pl-9 pr-3 text-sm text-felt-ink placeholder:text-felt-sub/60 outline-none focus:border-brass"
                />
              </div>
              <CollectionTypeSelector value={type} onChange={setType} />
            </div>

            <CollectionTagPills
              availableTags={availableTags}
              selectedTags={tags}
              onToggle={(tag) => toggleTag(tag)}
            />

            <CollectionYearRange
              key={`${yearRange[0]}-${yearRange[1]}`}
              availableMinYear={availableMinYear}
              availableMaxYear={availableMaxYear}
              selectedMinYear={yearRange[0]}
              selectedMaxYear={yearRange[1]}
              onCommit={(minYear, maxYear) => setYearRange([minYear, maxYear])}
            />

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-fit text-sm text-felt-sub hover:text-felt-ink"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {featuredDecks.length > 0 && (
        <div className="flex flex-col gap-4">
          <SectionLabel>Featured Decks</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredDecks.map((deck) => (
              <DeckSpotlightCard key={deck.id} deck={deck} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <SectionLabel>The Collection</SectionLabel>
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {filteredItems.map(({ kind, item }) =>
              kind === "deck" ? (
                <DeckCard key={`deck-${item.id}`} deck={item} />
              ) : (
                <CoinCard key={`coin-${item.id}`} coin={item} />
              )
            )}
          </div>
        ) : (
          <p className="py-12 text-center text-felt-sub">No items match these filters.</p>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.2em] text-brass">
        {children}
      </h2>
      <div className="h-px flex-1 bg-brass/30" />
    </div>
  );
}
