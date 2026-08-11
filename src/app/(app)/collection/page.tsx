import { Suspense } from "react";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DeckCard, type DeckCardData } from "@/components/deck-card";
import { CoinCard, type CoinCardData } from "@/components/coin-card";
import { CollectionFilters } from "@/components/collection-filters";
import { Pagination } from "@/components/pagination";
import { isCollectionSort, sortCollectionItems, type CollectionSort } from "@/lib/collection-sort";
import { isArchiveSearchScope, type ArchiveSearchScope } from "@/lib/archive-search";

const PAGE_SIZE = 60;

type CollectionItem =
  | ({ kind: "deck" } & DeckCardData & { releaseYear: number | null; createdAt: Date })
  | ({ kind: "coin" } & CoinCardData & { releaseYear: number | null; createdAt: Date });

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

  const [deckYearRange, coinYearRange] = await Promise.all([
    prisma.deck.aggregate({ _min: { releaseYear: true }, _max: { releaseYear: true } }),
    prisma.coin.aggregate({ _min: { releaseYear: true }, _max: { releaseYear: true } }),
  ]);
  const yearValues = [
    deckYearRange._min.releaseYear,
    deckYearRange._max.releaseYear,
    coinYearRange._min.releaseYear,
    coinYearRange._max.releaseYear,
  ].filter((year): year is number => year !== null);
  const availableMinYear = yearValues.length > 0 ? Math.min(...yearValues) : new Date().getFullYear();
  const availableMaxYear = yearValues.length > 0 ? Math.max(...yearValues) : availableMinYear;
  const minYear = requestedMinYear !== null
    ? Math.max(availableMinYear, Math.min(requestedMinYear, availableMaxYear))
    : availableMinYear;
  const maxYear = requestedMaxYear !== null
    ? Math.max(minYear, Math.min(requestedMaxYear, availableMaxYear))
    : availableMaxYear;
  const hasYearFilter = minYear !== availableMinYear || maxYear !== availableMaxYear;

  const deckAnd: Prisma.DeckWhereInput[] = [];
  if (q) {
    deckAnd.push(collectionSearchWhere(q, scope));
  }
  if (designers.length > 0) deckAnd.push({ designer: { in: designers } });
  if (producers.length > 0) deckAnd.push({ producer: { in: producers } });
  if (creator) deckAnd.push({ OR: [{ designer: creator }, { producer: creator }] });
  if (selectedSeries.length > 0) deckAnd.push({ series: { in: selectedSeries } });
  if (tags.length > 0) deckAnd.push({ tags: { hasEvery: tags } });
  if (hasYearFilter) deckAnd.push({ releaseYear: { gte: minYear, lte: maxYear } });
  const deckWhere: Prisma.DeckWhereInput = deckAnd.length > 0 ? { AND: deckAnd } : {};

  const coinAnd: Prisma.CoinWhereInput[] = [];
  if (q) {
    coinAnd.push(collectionSearchWhere(q, scope));
  }
  if (designers.length > 0) coinAnd.push({ designer: { in: designers } });
  if (producers.length > 0) coinAnd.push({ producer: { in: producers } });
  if (creator) coinAnd.push({ OR: [{ designer: creator }, { producer: creator }] });
  if (selectedSeries.length > 0) coinAnd.push({ series: { in: selectedSeries } });
  if (tags.length > 0) coinAnd.push({ tags: { hasEvery: tags } });
  if (hasYearFilter) coinAnd.push({ releaseYear: { gte: minYear, lte: maxYear } });
  const coinWhere: Prisma.CoinWhereInput = coinAnd.length > 0 ? { AND: coinAnd } : {};

  const wantDecks = type !== "coin";
  const wantCoins = type !== "deck";

  const [
    deckRows,
    coinRows,
    deckDesigners,
    coinDesigners,
    deckProducers,
    coinProducers,
    deckSeriesList,
    coinSeriesList,
    session,
  ] = await Promise.all([
    wantDecks
      ? prisma.deck.findMany({
          where: deckWhere,
          include: { images: { orderBy: { sortOrder: "asc" } } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    wantCoins
      ? prisma.coin.findMany({
          where: coinWhere,
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    prisma.deck.findMany({
      distinct: ["designer"],
      where: { designer: { not: null } },
      select: { designer: true },
    }),
    prisma.coin.findMany({
      distinct: ["designer"],
      where: { designer: { not: null } },
      select: { designer: true },
    }),
    prisma.deck.findMany({
      distinct: ["producer"],
      where: { producer: { not: null } },
      select: { producer: true },
    }),
    prisma.coin.findMany({
      distinct: ["producer"],
      where: { producer: { not: null } },
      select: { producer: true },
    }),
    prisma.deck.findMany({
      distinct: ["series"],
      where: { series: { not: null } },
      select: { series: true },
    }),
    prisma.coin.findMany({
      distinct: ["series"],
      where: { series: { not: null } },
      select: { series: true },
    }),
    getSession(),
  ]);

  const merged = sortCollectionItems<CollectionItem>([
    ...deckRows.map((d) => ({ kind: "deck" as const, ...d })),
    ...coinRows.map((c) => ({ kind: "coin" as const, ...c })),
  ], sort, randomSeed);

  const total = merged.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const designerOptions = Array.from(
    new Set([
      ...deckDesigners.map((d) => d.designer!).filter(Boolean),
      ...coinDesigners.map((d) => d.designer!).filter(Boolean),
    ])
  ).sort();
  const producerOptions = Array.from(
    new Set([
      ...deckProducers.map((p) => p.producer!).filter(Boolean),
      ...coinProducers.map((p) => p.producer!).filter(Boolean),
    ])
  ).sort();
  const seriesList = Array.from(
    new Set([
      ...deckSeriesList.map((s) => s.series!).filter(Boolean),
      ...coinSeriesList.map((s) => s.series!).filter(Boolean),
    ])
  ).sort();

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
          designers={designerOptions}
          producers={producerOptions}
          seriesList={seriesList}
          availableMinYear={availableMinYear}
          availableMaxYear={availableMaxYear}
          surpriseDeckIds={deckRows.map((deck) => deck.id)}
          surpriseDeckIdsWithImages={deckRows
            .filter((deck) => deck.images.length > 0)
            .map((deck) => deck.id)}
          surpriseCoinIds={coinRows.map((coin) => coin.id)}
          surpriseCoinIdsWithImages={coinRows
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

function collectionSearchWhere(query: string, scope: ArchiveSearchScope) {
  const contains = { contains: query, mode: "insensitive" as const };
  if (scope === "name") return { name: contains };
  if (scope === "series") return { series: contains };
  if (scope === "producer") return { producer: contains };
  if (scope === "notes") return { notes: contains };
  if (scope === "creator") return { OR: [{ designer: contains }, { producer: contains }] };
  return {
    OR: [
      { name: contains },
      { series: contains },
      { designer: contains },
      { producer: contains },
      { notes: contains },
    ],
  };
}
