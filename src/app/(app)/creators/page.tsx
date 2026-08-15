import { prisma } from "@/lib/prisma";
import { CREATORS } from "@/lib/featured-creators";
import { getCreatorCounts } from "@/lib/catalog-metadata";
import { CreatorSpotlightCard } from "@/components/creator-spotlight-card";

export default async function CreatorsPage() {
  const [creatorCounts, representativeDecks] = await Promise.all([
    getCreatorCounts(),
    Promise.all(
      CREATORS.map(async (creator) => {
        const where = creator.collectionProducer && creator.collectionDesigners
          ? {
              OR: [
                { producer: creator.collectionProducer },
                { designer: { in: creator.collectionDesigners } },
              ],
            }
          : creator.collectionProducer
            ? { producer: creator.collectionProducer }
          : creator.matchProducerToo
            ? { OR: [{ designer: creator.designer }, { producer: creator.designer }] }
            : { designer: creator.designer };
        return prisma.deck.findFirst({
          where: { AND: [where, { images: { some: {} } }] },
          orderBy: { name: "asc" },
          select: { images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } } },
        });
      })
    ),
  ]);
  const creators = CREATORS.map((creator, index) => ({
    ...creator,
    deckCount: creatorCounts[creator.designer] ?? 0,
    directoryImageUrl:
      creator.spotlightImageUrl ?? representativeDecks[index]?.images[0]?.url,
    directoryImageAlt:
      creator.spotlightImageAlt ?? `Artwork from a deck by ${creator.designer}`,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-felt-ink">Creators</h1>
        <p className="mt-2 text-sm leading-relaxed text-felt-sub">
          This is where I&rsquo;m gathering the artists and designers whose work has earned a
          dedicated corner of the archive—their stories, their creative signatures, and the decks
          of theirs in my collection.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {creators.map((creator) => (
          <CreatorSpotlightCard
            key={creator.designer}
            name={creator.displayName ?? creator.designer}
            tagline={creator.tagline}
            imageUrl={creator.directoryImageUrl}
            imageAlt={creator.directoryImageAlt}
            deckCount={creator.deckCount}
            href={creator.landingPageHref}
            accent={creator.accent}
          />
        ))}
      </div>
    </div>
  );
}
