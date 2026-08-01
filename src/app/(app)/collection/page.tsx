import { Suspense } from "react";
import Link from "next/link";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { DeckCard } from "@/components/deck-card";
import { CollectionFilters } from "@/components/collection-filters";
import { Pagination } from "@/components/pagination";

const PAGE_SIZE = 60;

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
  const series = toParam(params.series);
  const tags = toArrayParam(params.tag);
  const page = Math.max(1, Number(toParam(params.page)) || 1);

  const where: Prisma.DeckWhereInput = {};
  const and: Prisma.DeckWhereInput[] = [];

  if (q) {
    and.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { series: { contains: q, mode: "insensitive" } },
        { designer: { contains: q, mode: "insensitive" } },
        { producer: { contains: q, mode: "insensitive" } },
        { notes: { contains: q, mode: "insensitive" } },
      ],
    });
  }
  if (designer) and.push({ designer });
  if (producer) and.push({ producer });
  if (series) and.push({ series });
  if (tags.length > 0) and.push({ tags: { hasSome: tags } });
  if (and.length > 0) where.AND = and;

  const [decks, total, designers, producers, seriesList] = await Promise.all([
    prisma.deck.findMany({
      where,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.deck.count({ where }),
    prisma.deck.findMany({
      distinct: ["designer"],
      where: { designer: { not: null } },
      select: { designer: true },
      orderBy: { designer: "asc" },
    }),
    prisma.deck.findMany({
      distinct: ["producer"],
      where: { producer: { not: null } },
      select: { producer: true },
      orderBy: { producer: "asc" },
    }),
    prisma.deck.findMany({
      distinct: ["series"],
      where: { series: { not: null } },
      select: { series: true },
      orderBy: { series: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const currentSearchParams = new URLSearchParams();
  if (q) currentSearchParams.set("q", q);
  if (designer) currentSearchParams.set("designer", designer);
  if (producer) currentSearchParams.set("producer", producer);
  if (series) currentSearchParams.set("series", series);
  for (const tag of tags) currentSearchParams.append("tag", tag);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-felt-ink">
          Collection <span className="font-sans text-base font-normal text-felt-sub">({total})</span>
        </h1>
        <Link
          href="/decks/new"
          className="rounded-md bg-brass px-3 py-1.5 text-sm font-semibold text-felt-bg hover:bg-brass-deep"
        >
          + Add Deck
        </Link>
      </div>

      <Suspense fallback={null}>
        <CollectionFilters
          designers={designers.map((d) => d.designer!).filter(Boolean)}
          producers={producers.map((p) => p.producer!).filter(Boolean)}
          seriesList={seriesList.map((s) => s.series!).filter(Boolean)}
        />
      </Suspense>

      {decks.length === 0 ? (
        <p className="py-16 text-center text-felt-sub">No decks match these filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} searchParams={currentSearchParams} />
    </div>
  );
}
