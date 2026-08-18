import type { Metadata } from "next";
import { CREATORS } from "@/lib/featured-creators";
import { getCreatorCounts, getCreatorRepresentativeImages } from "@/lib/catalog-metadata";
import { CreatorSpotlightCard } from "@/components/creator-spotlight-card";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Creators",
  description:
    "The designers, illustrators, and studios featured in the Card Guy Archive collection.",
};

export default async function CreatorsPage() {
  const [creatorCounts, representativeImages] = await Promise.all([
    getCreatorCounts(),
    getCreatorRepresentativeImages(),
  ]);
  const creators = CREATORS.map((creator) => ({
    ...creator,
    deckCount: creatorCounts[creator.designer] ?? 0,
    directoryImageUrl:
      creator.spotlightImageUrl ?? representativeImages[creator.designer] ?? undefined,
    directoryImageAlt:
      creator.spotlightImageAlt ?? `Artwork from a deck by ${creator.designer}`,
  }));

  const creatorsJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Creators",
    description: metadata.description,
    url: `${SITE_URL}/creators`,
    isPartOf: { "@type": "WebSite", name: "Card Guy Archive", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: creators.length,
      itemListElement: creators.map((creator, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}${creator.landingPageHref}`,
        name: creator.displayName ?? creator.designer,
      })),
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creatorsJsonLd) }}
      />
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
