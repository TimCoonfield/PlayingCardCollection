import { prisma } from "@/lib/prisma";
import { StatTile } from "@/components/stat-tile";
import { HorizontalRankedChart, PieBreakdownChart, YearHistogramChart } from "@/components/stats-charts";
import { SeriesShowcase, type SeriesSpotlightDatum } from "@/components/series-showcase";
import { DeckCard } from "@/components/deck-card";
import { CardsIcon, PaletteIcon, CoinIcon, LayersIcon, CameraIcon } from "@/components/icons";
import { getSession } from "@/lib/auth";
import { getDeckWorkCounts } from "@/lib/catalog-browse";
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
function bucketReleaseYear(year: number): { label: string; sortKey: number } {
  if (year >= 2000) return { label: String(year), sortKey: year };
  if (year >= 1900) {
    const decade = Math.floor(year / 10) * 10;
    return { label: `${decade}s`, sortKey: decade };
  }
  return { label: "Before 1900", sortKey: 0 };
}

// Modern, Vintage, Antique — validated against the felt surface (#234f3a)
const ERA_COLORS = ["#b58a35", "#8266b3", "#b1473f"];

export default async function StatsPage() {
  const session = await getSession();
  const isAuthenticated = Boolean(session.authenticated);
  const [metadata, summaryMetadata, chartMetadata, recentDecks, workCounts] = await Promise.all([
    getCoreCatalogMetadata(),
    getStatsSummaryMetadata(),
    getStatsChartMetadata(),
    prisma.deck.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        series: { select: { name: true } },
        designer: true,
        producer: true,
        qty: true,
        tags: true,
        favorite: true,
        whiteWhale: true,
        images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
    }),
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

  const yearBuckets = new Map<string, { count: number; sortKey: number }>();
  for (const g of releaseYearGroups) {
    const { label, sortKey } = bucketReleaseYear(g.releaseYear!);
    const existing = yearBuckets.get(label);
    if (existing) existing.count += g._count._all;
    else yearBuckets.set(label, { count: g._count._all, sortKey });
  }
  const yearData = Array.from(yearBuckets.entries())
    .map(([label, { count, sortKey }]) => ({ label, count, sortKey }))
    .sort((a, b) => a.sortKey - b.sortKey);

  const seriesShowcase: SeriesSpotlightDatum[] = await Promise.all(
    topSeriesGroups.map((series) =>
      buildSeriesSpotlight(series.id, series.name, series.slug, series._count.decks)
    )
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-xl font-semibold text-felt-ink">Collection Stats</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile icon={<CardsIcon className="h-6 w-6" />} label="Total unique decks" value={metadata.totalDecks} />
        <StatTile icon={<CardsIcon className="h-6 w-6" />} label="Total decks" value={summaryMetadata.totalQuantity} />
        <StatTile icon={<PaletteIcon className="h-6 w-6" />} label="Designers" value={metadata.designerCount} />
        <StatTile icon={<CoinIcon className="h-6 w-6" />} label="Coins" value={metadata.coinCount} />
        <StatTile icon={<LayersIcon className="h-6 w-6" />} label="Series" value={metadata.seriesCount} />
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
              href="/collection?type=deck&missingYear=1"
            />
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Top designers by deck count">
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

      <ChartCard title="Biggest series in the collection">
        <SeriesShowcase items={seriesShowcase} />
      </ChartCard>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-base font-semibold tracking-wide text-brass">Recently added</h2>
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

async function buildSeriesSpotlight(
  seriesId: string,
  seriesName: string,
  slug: string,
  count: number
): Promise<SeriesSpotlightDatum> {
  const decks = await prisma.deck.findMany({
    where: { seriesId },
    select: { id: true, name: true, tags: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  const withImages = decks.filter((d) => d.images.length > 0);
  const pool = withImages.length > 0 ? withImages : decks;
  const pick = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;

  return {
    series: seriesName,
    slug,
    count,
    deck: pick
      ? { id: pick.id, name: pick.name, tags: pick.tags, imageUrl: pick.images[0]?.url ?? null }
      : null,
  };
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-felt-line bg-felt-surface p-4">
      <h2 className="font-display text-base font-semibold tracking-wide text-brass">{title}</h2>
      {children}
    </div>
  );
}
