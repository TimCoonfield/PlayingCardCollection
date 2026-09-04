import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getCreatorPageData } from "@/lib/creator-data";
import { getCreatorLandingCatalog } from "@/lib/catalog-browse";
import { SITE_URL } from "@/lib/site";
import { buildPageMetadata, serializeJsonLd } from "@/lib/seo";
import { CreatorEditor } from "@/components/creator-editor";
import { EditorialProfileModal } from "@/components/editorial-profile-modal";
import { MarkdownNote } from "@/components/markdown-note";
import { ProfileHeaderArtwork } from "@/components/profile-monogram-art";
import { ScopedCollectionBrowser } from "@/components/scoped-collection-browser";
import { updateCreator } from "../actions";

function toPlainDescription(markdown: string, maxLength = 155): string {
  const plain = markdown
    .replace(/[#>*_`~-]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength - 1).trimEnd()}…` : plain;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const creator = await getCreatorPageData(slug);
  if (!creator) return { title: "Creator Not Found" };
  const title = creator.displayName ?? creator.name;
  const description = creator.description
    ? toPlainDescription(creator.description)
    : `${title}'s playing-card and coin work represented in the Card Guy Archive.`;
  return buildPageMetadata({
    title,
    description,
    path: `/creators/${creator.slug}`,
    image: creator.heroImageUrl,
    imageAlt: `${title} creator profile`,
    keywords: [creator.name, "playing card creator"],
  });
}

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [creator, session] = await Promise.all([getCreatorPageData(slug), getSession()]);
  if (!creator) notFound();

  const { decks, coins } = await getCreatorLandingCatalog(creator.name, true);
  const title = creator.displayName ?? creator.name;
  const updateCreatorWithId = updateCreator.bind(null, creator.id);
  const itemCount = decks.length + coins.length;
  const hasHeaderDetails = Boolean(creator.tagline || creator.description);
  const usesLargeTitle = title.length <= 20;
  const modalMetadata = [
    `${decks.length} ${decks.length === 1 ? "deck" : "decks"}`,
    coins.length > 0 ? `${coins.length} ${coins.length === 1 ? "coin" : "coins"}` : null,
  ].filter((value): value is string => Boolean(value));
  const creatorUrl = `${SITE_URL}/creators/${creator.slug}`;
  const creatorJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: creator.description ? toPlainDescription(creator.description) : undefined,
    url: creatorUrl,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: itemCount,
      itemListElement: [
        ...decks.slice(0, 40).map((deck, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${SITE_URL}/decks/${deck.id}`,
          name: deck.name,
        })),
        ...coins.slice(0, 10).map((coin, index) => ({
          "@type": "ListItem",
          position: decks.slice(0, 40).length + index + 1,
          url: `${SITE_URL}/coins/${coin.id}`,
          name: coin.name,
        })),
      ],
    },
  };

  return (
    <div className="flex flex-col gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(creatorJsonLd) }}
      />
      <div>
        <header className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
          <div
            className="pointer-events-none absolute inset-0 opacity-45"
            style={{
              background:
                "radial-gradient(circle at 88% 18%, color-mix(in srgb, var(--brass) 13%, transparent), transparent 30%), repeating-linear-gradient(135deg, color-mix(in srgb, var(--felt-ink) 2.5%, transparent) 0 1px, transparent 1px 14px)",
            }}
          />
          <ProfileHeaderArtwork
            title={title}
            seed={creator.id}
            heroImageUrl={creator.heroImageUrl}
          />
          {session.authenticated && (
            <div className="absolute right-3 top-3 z-20">
              <CreatorEditor
                action={updateCreatorWithId}
                values={{
                  name: creator.name,
                  displayName: creator.displayName,
                  tagline: creator.tagline,
                  description: creator.description,
                  heroImageUrl: creator.heroImageUrl,
                  favorite: creator.favorite,
                }}
              />
            </div>
          )}
          <div
            className={`relative z-10 flex flex-col justify-center gap-3 p-6 sm:p-8 lg:px-10 ${
              creator.heroImageUrl ? "max-w-[82%] sm:max-w-[62%] xl:max-w-[58%]" : "max-w-3xl"
            } ${
              creator.heroImageUrl || hasHeaderDetails
                ? "min-h-48 sm:min-h-52 lg:min-h-56"
                : "min-h-40 sm:min-h-44 lg:min-h-48"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">Creator</p>
            <h1
              className={`max-w-2xl font-display font-semibold leading-tight text-felt-ink ${
                usesLargeTitle
                  ? "text-5xl sm:text-6xl lg:text-7xl"
                  : "text-4xl sm:text-5xl lg:text-6xl"
              }`}
            >
              {title}
            </h1>
            {creator.tagline && (
              <p className="font-display text-lg italic text-brass">{creator.tagline}</p>
            )}
            <p className="text-sm text-felt-sub">
              {decks.length} {decks.length === 1 ? "deck" : "decks"}
              {coins.length > 0 && ` · ${coins.length} ${coins.length === 1 ? "coin" : "coins"}`}
            </p>
            {creator.description && (
              <EditorialProfileModal
                kind="Creator"
                title={title}
                tagline={creator.tagline}
                heroImageUrl={creator.heroImageUrl}
                fallbackSeed={creator.id}
                metadata={modalMetadata}
              >
                <MarkdownNote>{creator.description}</MarkdownNote>
              </EditorialProfileModal>
            )}
          </div>
        </header>
      </div>

      {itemCount === 0 ? (
        <p className="py-14 text-center text-felt-sub">No items are currently credited to this Creator.</p>
      ) : (
        <ScopedCollectionBrowser
          decks={decks}
          coins={coins}
          showFeaturedDecks
          tagSet="all"
          isAuthenticated={Boolean(session.authenticated)}
        />
      )}
    </div>
  );
}
