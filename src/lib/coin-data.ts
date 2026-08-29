import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CATALOG_CACHE_REVALIDATE_SECONDS,
  COIN_DETAILS_CACHE_TAG,
  coinDetailCacheTag,
} from "@/lib/catalog-cache";

const getCachedCoinPageData = (id: string) =>
  unstable_cache(
    () =>
      prisma.coin.findUnique({
        where: { id },
        include: {
          designerCreator: { select: { name: true, slug: true } },
          producerCreator: { select: { name: true, slug: true } },
        },
      }),
    ["coin-page-v1", id],
    {
      tags: [COIN_DETAILS_CACHE_TAG, coinDetailCacheTag(id)],
      revalidate: CATALOG_CACHE_REVALIDATE_SECONDS,
    }
  )();

export const getCoinPageData = cache(async (id: string) => {
  const coin = await getCachedCoinPageData(id);
  if (!coin) return null;

  // Keep cache hits type-equivalent to direct Prisma results.
  return {
    ...coin,
    createdAt: new Date(coin.createdAt),
    updatedAt: new Date(coin.updatedAt),
  };
});
