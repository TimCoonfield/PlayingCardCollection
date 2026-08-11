import { Suspense } from "react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { DeckCard, type DeckCardData } from "@/components/deck-card";
import { CoinCard, type CoinCardData } from "@/components/coin-card";
import { CollectionFilters } from "@/components/collection-filters";
import { Pagination } from "@/components/pagination";
import { isCollectionSort, sortCollectionItems, type CollectionSort } from "@/lib/collection-sort";
import { isArchiveSearchScope, type ArchiveSearchScope } from "@/lib/archive-search";
import { getCollectionMetadata } from "@/lib/catalog-metadata";
import { getBrowseCatalogCards } from "@/lib/catalog-browse";

const PAGE_SIZE = 60;

type CollectionItem =
  | ({ kind: "deck" } & DeckCardData)
  | ({ kind: "coin" } & CoinCardData);

function toParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toArrayParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toOptionalNumberParam(value: string | string[] | undefined): number | null {
  const raw = toParam(value);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : null;
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = toParam(params.q).trim();
  const rawScope = toParam(params.scope);
  const scope: ArchiveSearchScope = isArchiveSearchScope(rawScope) ? rawScope : "all";
  const designers = toArrayParam(params.designer);
  const producers = toArrayParam(params.producer);
  // Matches decks/coins where this name is credited as EITHER designer or producer — used by
  // the homepage's featured-creator links for creators who sometimes only produced a deck
  // someone else drew (or vice versa). Not exposed in the filter UI itself, just a link target.
  const creator = toParam(params.creator);
  const selectedSeries = toArrayParam(params.series);
  const tags = toArrayParam(params.tag);
  const requestedMinYear = toOptionalNumberParam(params.minYear);
  const requestedMaxYear = toOptionalNumberParam(params.maxYear);
  const page = Math.max(1, Number(toParam(params.page)) || 1);
  const typeParam = toParam(params.type);
  const type: "all" | "deck" | "coin" = typeParam === "deck" || typeParam === "coin" ? typeParam : "all";
  const rawSort = toParam(params.sort);
  const sort: CollectionSort = isCollectionSort(rawSort) ? rawSort : "featured";
  const randomSeed = toOptionalNumberParam(params.randomSeed) ?? 0;

  const collectionMetadata = await getCollectionMetadata();
  const { availableMinYear, availableMaxYear } = collectionMetadata;
  const minYear = requestedMinYear !== null
    ? Math.max(availableMinYear, Math.min(requestedMinYear, availableMaxYear))
    : availableMinYear;
  const maxYear = requestedMaxYear !== null
    ? Math.max(minYear, Math.min(requestedMaxYear, availableMaxYear))
    : availableMaxYear;
  const hasYearFilter = minYear !== availableMinYear || maxYear !== availableMaxYear;

  const wantDecks = type !== "coin";
  const wantCoins = type !== "deck";

  const [catalog, session] = await Promise.all([
    getBrowseCatalogCards(),
    getSession(),
  ]);
  const matchesFilters = (item: (typeof catalog.decks)[number] | (typeof catalog.coins)[number]) =>
    (!q || matchesSearch(item, q, scope)) &&
    (designers.length === 0 || (item.designer !== null && designers.includes(item.designer))) &&
    (producers.length === 0 || (item.producer !== null && producers.includes(item.producer))) &&
    (!creator || item.designer === creator || item.producer === creator) &&
    (selectedSeries.length === 0 || (item.series !== null && selectedSeries.includes(item.series))) &&
    tags.every((tag) => item.tags.includes(tag)) &&
    (!hasYearFilter ||
      (item.releaseYear !== null && item.releaseYear >= minYear && item.releaseYear <= maxYear));
  const deckIndexRows = wantDecks ? catalog.decks.filter(matchesFilters) : [];
  const coinIndexRows = wantCoins ? catalog.coins.filter(matchesFilters) : [];

  const mergedIndex = sortCollectionItems([
    ...deckIndexRows.map((deck) => ({
      kind: "deck" as const,
      id: deck.id,
      name: deck.name,
      favorite: deck.favorite,
      releaseYear: deck.releaseYear,
      createdAt: deck.createdAt,
    })),
    ...coinIndexRows.map((coin) => ({
      kind: "coin" as const,
      id: coin.id,
      name: coin.name,
      releaseYear: coin.releaseYear,
      createdAt: coin.createdAt,
    })),
  ], sort, randomSeed);

  const total = mergedIndex.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageIndexItems = mergedIndex.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageDeckIds = pageIndexItems
    .filter((item) => item.kind === "deck")
    .map((item) => item.id);
  const pageCoinIds = pageIndexItems
    .filter((item) => item.kind === "coin")
    .map((item) => item.id);

  const pageDeckIdSet = new Set(pageDeckIds);
  const pageCoinIdSet = new Set(pageCoinIds);
  const pageDeckRows = deckIndexRows.filter((deck) => pageDeckIdSet.has(deck.id));
  const pageCoinRows = coinIndexRows.filter((coin) => pageCoinIdSet.has(coin.id));
  const pageDecksById = new Map(pageDeckRows.map((deck) => [deck.id, deck]));
  const pageCoinsById = new Map(pageCoinRows.map((coin) => [coin.id, coin]));
  const pageItems = pageIndexItems.flatMap<CollectionItem>((item) => {
    if (item.kind === "deck") {
      const deck = pageDecksById.get(item.id);
      return deck ? [{ kind: "deck", ...deck }] : [];
    }
    const coin = pageCoinsById.get(item.id);
    return coin ? [{ kind: "coin", ...coin }] : [];
  });

  const isAuthenticated = Boolean(session.authenticated);

  const currentSearchParams = new URLSearchParams();
  if (q) currentSearchParams.set("q", q);
  if (q && scope !== "all") currentSearchParams.set("scope", scope);
  for (const designer of designers) currentSearchParams.append("designer", designer);
  for (const producer of producers) currentSearchParams.append("producer", producer);
  if (creator) currentSearchParams.set("creator", creator);
  for (const series of selectedSeries) currentSearchParams.append("series", series);
  if (type !== "all") currentSearchParams.set("type", type);
  if (sort !== "featured") currentSearchParams.set("sort", sort);
  if (sort === "random") currentSearchParams.set("randomSeed", String(randomSeed));
  for (const tag of tags) currentSearchParams.append("tag", tag);
  if (hasYearFilter) {
    currentSearchParams.set("minYear", String(minYear));
    currentSearchParams.set("maxYear", String(maxYear));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-felt-ink">
          Collection <span className="font-sans text-base font-normal text-felt-sub">({total})</span>
        </h1>
        {isAuthenticated && (
          <div className="flex gap-2">
            <Link
              href="/decks/new"
              className="rounded-md bg-brass px-3 py-1.5 text-sm font-semibold text-felt-bg hover:bg-brass-deep"
            >
              + Add Deck
            </Link>
            <Link
              href="/coins/new"
              className="rounded-md border border-brass px-3 py-1.5 text-sm font-semibold text-brass hover:bg-brass/10"
            >
              + Add Coin
            </Link>
          </div>
        )}
      </div>

      <Suspense fallback={null}>
        <CollectionFilters
          designers={collectionMetadata.designers}
          producers={collectionMetadata.producers}
          seriesList={collectionMetadata.series}
          availableMinYear={availableMinYear}
          availableMaxYear={availableMaxYear}
          surpriseDeckIds={deckIndexRows.map((deck) => deck.id)}
          surpriseDeckIdsWithImages={deckIndexRows
            .filter((deck) => deck.images.length > 0)
            .map((deck) => deck.id)}
          surpriseCoinIds={coinIndexRows.map((coin) => coin.id)}
          surpriseCoinIdsWithImages={coinIndexRows
            .filter((coin) => coin.obverseImageUrl || coin.reverseImageUrl)
            .map((coin) => coin.id)}
        />
      </Suspense>

      {pageItems.length === 0 ? (
        <p className="py-16 text-center text-felt-sub">No items match these filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {pageItems.map((item) =>
            item.kind === "coin" ? (
              <CoinCard key={item.id} coin={item} />
            ) : (
              <DeckCard key={item.id} deck={item} />
            )
          )}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} searchParams={currentSearchParams} />
    </div>
  );
}

function matchesSearch(
  item: { name: string; series: string | null; designer: string | null; producer: string | null; notes: string | null },
  query: string,
  scope: ArchiveSearchScope
) {
  const includes = (value: string | null) => value?.toLocaleLowerCase().includes(query.toLocaleLowerCase()) ?? false;
  if (scope === "name") return includes(item.name);
  if (scope === "series") return includes(item.series);
  if (scope === "producer") return includes(item.producer);
  if (scope === "notes") return includes(item.notes);
  if (scope === "creator") return includes(item.designer) || includes(item.producer);
  return [item.name, item.series, item.designer, item.producer, item.notes].some(includes);
}
