import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getSession } from "@/lib/auth";
import { getCreatorPageData } from "@/lib/creator-data";
import { getCreatorLandingCatalog } from "@/lib/catalog-browse";
import { getSeriesFallbackHero } from "@/lib/series-fallback-hero";
import { SITE_URL } from "@/lib/site";
import { buildPageMetadata, serializeJsonLd } from "@/lib/seo";
import { CreatorEditor } from "@/components/creator-editor";
import { ScopedCollectionBrowser } from "@/components/scoped-collection-browser";
import { ChevronDownIcon } from "@/components/icons";
import { updateCreator } from "../actions";

const HERO_FADE_GRADIENT =
  "linear-gradient(to right, color-mix(in srgb, var(--felt-bg) 90%, transparent) 0%, color-mix(in srgb, var(--felt-bg) 90%, transparent) 44%, transparent 58%)";

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
  const usesFallbackHero = !creator.heroImageUrl;
  const heroImageUrl = creator.heroImageUrl ?? getSeriesFallbackHero(creator.id);
  const updateCreatorWithId = updateCreator.bind(null, creator.id);
  const itemCount = decks.length + coins.length;
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
      <div className="flex flex-col">
        <header
          className={`relative overflow-hidden border border-felt-line bg-felt-surface ${
            creator.description ? "rounded-t-lg" : "rounded-lg"
          }`}
        >
          <Image
            src={heroImageUrl}
            alt=""
            fill
            priority
            sizes="(min-width: 1200px) 1152px, 100vw"
            className={`pointer-events-none object-cover opacity-[0.18] ${
              usesFallbackHero ? "lg:object-[64%_center] lg:opacity-55" : "lg:opacity-100"
            }`}
          />
          <div
            className="pointer-events-none absolute inset-0 hidden lg:block"
            style={{ background: HERO_FADE_GRADIENT }}
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
          <div className="relative flex min-h-72 max-w-xl flex-col justify-end gap-3 p-6 sm:min-h-80 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">Creator</p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-felt-ink sm:text-5xl">
              {title}
            </h1>
            {creator.tagline && (
              <p className="font-display text-lg italic text-brass">{creator.tagline}</p>
            )}
            <p className="text-sm text-felt-sub">
              {decks.length} {decks.length === 1 ? "deck" : "decks"}
              {coins.length > 0 && ` · ${coins.length} ${coins.length === 1 ? "coin" : "coins"}`}
            </p>
          </div>
        </header>

        {creator.description && (
          <details className="group overflow-hidden rounded-b-lg border border-t-0 border-felt-line bg-felt-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-felt-surface-2/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brass [&::-webkit-details-marker]:hidden">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-brass">
                About this Creator
              </h2>
              <ChevronDownIcon className="h-4 w-4 text-felt-sub transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <div className="border-t border-felt-line px-5 py-5 sm:px-6 sm:py-6">
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
                {creator.description}
              </ReactMarkdown>
            </div>
          </details>
        )}
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
