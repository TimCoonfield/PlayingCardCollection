import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeckGallery } from "@/components/deck-gallery";
import { BackLink } from "@/components/back-link";
import { StatTile } from "@/components/stat-tile";
import { TagChip } from "@/components/tag-chip";
import { PencilIcon, TrashIcon, HeartIcon } from "@/components/icons";
import { FavoriteButton } from "@/components/favorite-button";
import { getSession } from "@/lib/auth";
import { deleteDeck } from "../actions";

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const isAuthenticated = Boolean(session.authenticated);
  const deleteDeckWithId = deleteDeck.bind(null, deck.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackLink fallbackHref="/collection">← Back to collection</BackLink>
        {isAuthenticated && (
          <div className="flex gap-2">
            <FavoriteButton deckId={deck.id} initialFavorite={deck.favorite} />
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
              <button
                type="submit"
                aria-label="Delete deck"
                title="Delete"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brick/50 text-brick transition-colors hover:bg-brick/10"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
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
              {deck.releaseYear && <CreditRow label="Release year" value={String(deck.releaseYear)} />}
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
    </div>
  );
}

function CreditRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <span className="text-xs uppercase tracking-wide text-felt-sub/70">{label}</span>
      <span className="truncate text-sm font-medium text-felt-ink group-hover:text-brass">
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
