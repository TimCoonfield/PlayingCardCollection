"use client";

import { useMemo, useState } from "react";
import { CoinCard, type CoinCardData } from "./coin-card";
import { DeckCard, type DeckCardData } from "./deck-card";
import { DeckSpotlightCard } from "./deck-spotlight-card";
import { ChevronDownIcon, SearchIcon } from "./icons";
import { SurpriseMeButton } from "./surprise-me-button";
import { sortCollectionItems, type CollectionSort } from "@/lib/collection-sort";
import {
  ALL_COLLECTION_TAGS,
  CURATED_COLLECTION_TAGS,
  CollectionActiveFilter,
  CollectionFacetPicker,
  CollectionTagPills,
  CollectionSortSelector,
  CollectionTypeSelector,
  CollectionYearRange,
  MissingPhotoFilter,
  type CollectionItemType,
} from "./collection-filter-controls";

export type FilterableScopedDeck = DeckCardData & {
  releaseYear: number | null;
  notes: string | null;
  createdAt: Date | string;
};

export type FilterableScopedCoin = CoinCardData & {
  releaseYear: number | null;
  notes: string | null;
  createdAt: Date | string;
};

export function ScopedCollectionBrowser({
  decks,
  coins,
  showFeaturedDecks,
  tagSet = "curated",
  isAuthenticated = false,
}: {
  decks: FilterableScopedDeck[];
  coins: FilterableScopedCoin[];
  showFeaturedDecks: boolean;
  tagSet?: "curated" | "all";
  isAuthenticated?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<CollectionItemType>("all");
  const [tags, setTags] = useState<string[]>([]);
  const [designers, setDesigners] = useState<string[]>([]);
  const [producers, setProducers] = useState<string[]>([]);
  const [series, setSeries] = useState<string[]>([]);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [sort, setSort] = useState<CollectionSort>("alpha-asc");
  const [randomSeed, setRandomSeed] = useState(0);
  const [missingPhoto, setMissingPhoto] = useState(false);

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
  const allItems = useMemo(() => [...decks, ...coins], [coins, decks]);
  const designerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allItems
            .map((item) => item.designer)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [allItems]
  );
  const producerOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allItems
            .map((item) => item.producer)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [allItems]
  );
  const seriesOptions = useMemo(
    () =>
      Array.from(
        new Set(
          allItems
            .map((item) => item.series)
            .filter((value): value is string => Boolean(value))
        )
      ).sort(),
    [allItems]
  );

  function matchesCommonFields(item: FilterableScopedDeck | FilterableScopedCoin) {
    const matchesQuery =
      !normalizedQuery ||
      [item.name, item.series, item.designer, item.producer, item.notes]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase().includes(normalizedQuery));
    const matchesTags = tags.every((tag) => item.tags.includes(tag));
    const matchesDesigner =
      designers.length === 0 ||
      (item.designer !== null && designers.includes(item.designer));
    const matchesProducer =
      producers.length === 0 ||
      (item.producer !== null && producers.includes(item.producer));
    const matchesSeries =
      series.length === 0 || (item.series !== null && series.includes(item.series));
    const matchesYear =
      isFullYearRange ||
      (item.releaseYear !== null &&
        item.releaseYear >= yearRange[0] &&
        item.releaseYear <= yearRange[1]);
    const matchesPhoto =
      !missingPhoto ||
      ("images" in item
        ? item.images.length === 0
        : !item.obverseImageUrl && !item.reverseImageUrl);
    return (
      matchesQuery &&
      matchesTags &&
      matchesDesigner &&
      matchesProducer &&
      matchesSeries &&
      matchesYear &&
      matchesPhoto
    );
  }

  const filteredDecks = type === "coin" ? [] : decks.filter(matchesCommonFields);
  const filteredCoins = type === "deck" ? [] : coins.filter(matchesCommonFields);
  const filteredItems = sortCollectionItems(
    [
      ...filteredDecks.map((deck) => ({ kind: "deck" as const, item: deck, ...deck })),
      ...filteredCoins.map((coin) => ({ kind: "coin" as const, item: coin, ...coin })),
    ],
    sort,
    randomSeed
  );
  const featuredDecks = showFeaturedDecks
    ? filteredDecks.filter((deck) => deck.favorite).slice(0, 3)
    : [];
  const activeFilterCount =
    (normalizedQuery ? 1 : 0) +
    (type === "all" ? 0 : 1) +
    tags.length +
    designers.length +
    producers.length +
    series.length +
    (isFullYearRange ? 0 : 1) +
    (missingPhoto ? 1 : 0);
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
    setDesigners([]);
    setProducers([]);
    setSeries([]);
    setYearRange([availableMinYear, availableMaxYear]);
    setMissingPhoto(false);
  }

  function changeSort(value: CollectionSort) {
    setSort(value);
    if (value === "random") setRandomSeed(crypto.getRandomValues(new Uint32Array(1))[0]);
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
              preferredCoinIds={filteredCoins
                .filter((coin) => coin.obverseImageUrl || coin.reverseImageUrl)
                .map((coin) => coin.id)}
              fallbackCoinIds={filteredCoins.map((coin) => coin.id)}
            />
          </div>
        </div>

        {expanded && (
          <div className="flex flex-col gap-4 border-t border-felt-line p-4">
            <div className="flex flex-col gap-3 lg:flex-row">
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
              <CollectionSortSelector value={sort} onChange={changeSort} />
            </div>

            <div className="border-t border-felt-line pt-3">
              <button
                type="button"
                onClick={() => setAdvancedExpanded((current) => !current)}
                aria-expanded={advancedExpanded}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <span className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-brass">
                  Advanced filters
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 text-felt-sub transition-transform ${advancedExpanded ? "rotate-180" : ""}`}
                />
              </button>
              {advancedExpanded && (
                <div className="mt-4 flex flex-col gap-4 border-t border-felt-line/70 pt-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <CollectionTagPills
                      availableTags={availableTags}
                      selectedTags={tags}
                      onToggle={(tag) => toggleTag(tag)}
                    />
                    {isAuthenticated && (
                      <MissingPhotoFilter
                        selected={missingPhoto}
                        onChange={setMissingPhoto}
                      />
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <CollectionFacetPicker
                      label="Creators / designers"
                      options={designerOptions}
                      selected={designers}
                      onAdd={(value) => setDesigners((current) => [...current, value])}
                    />
                    <CollectionFacetPicker
                      label="Producers / publishers"
                      options={producerOptions}
                      selected={producers}
                      onAdd={(value) => setProducers((current) => [...current, value])}
                    />
                    <CollectionFacetPicker
                      label={type === "coin" ? "Associated decks" : "Series"}
                      options={seriesOptions}
                      selected={series}
                      onAdd={(value) => setSeries((current) => [...current, value])}
                    />
                  </div>
                  <CollectionYearRange
                    key={`${yearRange[0]}-${yearRange[1]}`}
                    availableMinYear={availableMinYear}
                    availableMaxYear={availableMaxYear}
                    selectedMinYear={yearRange[0]}
                    selectedMaxYear={yearRange[1]}
                    onCommit={(minYear, maxYear) => setYearRange([minYear, maxYear])}
                  />
                </div>
              )}
            </div>

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-felt-line pt-3">
                {normalizedQuery && (
                  <CollectionActiveFilter
                    label={`Search: ${query.trim()}`}
                    onRemove={() => setQuery("")}
                  />
                )}
                {type !== "all" && (
                  <CollectionActiveFilter
                    label={type === "deck" ? "Decks" : "Coins"}
                    onRemove={() => setType("all")}
                  />
                )}
                {designers.map((value) => (
                  <CollectionActiveFilter
                    key={`designer-${value}`}
                    label={value}
                    onRemove={() =>
                      setDesigners((current) => current.filter((item) => item !== value))
                    }
                  />
                ))}
                {producers.map((value) => (
                  <CollectionActiveFilter
                    key={`producer-${value}`}
                    label={value}
                    onRemove={() =>
                      setProducers((current) => current.filter((item) => item !== value))
                    }
                  />
                ))}
                {series.map((value) => (
                  <CollectionActiveFilter
                    key={`series-${value}`}
                    label={value}
                    onRemove={() =>
                      setSeries((current) => current.filter((item) => item !== value))
                    }
                  />
                ))}
                {tags.map((value) => (
                  <CollectionActiveFilter key={`tag-${value}`} label={value} onRemove={() => toggleTag(value)} />
                ))}
                {missingPhoto && (
                  <CollectionActiveFilter
                    label="Missing photo"
                    onRemove={() => setMissingPhoto(false)}
                  />
                )}
                {!isFullYearRange && (
                  <CollectionActiveFilter
                    label={`${yearRange[0]}–${yearRange[1]}`}
                    onRemove={() => setYearRange([availableMinYear, availableMaxYear])}
                  />
                )}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-felt-sub hover:text-felt-ink"
                >
                  Clear all
                </button>
              </div>
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
