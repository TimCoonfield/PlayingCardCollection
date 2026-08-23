import { unstable_cache } from "next/cache";
import { getBrowseDeckCards } from "@/lib/catalog-browse";
import {
  CATALOG_CACHE_REVALIDATE_SECONDS,
  CATALOG_CACHE_TAG,
} from "@/lib/catalog-cache";
import { prisma } from "@/lib/prisma";

export const PUBLIC_DECK_SEARCH_SCOPES = [
  "all",
  "name",
  "creator",
  "series",
  "producer",
  "notes",
] as const;

export type PublicDeckSearchScope = (typeof PUBLIC_DECK_SEARCH_SCOPES)[number];

export const PUBLIC_DECK_SORTS = [
  "relevance",
  "name-asc",
  "name-desc",
  "year-asc",
  "year-desc",
  "recent",
] as const;

export type PublicDeckSort = (typeof PUBLIC_DECK_SORTS)[number];

export interface PublicDeckSearchOptions {
  query: string;
  scope: PublicDeckSearchScope;
  designers: string[];
  producers: string[];
  series: string[];
  tags: string[];
  minYear: number | null;
  maxYear: number | null;
  favorite: boolean | null;
  whiteWhale: boolean | null;
  hasPhoto: boolean | null;
  sort: PublicDeckSort;
  limit: number;
  offset: number;
}

export async function searchPublicDecks(options: PublicDeckSearchOptions) {
  const normalizedQuery = options.query.toLocaleLowerCase();
  const decks = await getBrowseDeckCards();
  const filtered = decks.filter((deck) => {
    if (normalizedQuery && !matchesQuery(deck, normalizedQuery, options.scope)) return false;
    if (options.designers.length > 0 && !matchesExact(deck.designer, options.designers)) return false;
    if (options.producers.length > 0 && !matchesExact(deck.producer, options.producers)) return false;
    if (
      options.series.length > 0 &&
      !matchesExact(deck.series, options.series) &&
      !matchesExact(deck.seriesRaw, options.series)
    ) {
      return false;
    }
    if (!options.tags.every((tag) => deck.tags.includes(tag))) return false;
    if (options.minYear !== null && (deck.releaseYear === null || deck.releaseYear < options.minYear)) {
      return false;
    }
    if (options.maxYear !== null && (deck.releaseYear === null || deck.releaseYear > options.maxYear)) {
      return false;
    }
    if (options.favorite !== null && deck.favorite !== options.favorite) return false;
    if (options.whiteWhale !== null && deck.whiteWhale !== options.whiteWhale) return false;
    if (options.hasPhoto !== null && (deck.images.length > 0) !== options.hasPhoto) return false;
    return true;
  });

  filtered.sort((a, b) => compareDecks(a, b, options.sort, normalizedQuery));

  return {
    total: filtered.length,
    decks: filtered.slice(options.offset, options.offset + options.limit),
  };
}

type BrowseDeck = Awaited<ReturnType<typeof getBrowseDeckCards>>[number];

function matchesExact(value: string | null | undefined, candidates: string[]) {
  if (!value) return false;
  const normalized = value.trim().toLocaleLowerCase();
  return candidates.some((candidate) => candidate.trim().toLocaleLowerCase() === normalized);
}

function includes(value: string | null | undefined, query: string) {
  return value?.toLocaleLowerCase().includes(query) ?? false;
}

function matchesQuery(deck: BrowseDeck, query: string, scope: PublicDeckSearchScope) {
  if (scope === "name") return includes(deck.name, query);
  if (scope === "creator") return includes(deck.designer, query) || includes(deck.producer, query);
  if (scope === "series") return includes(deck.series, query) || includes(deck.seriesRaw, query);
  if (scope === "producer") return includes(deck.producer, query);
  if (scope === "notes") return includes(deck.notes, query);
  return [
    deck.name,
    deck.designer,
    deck.producer,
    deck.series,
    deck.seriesRaw,
    deck.notes,
  ].some((value) => includes(value, query));
}

function compareDecks(a: BrowseDeck, b: BrowseDeck, sort: PublicDeckSort, query: string) {
  if (sort === "relevance" && query) {
    const rankDifference = relevanceRank(a, query) - relevanceRank(b, query);
    if (rankDifference !== 0) return rankDifference;
  }
  if (sort === "name-desc") return b.name.localeCompare(a.name) || a.id.localeCompare(b.id);
  if (sort === "year-asc" || sort === "year-desc") {
    if (a.releaseYear === null && b.releaseYear !== null) return 1;
    if (a.releaseYear !== null && b.releaseYear === null) return -1;
    if (a.releaseYear !== null && b.releaseYear !== null && a.releaseYear !== b.releaseYear) {
      return sort === "year-asc" ? a.releaseYear - b.releaseYear : b.releaseYear - a.releaseYear;
    }
  }
  if (sort === "recent") {
    const dateDifference = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (dateDifference !== 0) return dateDifference;
  }
  return a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
}

function relevanceRank(deck: BrowseDeck, query: string) {
  const name = deck.name.toLocaleLowerCase();
  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.includes(query)) return 2;
  if ([deck.designer, deck.producer].some((value) => value?.toLocaleLowerCase() === query)) return 3;
  if ([deck.designer, deck.producer].some((value) => value?.toLocaleLowerCase().startsWith(query))) return 4;
  if ([deck.series, deck.seriesRaw].some((value) => value?.toLocaleLowerCase() === query)) return 5;
  return 6;
}

export const getPublicDeckDetail = unstable_cache(
  async (id: string) =>
    prisma.deck.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        designer: true,
        producer: true,
        ownershipStatus: true,
        qty: true,
        productionRun: true,
        releaseYear: true,
        seriesOrder: true,
        variantNote: true,
        tags: true,
        collectionReasonPrimary: true,
        collectionReasonSecondary: true,
        hook: true,
        notes: true,
        essay: true,
        notesReviewedAt: true,
        catalogNumber: true,
        favorite: true,
        whiteWhale: true,
        createdAt: true,
        updatedAt: true,
        series: {
          select: {
            id: true,
            name: true,
            slug: true,
            subtitle: true,
          },
        },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true, sortOrder: true },
        },
        editions: {
          orderBy: { deckNumber: "asc" },
          select: { deckNumber: true },
        },
      },
    }),
  ["public-deck-detail-v1"],
  { tags: [CATALOG_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);
