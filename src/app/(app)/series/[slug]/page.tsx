import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { getSession } from "@/lib/auth";
import { getSeriesPageData } from "@/lib/series-data";
import { sortSeriesDecks } from "@/lib/series-order";
import { getSeriesFallbackHero } from "@/lib/series-fallback-hero";
import { DeckCard } from "@/components/deck-card";
import { ChevronDownIcon } from "@/components/icons";
import { SeriesEditor } from "@/components/series-editor";
import { SITE_URL } from "@/lib/site";
import { updateSeries } from "../actions";

const HERO_FADE_GRADIENT =
  "linear-gradient(to right, color-mix(in srgb, var(--felt-bg) 90%, transparent) 0%, color-mix(in srgb, var(--felt-bg) 90%, transparent) 44%, transparent 58%)";

/** Strips Markdown syntax down to plain text for a meta description, truncated to ~155 chars. */
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
  const series = await getSeriesPageData(slug);
  if (!series) return { title: "Series Not Found" };

  const description =
    series.subtitle ??
    (series.description ? toPlainDescription(series.description) : null) ??
    `${series.decks.length} ${series.decks.length === 1 ? "deck" : "decks"} in the Card Guy Archive's ${series.name} series.`;

  return { title: series.name, description };
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [series, session] = await Promise.all([
    getSeriesPageData(slug),
    getSession(),
  ]);

  if (!series) notFound();

  const decks = sortSeriesDecks(series.decks);
  const usesFallbackHero = !series.heroImageUrl;
  const heroImageUrl = series.heroImageUrl ?? getSeriesFallbackHero(series.id);
  const updateSeriesWithId = updateSeries.bind(null, series.id);

  const seriesJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: series.name,
    description: series.subtitle ?? undefined,
    url: `${SITE_URL}/series/${series.slug}`,
    isPartOf: { "@type": "WebSite", name: "Card Guy Archive", url: SITE_URL },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: decks.length,
      itemListElement: decks.slice(0, 50).map((deck, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/decks/${deck.id}`,
        name: deck.name,
      })),
    },
  };

  return (
    <div className="flex flex-col gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seriesJsonLd) }}
      />
      <div className="flex flex-col">
        <header className={`relative overflow-hidden border border-felt-line bg-felt-surface ${series.description ? "rounded-t-lg" : "rounded-lg"}`}>
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
              <SeriesEditor
                action={updateSeriesWithId}
                values={{
                  name: series.name,
                  subtitle: series.subtitle,
                  attributionLabel: series.attributionLabel,
                  attributionText: series.attributionText,
                  description: series.description,
                  heroImageUrl: series.heroImageUrl,
                }}
              />
            </div>
          )}
          <div className="relative flex min-h-72 max-w-xl flex-col justify-end gap-3 p-6 sm:min-h-80 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">Series</p>
            <h1 className="font-display text-4xl font-semibold leading-tight text-felt-ink sm:text-5xl">
              {series.name}
            </h1>
            {series.subtitle && <p className="font-display text-lg italic text-brass">{series.subtitle}</p>}
            {(series.attributionLabel || series.attributionText) && (
              <p className="text-sm text-felt-sub">
                {series.attributionLabel && (
                  <span className={`${series.attributionText ? "mr-2" : ""} uppercase tracking-wide text-felt-sub/70`}>
                    {series.attributionLabel}
                  </span>
                )}
                {series.attributionText && <span className="text-felt-ink">{series.attributionText}</span>}
              </p>
            )}
          </div>
        </header>

        {series.description && (
          <details className="group overflow-hidden rounded-b-lg border border-t-0 border-felt-line bg-felt-surface">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-felt-surface-2/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brass [&::-webkit-details-marker]:hidden">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-brass">
                About this Series
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
                {series.description}
              </ReactMarkdown>
            </div>
          </details>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h2 className="whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.2em] text-brass">
            {decks.length} {decks.length === 1 ? "Deck" : "Decks"} in the Series
          </h2>
          <div className="h-px flex-1 bg-brass/30" />
        </div>
        {decks.length === 0 ? (
          <p className="py-12 text-center text-felt-sub">No Decks are currently assigned to this Series.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={{ ...deck, series: series.name }} uniformHeight />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
