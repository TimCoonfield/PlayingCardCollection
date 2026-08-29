import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CATALOG_CACHE_REVALIDATE_SECONDS,
  SERIES_PAGES_CACHE_TAG,
  seriesPageCacheTag,
} from "@/lib/catalog-cache";

export const getSeriesPageData = cache((slug: string) =>
  unstable_cache(
    async () => {
      const series = await prisma.series.findUnique({
        where: { slug },
        include: {
          decks: {
            select: {
              id: true,
              name: true,
              designers: {
                orderBy: { sortOrder: "asc" },
                select: { designer: { select: { name: true } } },
              },
              producer: true,
              qty: true,
              tags: true,
              favorite: true,
              whiteWhale: true,
              releaseYear: true,
              seriesOrder: true,
              images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
            },
          },
        },
      });
      if (!series) return null;
      return {
        ...series,
        decks: series.decks.map(({ designers, ...deck }) => ({
          ...deck,
          designers: designers.map(({ designer }) => designer.name),
        })),
      };
    },
    ["series-page-v1", slug],
    {
      tags: [SERIES_PAGES_CACHE_TAG, seriesPageCacheTag(slug)],
      revalidate: CATALOG_CACHE_REVALIDATE_SECONDS,
    }
  )()
);

export const getSeriesDeckNavigation = cache((slug: string) =>
  unstable_cache(
    async () => {
      const series = await prisma.series.findUnique({
        where: { slug },
        select: {
          decks: {
            select: { id: true, name: true, seriesOrder: true, releaseYear: true },
          },
        },
      });
      return series?.decks ?? [];
    },
    ["series-deck-navigation-v1", slug],
    {
      tags: [SERIES_PAGES_CACHE_TAG, seriesPageCacheTag(slug)],
      revalidate: CATALOG_CACHE_REVALIDATE_SECONDS,
    }
  )()
);
