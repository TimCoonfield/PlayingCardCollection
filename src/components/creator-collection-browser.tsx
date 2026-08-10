"use client";

import { useMemo, useState } from "react";
import { CoinCard, type CoinCardData } from "./coin-card";
import { DeckCard, type DeckCardData } from "./deck-card";
import { DeckSpotlightCard } from "./deck-spotlight-card";
import { ChevronDownIcon, SearchIcon } from "./icons";
import { getTagStyle } from "@/lib/placeholders";

const CREATOR_TAGS = ["Gilded", "Signed", "Mini", "Prototype", "Edge Painted"] as const;

const TAG_PILL_CLASSES: Record<string, { idle: string; selected: string }> = {
  plum: {
    idle: "hover:border-plum/70 hover:text-plum",
    selected: "border-plum bg-plum/20 text-felt-ink shadow-sm",
  },
  brass: {
    idle: "hover:border-brass/70 hover:text-brass",
    selected: "border-brass bg-brass/20 text-felt-ink shadow-sm",
  },
  sage: {
    idle: "hover:border-sage/70 hover:text-sage",
    selected: "border-sage bg-sage/20 text-felt-ink shadow-sm",
  },
  brick: {
    idle: "hover:border-brick/70 hover:text-brick",
    selected: "border-brick bg-brick/20 text-felt-ink shadow-sm",
  },
  "felt-ink": {
    idle: "hover:border-felt-ink/60 hover:text-felt-ink",
    selected: "border-felt-ink/70 bg-felt-ink/15 text-felt-ink shadow-sm",
  },
};

export type FilterableCreatorDeck = DeckCardData & {
  releaseYear: number | null;
  notes: string | null;
};

export type FilterableCreatorCoin = CoinCardData & {
  releaseYear: number | null;
  notes: string | null;
};

type ItemType = "all" | "deck" | "coin";

export function CreatorCollectionBrowser({
  decks,
  coins,
  showFeaturedDecks,
}: {
  decks: FilterableCreatorDeck[];
  coins: FilterableCreatorCoin[];
  showFeaturedDecks: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ItemType>("all");
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

  function matchesCommonFields(item: FilterableCreatorDeck | FilterableCreatorCoin) {
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
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-felt-surface-2"
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
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {expanded && (
          <div className="flex flex-col gap-4 border-t border-felt-line p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-felt-sub" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search this creator’s collection..."
                  className="w-full rounded-md border border-felt-line bg-felt-bg py-2 pl-9 pr-3 text-sm text-felt-ink placeholder:text-felt-sub/60 outline-none focus:border-brass"
                />
              </div>
              <div className="flex rounded-md border border-felt-line p-0.5">
                {(["all", "deck", "coin"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setType(option)}
                    className={`flex-1 rounded px-3 py-1.5 text-sm transition-colors ${
                      type === option
                        ? "bg-brass text-felt-bg"
                        : "text-felt-sub hover:text-felt-ink"
                    }`}
                  >
                    {option === "all" ? "All" : option === "deck" ? "Decks" : "Coins"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {CREATOR_TAGS.map((tag) => {
                const selected = tags.includes(tag);
                const style = getTagStyle(tag);
                const colorClasses = TAG_PILL_CLASSES[style.accent] ?? TAG_PILL_CLASSES.brass;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      selected
                        ? colorClasses.selected
                        : `border-felt-line bg-felt-bg/40 text-felt-sub ${colorClasses.idle}`
                    }`}
                  >
                    <span aria-hidden="true" className="text-sm leading-none">
                      {style.icon ?? "♠"}
                    </span>
                    {tag}
                    {selected && <span aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>

            <CreatorYearRange
              availableMinYear={availableMinYear}
              availableMaxYear={availableMaxYear}
              yearRange={yearRange}
              setYearRange={setYearRange}
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

function CreatorYearRange({
  availableMinYear,
  availableMaxYear,
  yearRange,
  setYearRange,
}: {
  availableMinYear: number;
  availableMaxYear: number;
  yearRange: [number, number];
  setYearRange: React.Dispatch<React.SetStateAction<[number, number]>>;
}) {
  const isFullRange = yearRange[0] === availableMinYear && yearRange[1] === availableMaxYear;
  const yearSpan = Math.max(1, availableMaxYear - availableMinYear);

  function moveHandle(handle: "lower" | "upper", value: number) {
    setYearRange((current) => {
      const otherValue = handle === "lower" ? current[1] : current[0];
      return value <= otherValue ? [value, otherValue] : [otherValue, value];
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm text-felt-sub">Release year</span>
        <span className="text-sm font-medium tabular-nums text-felt-ink">
          {isFullRange ? "All years (including unknown)" : `${yearRange[0]}–${yearRange[1]}`}
        </span>
      </div>
      <div className="relative h-6" aria-label="Release year range">
        <div className="absolute left-0 right-0 top-2.5 h-1 rounded-full bg-felt-line" />
        <div
          className="absolute top-2.5 h-1 rounded-full bg-brass"
          style={{
            left: `${((yearRange[0] - availableMinYear) / yearSpan) * 100}%`,
            right: `${100 - ((yearRange[1] - availableMinYear) / yearSpan) * 100}%`,
          }}
        />
        <input
          type="range"
          min={availableMinYear}
          max={availableMaxYear}
          value={yearRange[0]}
          aria-label="Earliest release year"
          onChange={(event) => moveHandle("lower", Number(event.target.value))}
          className="collection-year-range absolute inset-x-0 top-0 z-10 w-full"
        />
        <input
          type="range"
          min={availableMinYear}
          max={availableMaxYear}
          value={yearRange[1]}
          aria-label="Latest release year"
          onChange={(event) => moveHandle("upper", Number(event.target.value))}
          className="collection-year-range absolute inset-x-0 top-0 z-10 w-full"
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-felt-sub">
        <span>{availableMinYear}</span>
        <span>{availableMaxYear}</span>
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
