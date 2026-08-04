import { Suspense } from "react";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DeckCard, type DeckCardData } from "@/components/deck-card";
import { CoinCard, type CoinCardData } from "@/components/coin-card";
import { CollectionFilters } from "@/components/collection-filters";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE = 60;

type CollectionItem = ({ kind: "deck" } & DeckCardData) | ({ kind: "coin" } & CoinCardData);

function toParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function toArrayParam(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = toParam(params.q).trim();
  const designer = toParam(params.designer);
  const producer = toParam(params.producer);
  // Matches decks/coins where this name is credited as EITHER designer or producer — used by
  // the homepage's featured-creator links for creators who sometimes only produced a deck
  // someone else drew (or vice versa). Not exposed in the filter UI itself, just a link target.
  const creator = toParam(params.creator);
  const series = toParam(params.series);
  const tags = toArrayParam(params.tag);
  const page = Math.max(1, Number(toParam(params.page)) || 1);
  const typeParam = toParam(params.type);
  const type: "all" | "deck" | "coin" = typeParam === "deck" || typeParam === "coin" ? typeParam : "all";

  const deckAnd: Prisma.DeckWhereInput[] = [];
  if (q) {
    deckAnd.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { series: { contains: q, mode: "insensitive" } },
        { designer: { contains: q, mode: "insensitive" } },
        { producer: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (designer) deckAnd.push({ designer });
  if (producer) deckAnd.push({ producer });
  if (creator) deckAnd.push({ OR: [{ designer: creator }, { producer: creator }] });
  if (series) deckAnd.push({ series });
  if (tags.length > 0) deckAnd.push({ tags: { hasEvery: tags } });
  const deckWhere: Prisma.DeckWhereInput = deckAnd.length > 0 ? { AND: deckAnd } : {};

  const coinAnd: Prisma.CoinWhereInput[] = [];
  if (q) {
    coinAnd.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { series: { contains: q, mode: "insensitive" } },
        { designer: { contains: q, mode: "insensitive" } },
        { producer: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (designer) coinAnd.push({ designer });
  if (producer) coinAnd.push({ producer });
  if (creator) coinAnd.push({ OR: [{ designer: creator }, { producer: creator }] });
  if (series) coinAnd.push({ series });
  if (tags.length > 0) coinAnd.push({ tags: { hasEvery: tags } });
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
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
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

  const merged: CollectionItem[] = [
    ...deckRows.map((d) => ({ kind: "deck" as const, ...d })),
    ...coinRows.map((c) => ({ kind: "coin" as const, ...c })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const total = merged.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = merged.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const designers = Array.from(
    new Set([
      ...deckDesigners.map((d) => d.designer!).filter(Boolean),
      ...coinDesigners.map((d) => d.designer!).filter(Boolean),
    ])
  ).sort();
  const producers = Array.from(
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
  if (designer) currentSearchParams.set("designer", designer);
  if (producer) currentSearchParams.set("producer", producer);
  if (creator) currentSearchParams.set("creator", creator);
  if (series) currentSearchParams.set("series", series);
  if (type !== "all") currentSearchParams.set("type", type);
  for (const tag of tags) currentSearchParams.append("tag", tag);

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
        <CollectionFilters designers={designers} producers={producers} seriesList={seriesList} />
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
