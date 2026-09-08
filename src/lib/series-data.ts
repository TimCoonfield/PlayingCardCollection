import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CATALOG_CACHE_REVALIDATE_SECONDS,
  SERIES_PAGES_CACHE_TAG,
  seriesPageCacheTag,
} from "@/lib/catalog-cache";
import { flattenDeckTags } from "@/lib/tags";
import { computeEra } from "@/lib/era";

export const getSeriesPageData = cache((slug: string) =>
  unstable_cache(
    async () => {
      const series = await prisma.series.findUnique({
        where: { slug },
        include: {
          decks: {
            select: {
              id: true,
              slug: true,
              name: true,
              designers: {
                orderBy: { sortOrder: "asc" },
                select: { designer: { select: { name: true } } },
              },
              producer: true,
              qty: true,
              tags: { select: { tag: { select: { name: true } } } },
              manualEra: true,
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
        decks: series.decks.map(({ designers, tags, manualEra, releaseYear, ...deck }) => ({
          ...deck,
          releaseYear,
          designers: designers.map(({ designer }) => designer.name),
          tags: flattenDeckTags(tags, computeEra(releaseYear, manualEra)),
        })),
      };
    },
    ["series-page-v4", slug],
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
            select: { id: true, slug: true, name: true, seriesOrder: true, releaseYear: true },
          },
        },
      });
      return series?.decks ?? [];
    },
    ["series-deck-navigation-v2", slug],
    {
      tags: [SERIES_PAGES_CACHE_TAG, seriesPageCacheTag(slug)],
      revalidate: CATALOG_CACHE_REVALIDATE_SECONDS,
    }
  )()
);
