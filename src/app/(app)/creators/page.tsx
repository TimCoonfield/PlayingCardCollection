import type { Metadata } from "next";
import { getCreatorDirectory } from "@/lib/catalog-metadata";
import { CreatorDirectory } from "@/components/creator-directory";
import { SITE_URL } from "@/lib/site";
import { serializeJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Creators",
  description:
    "The people, studios, designers, and producers represented in the Card Guy Archive.",
};

export default async function CreatorsPage() {
  const creators = await getCreatorDirectory();

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
        url: `${SITE_URL}/creators/${creator.slug}`,
        name: creator.displayName ?? creator.name,
      })),
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(creatorsJsonLd) }}
      />
      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-semibold text-felt-ink">Creators</h1>
        <p className="mt-2 text-sm leading-relaxed text-felt-sub">
          This is where I&rsquo;m gathering the people and studios behind the archive—their stories,
          their creative signatures, and the decks and coins they designed or produced.
        </p>
      </div>

      <CreatorDirectory creators={creators} />
    </div>
  );
}
