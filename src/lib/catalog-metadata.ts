import { unstable_cache } from "next/cache";
import { CREATORS } from "@/lib/featured-creators";
import { prisma } from "@/lib/prisma";
import {
  ARCHIVE_SERIES_METADATA_CACHE_TAG,
  CATALOG_CACHE_REVALIDATE_SECONDS,
  COLLECTION_CATALOG_METADATA_CACHE_TAG,
  CORE_CATALOG_METADATA_CACHE_TAG,
  CREATOR_CATALOG_METADATA_CACHE_TAG,
  HOME_CATALOG_METADATA_CACHE_TAG,
  STATS_CATALOG_METADATA_CACHE_TAG,
} from "@/lib/catalog-cache";

// Writes invalidate these snapshots immediately. The one-day lifetime is only a safety net for
// out-of-band database changes, not the normal freshness mechanism.

export const getCoreCatalogMetadata = unstable_cache(
  async () => {
    const [
      totalDecks,
      designerCount,
      seriesCount,
      coinCount,
    ] = await Promise.all([
      prisma.deck.count(),
      prisma.designer.count({ where: { decks: { some: {} } } }),
      prisma.series.count(),
      prisma.coin.count(),
    ]);

    return {
      totalDecks,
      designerCount,
      seriesCount,
      coinCount,
    };
  },
  ["core-catalog-metadata-v3"],
  { tags: [CORE_CATALOG_METADATA_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

export const getHomePageMetadata = unstable_cache(
  async () => {
    const [miniCount, tarotCount, souvenirCount, whiteWhaleCount] = await Promise.all([
      prisma.deck.count({ where: { tags: { has: "Mini" } } }),
      prisma.deck.count({ where: { tags: { has: "Tarot" } } }),
      prisma.deck.count({ where: { series: { is: { slug: "souvenir-decks" } } } }),
      prisma.deck.count({ where: { whiteWhale: true } }),
    ]);

    return { miniCount, tarotCount, souvenirCount, whiteWhaleCount };
  },
  ["home-page-metadata-v2"],
  { tags: [HOME_CATALOG_METADATA_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

export const getStatsSummaryMetadata = unstable_cache(
  async () => {
    const [qtySum, modernCount, vintageCount, antiqueCount] = await Promise.all([
      prisma.deck.aggregate({ _sum: { qty: true } }),
      prisma.deck.count({ where: { tags: { has: "Modern" } } }),
      prisma.deck.count({ where: { tags: { has: "Vintage" } } }),
      prisma.deck.count({ where: { tags: { has: "Antique" } } }),
    ]);

    return {
      totalQuantity: qtySum._sum.qty ?? 0,
      modernCount,
      vintageCount,
      antiqueCount,
    };
  },
  ["stats-summary-metadata-v2"],
  { tags: [STATS_CATALOG_METADATA_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

export const getCollectionMetadata = unstable_cache(
  async () => {
    const [
      deckYearRange,
      coinYearRange,
      deckDesigners,
      coinDesigners,
      deckProducers,
      coinProducers,
      deckSeries,
      coinSeries,
    ] = await Promise.all([
      prisma.deck.aggregate({ _min: { releaseYear: true }, _max: { releaseYear: true } }),
      prisma.coin.aggregate({ _min: { releaseYear: true }, _max: { releaseYear: true } }),
      prisma.designer.findMany({
        where: { decks: { some: {} } },
        select: { name: true },
      }),
      prisma.coin.findMany({
        distinct: ["designer"],
        where: { designer: { not: null } },
        select: { designer: true },
      }),
      prisma.deck.findMany({
        distinct: ["producer"],
        where: { producer: { not: null } },
        select: { producer: true },
      }),
      prisma.coin.findMany({
        distinct: ["producer"],
        where: { producer: { not: null } },
        select: { producer: true },
      }),
      prisma.series.findMany({ select: { name: true } }),
      prisma.coin.findMany({
        distinct: ["series"],
        where: { series: { not: null } },
        select: { series: true },
      }),
    ]);

    const yearValues = [
      deckYearRange._min.releaseYear,
      deckYearRange._max.releaseYear,
      coinYearRange._min.releaseYear,
      coinYearRange._max.releaseYear,
    ].filter((year): year is number => year !== null);
    const availableMinYear = yearValues.length > 0
      ? Math.min(...yearValues)
      : new Date().getFullYear();
    const availableMaxYear = yearValues.length > 0
      ? Math.max(...yearValues)
      : availableMinYear;

    return {
      availableMinYear,
      availableMaxYear,
      designers: Array.from(
        new Set([
          ...deckDesigners.map(({ name }) => name),
          ...coinDesigners
            .map(({ designer }) => designer)
            .filter((value): value is string => Boolean(value)),
        ])
      ).sort(),
      producers: Array.from(
        new Set([
          ...deckProducers
            .map(({ producer }) => producer)
            .filter((value): value is string => Boolean(value)),
          ...coinProducers
            .map(({ producer }) => producer)
            .filter((value): value is string => Boolean(value)),
        ])
      ).sort(),
      series: Array.from(
        new Set([
          ...deckSeries.map(({ name }) => name),
          ...coinSeries
            .map(({ series }) => series)
            .filter((value): value is string => Boolean(value)),
        ])
      ).sort(),
    };
  },
  ["collection-metadata-v3"],
  { tags: [COLLECTION_CATALOG_METADATA_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

export const getStatsChartMetadata = unstable_cache(
  async () => {
    const [designerGroups, topSeriesGroups, releaseYearGroups] = await Promise.all([
      prisma.designer.findMany({
        where: { decks: { some: {} } },
        select: { name: true, _count: { select: { decks: true } } },
        orderBy: { decks: { _count: "desc" } },
        take: 10,
      }),
      prisma.series.findMany({
        select: { id: true, name: true, slug: true, _count: { select: { decks: true } } },
        orderBy: { decks: { _count: "desc" } },
        take: 5,
      }),
      prisma.deck.groupBy({
        by: ["releaseYear"],
        where: { releaseYear: { not: null } },
        _count: { _all: true },
      }),
    ]);

    return {
      designerGroups: designerGroups.map(({ name, _count }) => ({
        designer: name,
        _count: { _all: _count.decks },
      })),
      topSeriesGroups,
      releaseYearGroups,
    };
  },
  ["stats-chart-metadata-v3"],
  { tags: [STATS_CATALOG_METADATA_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

export const getCreatorCounts = unstable_cache(
  async () => {
    const counts = await Promise.all(
      CREATORS.map((creator) =>
        prisma.deck.count({
          where: creator.collectionProducer && creator.collectionDesigners
            ? {
                OR: [
                  { producer: creator.collectionProducer },
                  { designers: { some: { designer: { name: { in: creator.collectionDesigners } } } } },
                ],
              }
            : creator.collectionProducer
              ? { producer: creator.collectionProducer }
            : creator.matchProducerToo
              ? {
                  OR: [
                    { designers: { some: { designer: { name: creator.designer } } } },
                    { producer: creator.designer },
                  ],
                }
              : { designers: { some: { designer: { name: creator.designer } } } },
        })
      )
    );

    return Object.fromEntries(
      CREATORS.map((creator, index) => [creator.designer, counts[index]])
    );
  },
  [
    "curated-creator-counts-v4",
    ...CREATORS.flatMap((creator) => [
      creator.collectionProducer ?? creator.designer,
      ...(creator.collectionDesigners ?? []),
    ]),
  ],
  { tags: [CREATOR_CATALOG_METADATA_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

export const getCreatorRepresentativeImages = unstable_cache(
  async () => {
    const creatorsNeedingImages = CREATORS.filter((creator) => !creator.spotlightImageUrl);
    if (creatorsNeedingImages.length === 0) return {};

    const decks = await prisma.deck.findMany({
      where: { images: { some: {} } },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        designers: { select: { designer: { select: { name: true } } } },
        producer: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    });

    return Object.fromEntries(
      creatorsNeedingImages.map((creator) => {
        const deck = decks.find(({ designers, producer }) => {
          const designerNames = designers.map(({ designer }) => designer.name);
          return (
          creator.collectionProducer && creator.collectionDesigners
            ? producer === creator.collectionProducer || creator.collectionDesigners.some((name) => designerNames.includes(name))
            : creator.collectionProducer
              ? producer === creator.collectionProducer
              : creator.matchProducerToo
                ? designerNames.includes(creator.designer) || producer === creator.designer
                : designerNames.includes(creator.designer)
          );
        });
        return [creator.designer, deck?.images[0]?.url ?? null];
      })
    );
  },
  [
    "curated-creator-representative-images-v2",
    ...CREATORS.flatMap((creator) => [
      creator.collectionProducer ?? creator.designer,
      ...(creator.collectionDesigners ?? []),
    ]),
  ],
  { tags: [CREATOR_CATALOG_METADATA_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

export const getArchiveSearchSeries = unstable_cache(
  async () =>
    prisma.series.findMany({
      select: { name: true, slug: true, _count: { select: { decks: true } } },
    }),
  ["archive-search-series-v1"],
  { tags: [ARCHIVE_SERIES_METADATA_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);
