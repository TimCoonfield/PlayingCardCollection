import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CATALOG_CACHE_REVALIDATE_SECONDS,
  CREATOR_CATALOG_METADATA_CACHE_TAG,
} from "@/lib/catalog-cache";

export const getCreatorPageData = cache((slug: string) =>
  unstable_cache(
    () =>
      prisma.creator.findUnique({
        where: { slug },
        select: {
          id: true,
          name: true,
          displayName: true,
          slug: true,
          tagline: true,
          description: true,
          heroImageUrl: true,
          favorite: true,
          updatedAt: true,
        },
      }),
    ["creator-page-v1", slug],
    {
      tags: [CREATOR_CATALOG_METADATA_CACHE_TAG],
      revalidate: CATALOG_CACHE_REVALIDATE_SECONDS,
    }
  )()
);
