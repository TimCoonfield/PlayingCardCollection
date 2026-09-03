import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getSeriesPageData } from "@/lib/series-data";
import { sortSeriesDecks } from "@/lib/series-order";
import { DeckCard } from "@/components/deck-card";
import { EditorialProfileModal } from "@/components/editorial-profile-modal";
import { MarkdownNote } from "@/components/markdown-note";
import { ProfileHeaderWatermark } from "@/components/profile-monogram-art";
import { SeriesEditor } from "@/components/series-editor";
import { SITE_URL } from "@/lib/site";
import { updateSeries } from "../actions";

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
  const updateSeriesWithId = updateSeries.bind(null, series.id);
  const hasHeaderDetails = Boolean(
    series.subtitle ||
      series.attributionLabel ||
      series.attributionText ||
      series.description
  );
  const usesLargeTitle = series.name.length <= 18;
  const modalMetadata = [
    `${decks.length} ${decks.length === 1 ? "deck" : "decks"} in the archive`,
    series.attributionText
      ? `${series.attributionLabel ? `${series.attributionLabel}: ` : ""}${series.attributionText}`
      : null,
  ].filter((value): value is string => Boolean(value));

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
      <div>
        <header className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
          <div
            className="pointer-events-none absolute inset-0 opacity-45"
            style={{
              background:
                "radial-gradient(circle at 88% 18%, color-mix(in srgb, var(--brass) 13%, transparent), transparent 30%), repeating-linear-gradient(135deg, color-mix(in srgb, var(--felt-ink) 2.5%, transparent) 0 1px, transparent 1px 14px)",
            }}
          />
          <ProfileHeaderWatermark title={series.name} seed={series.id} />
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
          <div
            className={`relative flex max-w-3xl flex-col justify-center gap-3 p-6 sm:p-8 lg:px-10 ${
              hasHeaderDetails
                ? "min-h-52 sm:min-h-56 lg:min-h-60"
                : "min-h-40 sm:min-h-44 lg:min-h-48"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">Series</p>
            <h1
              className={`max-w-2xl font-display font-semibold leading-tight text-felt-ink ${
                usesLargeTitle
                  ? "text-5xl sm:text-6xl lg:text-7xl"
                  : "text-4xl sm:text-5xl lg:text-6xl"
              }`}
            >
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
            {series.description && (
              <EditorialProfileModal
                kind="Series"
                title={series.name}
                tagline={series.subtitle}
                heroImageUrl={series.heroImageUrl}
                fallbackSeed={series.id}
                metadata={modalMetadata}
              >
                <MarkdownNote>{series.description}</MarkdownNote>
              </EditorialProfileModal>
            )}
          </div>
        </header>
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
