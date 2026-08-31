import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";
import { getDeckPageData } from "@/lib/deck-data";
import { DeckGallery } from "@/components/deck-gallery";
import { StatTile } from "@/components/stat-tile";
import { CollectionProfile } from "@/components/collection-profile";
import { PencilIcon, TrashIcon, HeartIcon, WhaleIcon } from "@/components/icons";
import { FavoriteButton } from "@/components/favorite-button";
import { WhiteWhaleButton } from "@/components/white-whale-button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MarkdownNote } from "@/components/markdown-note";
import { SeriesDeckNavigation } from "@/components/series-deck-navigation";
import { getSession } from "@/lib/auth";
import { deleteDeck } from "../actions";
import { sortSeriesDecks } from "@/lib/series-order";
import { getSeriesDeckNavigation } from "@/lib/series-data";
import { SITE_URL } from "@/lib/site";
import {
  WEBSITE_JSON_LD_REFERENCE,
  breadcrumbJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/seo";
import type { CollectionReasonValue } from "@/lib/collection-reasons";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const deck = await getDeckPageData(id);
  if (!deck) return { title: "Deck Not Found" };

  const designerNames = deck.designers.map(({ designer }) => designer.name);
  const credit = [...designerNames, deck.producer].filter(Boolean).join(" / ");
  const description =
    deck.hook ??
    deck.notes ??
    [deck.name, credit, deck.releaseYear].filter(Boolean).join(" — ");
  const image = deck.images[0]?.url;

  return buildPageMetadata({
    title: deck.name,
    description,
    path: `/decks/${deck.id}`,
    image,
    imageAlt: `${deck.name} playing card deck`,
    keywords: ["playing cards", "playing card deck", ...deck.tags],
  });
}

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [deck, session] = await Promise.all([
    getDeckPageData(id),
    getSession(),
  ]);

  if (!deck) notFound();

  const isAuthenticated = Boolean(session.authenticated);
  const deleteDeckWithId = deleteDeck.bind(null, deck.id);
  const seriesDecks = deck.series ? await getSeriesDeckNavigation(deck.series.slug) : [];
  const orderedSeriesDecks = sortSeriesDecks(seriesDecks);
  const seriesIndex = orderedSeriesDecks.findIndex((member) => member.id === deck.id);
  const previousDeck = seriesIndex > 0 ? orderedSeriesDecks[seriesIndex - 1] : null;
  const nextDeck = seriesIndex >= 0 && seriesIndex < orderedSeriesDecks.length - 1
    ? orderedSeriesDecks[seriesIndex + 1]
    : null;
  const collectionReasons = [
    deck.collectionReasonPrimary,
    deck.collectionReasonSecondary,
  ].filter((reason): reason is CollectionReasonValue => reason !== null);
  const designerNames = deck.designers.map(({ designer }) => designer.name);

  const deckUrl = `${SITE_URL}/decks/${deck.id}`;
  const description = deck.hook ?? deck.notes ?? undefined;
  const additionalProperty = [
    deck.qty > 1
      ? { "@type": "PropertyValue", name: "Copies in collection", value: deck.qty }
      : null,
    deck.productionRun
      ? { "@type": "PropertyValue", name: "Production run", value: deck.productionRun }
      : null,
    deck.editions.length > 0
      ? {
          "@type": "PropertyValue",
          name: "Numbered copies in collection",
          value: deck.editions.map((edition) =>
            deck.productionRun
              ? `${edition.deckNumber}/${deck.productionRun}`
              : String(edition.deckNumber)
          ).join(", "),
        }
      : null,
  ].filter(Boolean);
  const deckJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${deckUrl}#webpage`,
        url: deckUrl,
        name: deck.name,
        description,
        isPartOf: WEBSITE_JSON_LD_REFERENCE,
        mainEntity: { "@id": `${deckUrl}#deck` },
        primaryImageOfPage: deck.images[0]
          ? { "@type": "ImageObject", url: deck.images[0].url }
          : undefined,
        breadcrumb: { "@id": `${deckUrl}#breadcrumb` },
        dateModified: deck.updatedAt.toISOString(),
      },
      {
        "@type": "CreativeWork",
        "@id": `${deckUrl}#deck`,
        name: deck.name,
        url: deckUrl,
        mainEntityOfPage: { "@id": `${deckUrl}#webpage` },
        abstract: deck.hook ?? undefined,
        description,
        image: deck.images.map((image) => image.url),
        genre: "Playing cards",
        creator: designerNames.length > 0
          ? designerNames.map((name) => ({ "@type": "Person", name }))
          : undefined,
        producer: deck.producer
          ? {
              "@type": designerNames.includes(deck.producer) ? "Person" : "Organization",
              name: deck.producer,
            }
          : undefined,
        creditText: [...designerNames, deck.producer].filter(Boolean).join(" / ") || undefined,
        datePublished: deck.releaseYear ? String(deck.releaseYear) : undefined,
        keywords: deck.tags.length > 0 ? deck.tags : undefined,
        identifier: deck.catalogNumber
          ? {
              "@type": "PropertyValue",
              propertyID: "Card Guy Archive catalog number",
              value: deck.catalogNumber,
            }
          : undefined,
        position: deck.seriesOrder ?? undefined,
        isPartOf: deck.series
          ? {
              "@type": "CreativeWorkSeries",
              "@id": `${SITE_URL}/series/${deck.series.slug}#series`,
              name: deck.series.name,
              url: `${SITE_URL}/series/${deck.series.slug}`,
            }
          : undefined,
        additionalProperty: additionalProperty.length > 0 ? additionalProperty : undefined,
      },
      breadcrumbJsonLd(
        [
          { name: "Collection", path: "/collection" },
          ...(deck.series
            ? [{ name: deck.series.name, path: `/series/${deck.series.slug}` }]
            : []),
          { name: deck.name, path: `/decks/${deck.id}` },
        ],
        `/decks/${deck.id}`
      ),
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(deckJsonLd) }}
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

      <div className="grid grid-cols-1 gap-y-5 md:grid-cols-2 md:gap-x-8">
        <div className="md:hidden">
          <DeckHeading
            name={deck.name}
            series={deck.series}
            qty={deck.qty}
            favorite={deck.favorite}
            whiteWhale={deck.whiteWhale}
            mobile
          />
        </div>

        <div>
          <DeckGallery images={deck.images} tags={deck.tags} deckName={deck.name} />
        </div>

        <div className="flex flex-col gap-5">
          <div className="hidden md:block">
            <DeckHeading
              name={deck.name}
              series={deck.series}
              qty={deck.qty}
              favorite={deck.favorite}
              whiteWhale={deck.whiteWhale}
            />
          </div>

          {deck.hook && (
            <p className="font-display text-lg italic leading-7 text-brass">{deck.hook}</p>
          )}

          {(designerNames.length > 0 ||
            deck.producer ||
            deck.releaseYear ||
            collectionReasons.length > 0 ||
            deck.tags.length > 0) && (
            <div className="flex flex-col divide-y divide-felt-line rounded-lg border border-felt-line bg-felt-surface">
              {designerNames.length > 0 && (
                <DesignersCreditRow creators={deck.designers.map(({ designer }) => designer)} />
              )}
              {deck.producer && (
                <CreditRow
                  label="Producer"
                  value={deck.producer}
                  href={
                    deck.producerCreator
                      ? `/creators/${deck.producerCreator.slug}`
                      : `/collection?producer=${encodeURIComponent(deck.producer)}`
                  }
                />
              )}
              {deck.releaseYear !== null && (
                <CreditRow
                  label="Release year"
                  value={String(deck.releaseYear)}
                  href={`/collection?minYear=${deck.releaseYear}&maxYear=${deck.releaseYear}`}
                />
              )}
              <CollectionProfile collectionReasons={collectionReasons} tags={deck.tags} />
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
              <MarkdownNote>{deck.notes}</MarkdownNote>
            </div>
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

function DeckHeading({
  name,
  series,
  qty,
  favorite,
  whiteWhale,
  mobile = false,
}: {
  name: string;
  series: { name: string; slug: string } | null;
  qty: number;
  favorite: boolean;
  whiteWhale: boolean;
  mobile?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      {mobile ? (
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-brass">
          Playing card deck
        </p>
      ) : (
        series && (
          <Link
            href={`/series/${series.slug}`}
            className="text-sm text-felt-sub hover:text-brass"
          >
            {series.name}
          </Link>
        )
      )}
      <div className="flex items-center gap-2.5">
        {mobile ? (
          <h1 className="font-display text-3xl font-semibold text-felt-ink">{name}</h1>
        ) : (
          <div
            role="heading"
            aria-level={1}
            className="font-display text-3xl font-semibold text-felt-ink"
          >
            {name}
          </div>
        )}
        {qty > 1 && (
          <span className="rounded-full bg-felt-surface px-2 py-0.5 text-xs font-medium text-felt-sub">
            ×{qty}
          </span>
        )}
        {favorite && (
          <HeartIcon filled className="h-5 w-5 shrink-0 text-brick" aria-label="Favorite" />
        )}
        {whiteWhale && (
          <span className="shrink-0 text-sage" aria-label="White Whale" title="White Whale">
            <WhaleIcon className="h-5 w-5" />
          </span>
        )}
      </div>
    </div>
  );
}

function DesignersCreditRow({ creators }: { creators: { name: string; slug: string }[] }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-xs uppercase tracking-wide text-felt-sub/70">
        {creators.length === 1 ? "Designer" : "Designers"}
      </span>
      <span className="min-w-0 text-right font-display text-base font-medium text-felt-ink">
        {creators.map((creator, index) => (
          <span key={creator.slug}>
            {index > 0 && <span className="text-felt-sub/60">, </span>}
            <Link
              href={`/creators/${creator.slug}`}
              className="hover:text-brass"
            >
              {creator.name}
            </Link>
          </span>
        ))}
      </span>
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
