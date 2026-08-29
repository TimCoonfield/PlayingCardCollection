import { unstable_cache } from "next/cache";
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
      prisma.creator.count({
        where: { OR: [{ decksDesigned: { some: {} } }, { coinsDesigned: { some: {} } }] },
      }),
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
      prisma.creator.findMany({
        where: { decksDesigned: { some: {} } },
        select: { name: true },
      }),
      prisma.creator.findMany({
        where: { coinsDesigned: { some: {} } },
        select: { name: true },
      }),
      prisma.creator.findMany({
        where: { decksProduced: { some: {} } },
        select: { name: true },
      }),
      prisma.creator.findMany({
        where: { coinsProduced: { some: {} } },
        select: { name: true },
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
          ...coinDesigners.map(({ name }) => name),
        ])
      ).sort(),
      producers: Array.from(
        new Set([
          ...deckProducers.map(({ name }) => name),
          ...coinProducers.map(({ name }) => name),
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
      prisma.creator.findMany({
        where: { decksDesigned: { some: {} } },
        select: { name: true, _count: { select: { decksDesigned: true } } },
        orderBy: { decksDesigned: { _count: "desc" } },
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
        _count: { _all: _count.decksDesigned },
      })),
      topSeriesGroups,
      releaseYearGroups,
    };
  },
  ["stats-chart-metadata-v3"],
  { tags: [STATS_CATALOG_METADATA_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

export const getCreatorDirectory = unstable_cache(
  async () => {
    const creators = await prisma.creator.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
        slug: true,
        tagline: true,
        heroImageUrl: true,
        favorite: true,
        decksDesigned: { select: { deckId: true } },
        decksProduced: { select: { id: true } },
        coinsDesigned: { select: { id: true } },
        coinsProduced: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    });
    return creators.map(({ decksDesigned, decksProduced, coinsDesigned, coinsProduced, ...creator }) => {
      const deckIds = new Set([
        ...decksDesigned.map(({ deckId }) => deckId),
        ...decksProduced.map(({ id }) => id),
      ]);
      const coinIds = new Set([
        ...coinsDesigned.map(({ id }) => id),
        ...coinsProduced.map(({ id }) => id),
      ]);
      const hasDesignerRole = decksDesigned.length > 0 || coinsDesigned.length > 0;
      const hasProducerRole = decksProduced.length > 0 || coinsProduced.length > 0;
      return {
        ...creator,
        deckCount: deckIds.size,
        coinCount: coinIds.size,
        role: hasDesignerRole && hasProducerRole
          ? "Designer & Producer" as const
          : hasDesignerRole
            ? "Designer" as const
            : hasProducerRole
              ? "Producer" as const
              : "Uncredited" as const,
      };
    });
  },
  ["creator-directory-v1"],
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
