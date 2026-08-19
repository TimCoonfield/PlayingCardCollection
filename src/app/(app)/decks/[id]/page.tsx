import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeckGallery } from "@/components/deck-gallery";
import { StatTile } from "@/components/stat-tile";
import { TagChip } from "@/components/tag-chip";
import { PencilIcon, TrashIcon, HeartIcon, WhaleIcon } from "@/components/icons";
import { FavoriteButton } from "@/components/favorite-button";
import { WhiteWhaleButton } from "@/components/white-whale-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { SeriesDeckNavigation } from "@/components/series-deck-navigation";
import { getSession } from "@/lib/auth";
import { deleteDeck } from "../actions";
import { sortSeriesDecks } from "@/lib/series-order";
import { SITE_URL } from "@/lib/site";
import {
  COLLECTION_REASON_DETAILS,
  type CollectionReasonValue,
} from "@/lib/collection-reasons";

// Wrapped in React's cache() so generateMetadata and the page body share one query per request.
const getDeck = cache((id: string) =>
  prisma.deck.findUnique({
    where: { id },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      editions: { orderBy: { deckNumber: "asc" } },
      series: {
        include: {
          decks: {
            select: { id: true, name: true, seriesOrder: true, releaseYear: true },
          },
        },
      },
    },
  })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const deck = await getDeck(id);
  if (!deck) return { title: "Deck Not Found" };

  const credit = [deck.designer, deck.producer].filter(Boolean).join(" / ");
  const description =
    deck.hook ??
    deck.notes ??
    [deck.name, credit, deck.releaseYear].filter(Boolean).join(" — ");
  const image = deck.images[0]?.url;

  return {
    title: deck.name,
    description,
    openGraph: image ? { images: [{ url: image }] } : undefined,
  };
}

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [deck, session] = await Promise.all([
    getDeck(id),
    getSession(),
  ]);

  if (!deck) notFound();

  const isAuthenticated = Boolean(session.authenticated);
  const deleteDeckWithId = deleteDeck.bind(null, deck.id);
  const orderedSeriesDecks = deck.series ? sortSeriesDecks(deck.series.decks) : [];
  const seriesIndex = orderedSeriesDecks.findIndex((member) => member.id === deck.id);
  const previousDeck = seriesIndex > 0 ? orderedSeriesDecks[seriesIndex - 1] : null;
  const nextDeck = seriesIndex >= 0 && seriesIndex < orderedSeriesDecks.length - 1
    ? orderedSeriesDecks[seriesIndex + 1]
    : null;
  const collectionReasons = [
    deck.collectionReasonPrimary,
    deck.collectionReasonSecondary,
  ].filter((reason): reason is CollectionReasonValue => reason !== null);

  const deckJsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: deck.name,
    description: deck.hook ?? deck.notes ?? undefined,
    url: `${SITE_URL}/decks/${deck.id}`,
    image: deck.images.map((image) => image.url),
    creator: deck.designer ? { "@type": "Person", name: deck.designer } : undefined,
    publisher: deck.producer ? { "@type": "Organization", name: deck.producer } : undefined,
    dateCreated: deck.releaseYear ? String(deck.releaseYear) : undefined,
    keywords: deck.tags.length > 0 ? deck.tags.join(", ") : undefined,
    isPartOf: deck.series
      ? { "@type": "CollectionPage", name: deck.series.name, url: `${SITE_URL}/series/${deck.series.slug}` }
      : undefined,
  };

  return (
    <div className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(deckJsonLd) }}
      />
      {deck.series && (
        <SeriesDeckNavigation
          series={deck.series}
          previousDeck={previousDeck}
          nextDeck={nextDeck}
        />
      )}

      {isAuthenticated && (
        <div className="flex justify-end gap-2">
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

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <DeckGallery images={deck.images} tags={deck.tags} deckName={deck.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            {deck.series && (
              <Link
                href={`/series/${deck.series.slug}`}
                className="text-sm text-felt-sub hover:text-brass"
              >
                {deck.series.name}
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

          {deck.hook && (
            <p className="font-display text-lg italic leading-7 text-brass">{deck.hook}</p>
          )}

          {collectionReasons.length > 0 && (
            <p className="text-sm text-felt-sub">
              <span className="text-felt-sub/70">Why it&rsquo;s here:</span>{" "}
              {collectionReasons.map((reason, index) => (
                <span key={reason}>
                  {index > 0 && <span aria-hidden="true"> · </span>}
                  <Link
                    href={`/collection?reason=${reason}`}
                    className="text-felt-ink underline decoration-felt-line underline-offset-2 hover:text-brass"
                  >
                    {COLLECTION_REASON_DETAILS[reason].label}
                  </Link>
                </span>
              ))}
            </p>
          )}

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
                <StatTile label="Edition" value={`—/${deck.productionRun}`} />
              </div>
            )
          )}

          {deck.catalogNumber && (
            <p className="text-xs text-felt-sub">
              <span className="uppercase tracking-wide text-felt-sub/70">Catalog #</span>{" "}
              {deck.catalogNumber}
            </p>
          )}

          {deck.variantNote && (
            <div className="rounded-lg border border-felt-line bg-felt-surface p-4">
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-felt-sub/70">
                Within this Series
              </h2>
              <p className="text-sm text-felt-sub">{deck.variantNote}</p>
            </div>
          )}

          {deck.notes && (
            <div className="rounded-lg border border-felt-line bg-felt-surface p-4">
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-felt-sub/70">
                Note
              </h2>
              <p className="whitespace-pre-wrap text-sm text-felt-sub">{deck.notes}</p>
            </div>
          )}

          {deck.tags.length > 0 && (
            <section
              className="border-t border-felt-line pt-4"
              aria-labelledby="deck-classification-heading"
            >
              <h2
                id="deck-classification-heading"
                className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-felt-sub/70"
              >
                Classification
              </h2>
              <div className="flex flex-wrap gap-2">
                {deck.tags.map((tag) => (
                  <TagChip key={tag} tag={tag} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {deck.essay && (
        <section className="rounded-lg border border-felt-line bg-felt-surface p-5 sm:p-6">
          <h2 className="mb-4 font-display text-xl font-semibold text-brass">From the archives</h2>
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h3 className="mb-3 mt-6 font-display text-2xl font-semibold text-felt-ink first:mt-0">{children}</h3>,
              h2: ({ children }) => <h3 className="mb-3 mt-6 font-display text-xl font-semibold text-felt-ink first:mt-0">{children}</h3>,
              h3: ({ children }) => <h3 className="mb-2 mt-5 font-display text-lg font-semibold text-felt-ink first:mt-0">{children}</h3>,
              p: ({ children }) => <p className="mb-4 leading-7 text-felt-sub last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6 text-felt-sub">{children}</ul>,
              ol: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6 text-felt-sub">{children}</ol>,
              a: ({ href, children }) => <a href={href} className="text-brass underline decoration-brass/50 underline-offset-2 hover:text-brass-deep">{children}</a>,
              blockquote: ({ children }) => <blockquote className="mb-4 border-l-2 border-brass/60 pl-4 italic text-felt-sub">{children}</blockquote>,
            }}
          >
            {deck.essay}
          </ReactMarkdown>
        </section>
      )}

    </div>
  );
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
