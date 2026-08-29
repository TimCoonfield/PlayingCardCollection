import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CATALOG_CACHE_REVALIDATE_SECONDS,
  PUBLIC_DECK_DETAILS_CACHE_TAG,
  publicDeckDetailCacheTag,
} from "@/lib/catalog-cache";

export const getDeckPageData = cache((id: string) =>
  unstable_cache(
    () =>
      prisma.deck.findUnique({
        where: { id },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          editions: { orderBy: { deckNumber: "asc" } },
          designers: {
            orderBy: { sortOrder: "asc" },
            select: { designer: { select: { name: true, slug: true } } },
          },
          producerCreator: { select: { name: true, slug: true } },
          series: {
            select: {
              id: true,
              name: true,
              slug: true,
              subtitle: true,
            },
          },
        },
      }),
    ["deck-page-v1", id],
    {
      tags: [PUBLIC_DECK_DETAILS_CACHE_TAG, publicDeckDetailCacheTag(id)],
      revalidate: CATALOG_CACHE_REVALIDATE_SECONDS,
    }
  )()
);
