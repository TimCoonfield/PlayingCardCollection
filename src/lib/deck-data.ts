import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CATALOG_CACHE_REVALIDATE_SECONDS,
  PUBLIC_DECK_DETAILS_CACHE_TAG,
  publicDeckDetailCacheTag,
} from "@/lib/catalog-cache";

const getCachedDeckPageData = (id: string) =>
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
  )();

export const getDeckPageData = cache(async (id: string) => {
  const deck = await getCachedDeckPageData(id);
  if (!deck) return null;

  // The persistent cache serializes Prisma Date values. Restore them at the data boundary so
  // callers receive the same shape on both cache misses and cache hits.
  return {
    ...deck,
    createdAt: new Date(deck.createdAt),
    updatedAt: new Date(deck.updatedAt),
    notesReviewedAt: deck.notesReviewedAt ? new Date(deck.notesReviewedAt) : null,
    images: deck.images.map((image) => ({
      ...image,
      createdAt: new Date(image.createdAt),
    })),
    editions: deck.editions.map((edition) => ({
      ...edition,
      createdAt: new Date(edition.createdAt),
    })),
  };
});
