import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sortSeriesDecks } from "@/lib/series-order";
import { DeckCard } from "@/components/deck-card";
import { SeriesEditor } from "@/components/series-editor";
import { updateSeries } from "../actions";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const series = await prisma.series.findUnique({ where: { slug }, select: { name: true, subtitle: true } });
  return series
    ? { title: `${series.name} | Card Guy Archive`, description: series.subtitle ?? undefined }
    : { title: "Series Not Found | Card Guy Archive" };
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [series, session] = await Promise.all([
    prisma.series.findUnique({
      where: { slug },
      include: {
        decks: {
          select: {
            id: true,
            name: true,
            designer: true,
            producer: true,
            qty: true,
            tags: true,
            favorite: true,
            whiteWhale: true,
            releaseYear: true,
            seriesOrder: true,
            variantNote: true,
            images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
          },
        },
      },
    }),
    getSession(),
  ]);

  if (!series) notFound();

  const decks = sortSeriesDecks(series.decks);
  const fallbackImageUrl = decks.find((deck) => deck.images.length > 0)?.images[0]?.url;
  const heroImageUrl = series.heroImageUrl ?? fallbackImageUrl;
  const updateSeriesWithId = updateSeries.bind(null, series.id);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <Link href="/collection" className="text-sm text-felt-sub hover:text-brass">
          ← Back to collection
        </Link>
        {session.authenticated && (
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
        )}
      </div>

      <header className="relative min-h-72 overflow-hidden rounded-lg border border-felt-line bg-felt-surface sm:min-h-80">
        {heroImageUrl ? (
          <Image
            src={heroImageUrl}
            alt=""
            fill
            priority
            unoptimized={heroImageUrl.startsWith("/")}
            sizes="(min-width: 1200px) 1152px, 100vw"
            className="object-cover opacity-55"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-end overflow-hidden bg-[radial-gradient(circle_at_75%_35%,var(--felt-surface-2),var(--felt-bg)_70%)] pr-[10%] text-[9rem] text-brass/20 sm:text-[13rem]">
            ♠
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-felt-bg via-felt-bg/85 to-felt-bg/10" />
        <div className="relative flex min-h-72 max-w-2xl flex-col justify-end gap-3 p-6 sm:min-h-80 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">Series</p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-felt-ink sm:text-5xl">
            {series.name}
          </h1>
          {series.subtitle && <p className="font-display text-lg italic text-brass">{series.subtitle}</p>}
          {series.attributionText && (
            <p className="text-sm text-felt-sub">
              {series.attributionLabel && <span className="mr-2 uppercase tracking-wide text-felt-sub/70">{series.attributionLabel}</span>}
              <span className="text-felt-ink">{series.attributionText}</span>
            </p>
          )}
          <p className="text-sm text-felt-sub">
            {decks.length} {decks.length === 1 ? "Deck" : "Decks"} in this Series
          </p>
        </div>
      </header>

      {series.description && (
        <section className="rounded-lg border border-felt-line bg-felt-surface p-5 sm:p-6">
          <h2 className="mb-4 font-display text-xl font-semibold text-brass">About this Series</h2>
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
        </section>
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h2 className="whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.2em] text-brass">
            The Series
          </h2>
          <div className="h-px flex-1 bg-brass/30" />
        </div>
        {decks.length === 0 ? (
          <p className="py-12 text-center text-felt-sub">No Decks are currently assigned to this Series.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {decks.map((deck) => (
              <div key={deck.id} className="flex flex-col gap-2">
                <DeckCard deck={{ ...deck, series: series.name }} />
                {deck.variantNote && (
                  <p className="px-1 text-xs leading-5 text-felt-sub">{deck.variantNote}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
