import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeckGallery } from "@/components/deck-gallery";
import { BackLink } from "@/components/back-link";
import { StatTile } from "@/components/stat-tile";
import { TagChip } from "@/components/tag-chip";
import { PencilIcon, TrashIcon, HeartIcon, WhaleIcon } from "@/components/icons";
import { FavoriteButton } from "@/components/favorite-button";
import { WhiteWhaleButton } from "@/components/white-whale-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { DeckCard } from "@/components/deck-card";
import { SurpriseMeButton } from "@/components/surprise-me-button";
import { getSession } from "@/lib/auth";
import {
  buildDeckBrowseWhere,
  getBrowseRandomSeed,
  getBrowseSort,
} from "@/lib/deck-browse-context";
import { sortCollectionItems } from "@/lib/collection-sort";
import { Prisma } from "@/generated/prisma/client";
import { deleteDeck } from "../actions";

export default async function DeckDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const detailParams = await searchParams;
  const [deck, session] = await Promise.all([
    prisma.deck.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        editions: { orderBy: { deckNumber: "asc" } },
      },
    }),
    getSession(),
  ]);

  if (!deck) notFound();

  const rawContext = toParam(detailParams.context);
  const hasBrowseContext = toParam(detailParams.from) === "collection" && rawContext.length <= 2000;
  const contextParams = new URLSearchParams(hasBrowseContext ? rawContext : "");
  const relatedOr: Prisma.DeckWhereInput[] = [];
  if (deck.series) relatedOr.push({ series: deck.series });
  if (deck.designer) relatedOr.push({ designer: deck.designer });
  if (deck.producer) relatedOr.push({ producer: deck.producer });
  if (deck.tags.length > 0) relatedOr.push({ tags: { hasSome: deck.tags } });
  if (deck.releaseYear !== null) {
    relatedOr.push({ releaseYear: { gte: deck.releaseYear - 7, lte: deck.releaseYear + 7 } });
  }

  const [browseRows, relatedCandidates, globalSurpriseRows] = await Promise.all([
    hasBrowseContext
      ? prisma.deck.findMany({
          where: buildDeckBrowseWhere(contextParams),
          select: {
            id: true,
            name: true,
            releaseYear: true,
            createdAt: true,
            favorite: true,
            images: { take: 1, orderBy: { sortOrder: "asc" } },
          },
        })
      : Promise.resolve([]),
    relatedOr.length > 0
      ? prisma.deck.findMany({
          where: { id: { not: deck.id }, OR: relatedOr },
          include: { images: { orderBy: { sortOrder: "asc" } } },
          orderBy: { name: "asc" },
          take: 80,
        })
      : Promise.resolve([]),
    hasBrowseContext
      ? Promise.resolve([])
      : prisma.deck.findMany({
          select: { id: true, images: { take: 1 } },
        }),
  ]);

  const browseDecks = hasBrowseContext
    ? sortCollectionItems(browseRows, getBrowseSort(contextParams), getBrowseRandomSeed(contextParams))
    : [];
  const browseIndex = browseDecks.findIndex((item) => item.id === deck.id);
  const previousDeck = browseIndex > 0 ? browseDecks[browseIndex - 1] : null;
  const nextDeck = browseIndex >= 0 && browseIndex < browseDecks.length - 1
    ? browseDecks[browseIndex + 1]
    : null;
  const contextSuffix = hasBrowseContext
    ? `?from=collection&context=${encodeURIComponent(rawContext)}`
    : "";
  const collectionHref = hasBrowseContext
    ? `/collection${rawContext ? `?${rawContext}` : ""}`
    : "/collection";
  const relatedDecks = rankRelatedDecks(deck, relatedCandidates).slice(0, 4);
  const surpriseRows = hasBrowseContext ? browseDecks : globalSurpriseRows;

  const isAuthenticated = Boolean(session.authenticated);
  const deleteDeckWithId = deleteDeck.bind(null, deck.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackLink fallbackHref={collectionHref}>
          {hasBrowseContext ? `← Back to ${browseDecks.length} decks` : "← Back to collection"}
        </BackLink>
        {isAuthenticated && (
          <div className="flex gap-2">
            <FavoriteButton deckId={deck.id} initialFavorite={deck.favorite} />
            <WhiteWhaleButton deckId={deck.id} initialWhiteWhale={deck.whiteWhale} />
            <Link
              href={`/decks/${deck.id}/edit`}
              aria-label="Edit deck"
              title="Edit"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brass/50 text-brass transition-colors hover:bg-brass/10"
            >
              <PencilIcon className="h-4 w-4" />
            </Link>
            <form
              action={async () => {
                "use server";
                await deleteDeckWithId();
              }}
            >
              <ConfirmSubmitButton
                confirmMessage={`Delete "${deck.name}"? This can't be undone.`}
                ariaLabel="Delete deck"
                title="Delete"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brick/50 text-brick transition-colors hover:bg-brick/10"
              >
                <TrashIcon className="h-4 w-4" />
              </ConfirmSubmitButton>
            </form>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <DeckGallery images={deck.images} tags={deck.tags} deckName={deck.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            {deck.series && (
              <Link
                href={`/collection?series=${encodeURIComponent(deck.series)}`}
                className="text-sm text-felt-sub hover:text-brass"
              >
                {deck.series}
              </Link>
            )}
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-3xl font-semibold text-felt-ink">{deck.name}</h1>
              {deck.qty > 1 && (
                <span className="rounded-full bg-felt-surface px-2 py-0.5 text-xs font-medium text-felt-sub">
                  ×{deck.qty}
                </span>
              )}
              {deck.favorite && (
                <HeartIcon filled className="h-5 w-5 shrink-0 text-brick" aria-label="Favorite" />
              )}
              {deck.whiteWhale && (
                <span className="shrink-0 text-sage" aria-label="White Whale" title="White Whale">
                  <WhaleIcon className="h-5 w-5" />
                </span>
              )}
            </div>
          </div>

          {(deck.designer || deck.producer || deck.releaseYear) && (
            <div className="flex flex-col divide-y divide-felt-line rounded-lg border border-felt-line bg-felt-surface">
              {deck.designer && (
                <CreditRow
                  label="Designer"
                  value={deck.designer}
                  href={`/collection?designer=${encodeURIComponent(deck.designer)}`}
                />
              )}
              {deck.producer && (
                <CreditRow
                  label="Producer"
                  value={deck.producer}
                  href={`/collection?producer=${encodeURIComponent(deck.producer)}`}
                />
              )}
              {deck.releaseYear !== null && (
                <CreditRow
                  label="Release year"
                  value={String(deck.releaseYear)}
                  href={`/collection?minYear=${deck.releaseYear}&maxYear=${deck.releaseYear}`}
                />
              )}
            </div>
          )}

          {deck.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {deck.tags.map((tag) => (
                <TagChip key={tag} tag={tag} />
              ))}
            </div>
          )}

          {deck.editions.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {deck.editions.map((edition) => (
                <StatTile
                  key={edition.id}
                  label="Edition"
                  value={
                    deck.productionRun
                      ? `${edition.deckNumber}/${deck.productionRun}`
                      : `#${edition.deckNumber}`
                  }
                />
              ))}
            </div>
          ) : (
            deck.productionRun && (
              <div className="flex flex-wrap gap-3">
                <StatTile label="Edition" value={`XX/${deck.productionRun}`} />
              </div>
            )
          )}

          {deck.catalogNumber && (
            <p className="text-xs text-felt-sub">
              <span className="uppercase tracking-wide text-felt-sub/70">Catalog #</span>{" "}
              {deck.catalogNumber}
            </p>
          )}

          {deck.notes && (
            <div className="rounded-lg border border-felt-line bg-felt-surface p-4">
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-felt-sub/70">
                Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm text-felt-sub">{deck.notes}</p>
            </div>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-4 border-t border-felt-line pt-6">
        <div className="flex items-center gap-3">
          <h2 className="whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.2em] text-brass">
            Keep Exploring
          </h2>
          <div className="h-px flex-1 bg-brass/30" />
        </div>
        <div className="flex flex-col gap-3 rounded-lg border border-felt-line bg-felt-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          {hasBrowseContext && browseIndex >= 0 ? (
            <>
              <div className="flex items-center justify-between gap-3 sm:min-w-56">
                {previousDeck ? (
                  <Link
                    href={`/decks/${previousDeck.id}${contextSuffix}`}
                    className="text-sm text-felt-sub hover:text-brass"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="text-sm text-felt-sub/35">← Previous</span>
                )}
                <span className="text-xs tabular-nums text-felt-sub">
                  {browseIndex + 1} of {browseDecks.length}
                </span>
                {nextDeck ? (
                  <Link
                    href={`/decks/${nextDeck.id}${contextSuffix}`}
                    className="text-sm text-felt-sub hover:text-brass"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="text-sm text-felt-sub/35">Next →</span>
                )}
              </div>
              <Link href={collectionHref} className="text-center text-xs text-felt-sub hover:text-felt-ink">
                Back to {browseDecks.length} decks
              </Link>
            </>
          ) : (
            <p className="text-sm text-felt-sub">Discover another deck from the archive.</p>
          )}
          <SurpriseMeButton
            preferredDeckIds={surpriseRows
              .filter((item) => item.images.length > 0)
              .map((item) => item.id)}
            fallbackDeckIds={surpriseRows.map((item) => item.id)}
            excludeDeckId={deck.id}
            deckHrefSuffix={contextSuffix}
          />
        </div>
      </section>

      {relatedDecks.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <h2 className="whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.2em] text-brass">
              Related Decks
            </h2>
            <div className="h-px flex-1 bg-brass/30" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {relatedDecks.map((related) => (
              <DeckCard key={related.id} deck={related} sizes="(max-width: 640px) 50vw, 25vw" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function toParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

type RelatedDeck = Prisma.DeckGetPayload<{
  include: { images: { orderBy: { sortOrder: "asc" } } };
}>;

function rankRelatedDecks(current: RelatedDeck, candidates: RelatedDeck[]) {
  return [...candidates].sort((a, b) => {
    const score = (candidate: RelatedDeck) => {
      let value = 0;
      if (current.series && candidate.series === current.series) value += 100;
      if (current.designer && candidate.designer === current.designer) value += 60;
      if (current.producer && candidate.producer === current.producer) value += 35;
      value += current.tags.filter((tag) => candidate.tags.includes(tag)).length * 6;
      if (current.releaseYear !== null && candidate.releaseYear !== null) {
        const difference = Math.abs(current.releaseYear - candidate.releaseYear);
        if (difference === 0) value += 15;
        else if (difference <= 3) value += 10;
        else if (difference <= 7) value += 5;
      }
      if (candidate.images.length > 0) value += 3;
      return value;
    };
    return score(b) - score(a) || a.name.localeCompare(b.name);
  });
}

function CreditRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <span className="text-xs uppercase tracking-wide text-felt-sub/70">{label}</span>
      <span className="truncate font-display text-base font-medium text-felt-ink group-hover:text-brass">
        {value}
      </span>
    </>
  );

  if (!href) {
    return <div className="flex items-center justify-between gap-3 px-4 py-3">{content}</div>;
  }

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-felt-surface-2"
    >
      {content}
    </Link>
  );
}
