import type { Metadata } from "next";
import Link from "next/link";
import { StatTile } from "@/components/stat-tile";
import { HorizontalRankedChart, PieBreakdownChart, YearHistogramChart } from "@/components/stats-charts";
import { SeriesShowcase, type SeriesSpotlightDatum } from "@/components/series-showcase";
import { DeckCard } from "@/components/deck-card";
import { CardsIcon, PaletteIcon, CoinIcon, LayersIcon, CameraIcon } from "@/components/icons";
import { getSession } from "@/lib/auth";
import { getDeckWorkCounts, getRecentDecks, getSeriesSpotlightDecks } from "@/lib/catalog-browse";
import {
  getCoreCatalogMetadata,
  getStatsChartMetadata,
  getStatsSummaryMetadata,
} from "@/lib/catalog-metadata";

const CHART_COLORS = {
  designer: "#b58a35",
};

// Buckets a release year into the histogram's x-axis label: one bar per year from 2000 on,
// one bar per decade for 1900-1999, and a single catch-all bar for anything before 1900.
function bucketReleaseYear(year: number): { label: string; sortKey: number; href: string } {
  if (year >= 2000) {
    return {
      label: String(year),
      sortKey: year,
      href: `/collection?type=deck&minYear=${year}&maxYear=${year}`,
    };
  }
  if (year >= 1900) {
    const decade = Math.floor(year / 10) * 10;
    return {
      label: `${decade}s`,
      sortKey: decade,
      href: `/collection?type=deck&minYear=${decade}&maxYear=${decade + 9}`,
    };
  }
  return {
    label: "Before 1900",
    sortKey: 0,
    href: "/collection?type=deck&maxYear=1899",
  };
}

// Modern, Vintage, Antique — validated against the felt surface (#234f3a)
const ERA_COLORS = ["#b58a35", "#8266b3", "#b1473f"];

export const metadata: Metadata = {
  title: "Stats",
  description:
    "Aggregate statistics for the Card Guy Archive collection — totals, top designers, era breakdown, release-year history, and biggest series.",
};

export default async function StatsPage() {
  const session = await getSession();
  const isAuthenticated = Boolean(session.authenticated);
  const [metadata, summaryMetadata, chartMetadata, recentDecks, workCounts] = await Promise.all([
    getCoreCatalogMetadata(),
    getStatsSummaryMetadata(),
    getStatsChartMetadata(),
    getRecentDecks(),
    isAuthenticated ? getDeckWorkCounts() : Promise.resolve(null),
  ]);
  const { designerGroups, topSeriesGroups, releaseYearGroups } = chartMetadata;

  const designerData = designerGroups.map((g) => ({
    label: g.designer!,
    count: g._count._all,
  }));

  const eraData = [
    { label: "Modern", count: summaryMetadata.modernCount },
    { label: "Vintage", count: summaryMetadata.vintageCount },
    { label: "Antique", count: summaryMetadata.antiqueCount },
  ];

  const yearBuckets = new Map<string, { count: number; sortKey: number; href: string }>();
  for (const g of releaseYearGroups) {
    const { label, sortKey, href } = bucketReleaseYear(g.releaseYear!);
    const existing = yearBuckets.get(label);
    if (existing) existing.count += g._count._all;
    else yearBuckets.set(label, { count: g._count._all, sortKey, href });
  }
  const yearData = Array.from(yearBuckets.entries())
    .map(([label, { count, sortKey, href }]) => ({ label, count, sortKey, href }))
    .sort((a, b) => a.sortKey - b.sortKey);

  const spotlightDecks = await getSeriesSpotlightDecks(topSeriesGroups.map((series) => series.id));
  const seriesShowcase: SeriesSpotlightDatum[] = topSeriesGroups.map((series) => {
    const deck = spotlightDecks.get(series.id);
    return {
      series: series.name,
      slug: series.slug,
      count: series._count.decks,
      deck: deck
        ? { id: deck.id, name: deck.name, tags: deck.tags, imageUrl: deck.images[0]?.url ?? null }
        : null,
    };
  });

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-xl font-semibold text-felt-ink">Collection Stats</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={<CardsIcon className="h-6 w-6" />} label="Total unique decks" value={metadata.totalDecks} href="/collection?type=deck" />
        <StatTile icon={<CardsIcon className="h-6 w-6" />} label="Total decks" value={summaryMetadata.totalQuantity} href="/collection?type=deck" />
        <StatTile icon={<PaletteIcon className="h-6 w-6" />} label="Designers" value={metadata.designerCount} href="#top-designers" />
        <StatTile icon={<CoinIcon className="h-6 w-6" />} label="Coins" value={metadata.coinCount} href="/collection?type=coin" />
        <StatTile icon={<LayersIcon className="h-6 w-6" />} label="Series" value={metadata.seriesCount} href="#biggest-series" />
      </div>

      {workCounts && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-base font-semibold tracking-wide text-brass">
            Work to be Done
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatTile
              icon={<CameraIcon className="h-6 w-6" />}
              label={`Decks missing photo · ${workCounts.photoCompletionPercent}% complete`}
              value={workCounts.missingPhotoCount}
              href="/collection?type=deck&missingPhoto=1"
            />
            <StatTile
              icon={<LayersIcon className="h-6 w-6" />}
              label="Decks missing year"
              value={workCounts.missingYearCount}
              href="/decks/missing-years"
            />
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard id="top-designers" title="Top designers by deck count">
          <HorizontalRankedChart
            data={designerData}
            color={CHART_COLORS.designer}
            linkParam="designer"
          />
        </ChartCard>
        <ChartCard title="Modern vs. Vintage vs. Antique">
          <PieBreakdownChart
            data={eraData}
            colors={ERA_COLORS}
            linkParam="tag"
          />
        </ChartCard>
      </div>

      {yearData.length > 0 && (
        <ChartCard title="Decks by release year">
          <YearHistogramChart data={yearData} color={CHART_COLORS.designer} />
        </ChartCard>
      )}

      <ChartCard id="biggest-series" title="Biggest series in the collection">
        <SeriesShowcase items={seriesShowcase} />
      </ChartCard>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-base font-semibold tracking-wide text-brass">
          <Link href="/collection?type=deck&sort=recent" className="hover:text-brass-deep">
            Recently added
          </Link>
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
          {recentDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={{ ...deck, series: deck.series?.name ?? null }}
              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 10vw"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 flex flex-col gap-3 rounded-lg border border-felt-line bg-felt-surface p-4">
      <h2 className="font-display text-base font-semibold tracking-wide text-brass">{title}</h2>
      {children}
    </div>
  );
}
