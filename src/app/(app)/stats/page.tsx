import { prisma } from "@/lib/prisma";
import { StatTile } from "@/components/stat-tile";
import { HorizontalRankedChart, PieBreakdownChart } from "@/components/stats-charts";
import { SeriesShowcase, type SeriesSpotlightDatum } from "@/components/series-showcase";

const CHART_COLORS = {
  designer: "#b58a35",
};

// Modern, Vintage, Antique — validated against the felt surface (#234f3a)
const ERA_COLORS = ["#b58a35", "#8266b3", "#b1473f"];

export default async function StatsPage() {
  const [
    totalDecks,
    qtySum,
    designerGroups,
    seriesGroups,
    allDesigners,
    allProducers,
    modernCount,
    vintageCount,
    antiqueCount,
    topSeriesGroups,
  ] = await Promise.all([
    prisma.deck.count(),
    prisma.deck.aggregate({ _sum: { qty: true } }),
    prisma.deck.groupBy({
      by: ["designer"],
      where: { designer: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { designer: "desc" } },
      take: 10,
    }),
    prisma.deck.groupBy({
      by: ["series"],
      where: { series: { not: null } },
    }),
    prisma.deck.groupBy({ by: ["designer"], where: { designer: { not: null } } }),
    prisma.deck.groupBy({ by: ["producer"], where: { producer: { not: null } } }),
    prisma.deck.count({ where: { tags: { has: "Modern" } } }),
    prisma.deck.count({ where: { tags: { has: "Vintage" } } }),
    prisma.deck.count({ where: { tags: { has: "Antique" } } }),
    prisma.deck.groupBy({
      by: ["series"],
      where: { series: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { series: "desc" } },
      take: 3,
    }),
  ]);

  const designerData = designerGroups.map((g) => ({
    label: g.designer!,
    count: g._count._all,
  }));

  const eraData = [
    { label: "Modern", count: modernCount },
    { label: "Vintage", count: vintageCount },
    { label: "Antique", count: antiqueCount },
  ];

  const seriesShowcase: SeriesSpotlightDatum[] = await Promise.all(
    topSeriesGroups.map((g) => buildSeriesSpotlight(g.series!, g._count._all))
  );

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-xl font-semibold text-felt-ink">Collection Stats</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Total unique decks" value={totalDecks} />
        <StatTile label="Total decks" value={qtySum._sum.qty ?? 0} />
        <StatTile label="Designers" value={allDesigners.length} />
        <StatTile label="Producers" value={allProducers.length} />
        <StatTile label="Series" value={seriesGroups.length} />
      </div>

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

      <ChartCard title="Biggest series in the collection">
        <SeriesShowcase items={seriesShowcase} />
      </ChartCard>
    </div>
  );
}

async function buildSeriesSpotlight(seriesName: string, count: number): Promise<SeriesSpotlightDatum> {
  const decks = await prisma.deck.findMany({
    where: { series: seriesName },
    select: { id: true, name: true, tags: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });
  const withImages = decks.filter((d) => d.images.length > 0);
  const pool = withImages.length > 0 ? withImages : decks;
  const pick = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;

  return {
    series: seriesName,
    count,
    deck: pick
      ? { id: pick.id, name: pick.name, tags: pick.tags, imageUrl: pick.images[0]?.url ?? null }
      : null,
  };
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-felt-line bg-felt-surface p-4">
      <h2 className="text-sm font-medium text-felt-sub">{title}</h2>
      {children}
    </div>
  );
}
