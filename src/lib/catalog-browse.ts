import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  CATALOG_CACHE_REVALIDATE_SECONDS,
  COIN_BROWSE_CACHE_TAG,
  DECK_BROWSE_CACHE_PAGE_SIZE,
  DECK_BROWSE_CACHE_TAG,
  FAVORITE_DECK_IMAGES_CACHE_TAG,
  RECENT_DECKS_CACHE_TAG,
  SERIES_SPOTLIGHT_CACHE_TAG,
  deckBrowsePageCacheTag,
} from "@/lib/catalog-cache";
import { getCoreCatalogMetadata } from "@/lib/catalog-metadata";

// Vercel cache entries have a 2 MB ceiling. Paging the archive keeps each entry comfortably
// below it as notes and image URLs accumulate, while still hydrating Neon only once per write.
function getBrowseDeckPage(page: number) {
  return unstable_cache(
    async () => {
      const rows = await prisma.deck.findMany({
        select: {
          id: true,
          name: true,
          seriesRaw: true,
          seriesLegacy: true,
          series: { select: { name: true, slug: true } },
          designer: true,
          producer: true,
          qty: true,
          tags: true,
          favorite: true,
          whiteWhale: true,
          releaseYear: true,
          collectionReasonPrimary: true,
          collectionReasonSecondary: true,
          notes: true,
          createdAt: true,
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { url: true },
          },
        },
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: page * DECK_BROWSE_CACHE_PAGE_SIZE,
        take: DECK_BROWSE_CACHE_PAGE_SIZE,
      });
      return rows.map(({ series, seriesRaw, seriesLegacy, ...deck }) => ({
        ...deck,
        series: series?.name ?? seriesRaw?.trim() ?? seriesLegacy?.trim() ?? null,
        seriesSlug: series?.slug ?? null,
        seriesRaw,
      }));
    },
    ["browse-deck-page-v4", String(page)],
    {
      tags: [DECK_BROWSE_CACHE_TAG, deckBrowsePageCacheTag(page)],
      revalidate: CATALOG_CACHE_REVALIDATE_SECONDS,
    }
  )();
}

const getBrowseCoins = unstable_cache(
  async () =>
    prisma.coin.findMany({
      select: {
        id: true,
        name: true,
        series: true,
        designer: true,
        producer: true,
        qty: true,
        tags: true,
        obverseImageUrl: true,
        reverseImageUrl: true,
        releaseYear: true,
        notes: true,
        createdAt: true,
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    }),
  ["browse-coins-v1"],
  { tags: [COIN_BROWSE_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

const getFavoriteDeckImages = unstable_cache(
  async () =>
    prisma.deck.findMany({
      where: { favorite: true },
      select: {
        id: true,
        images: {
          orderBy: { sortOrder: "asc" },
          select: { url: true },
        },
      },
    }),
  ["favorite-deck-images-v1"],
  { tags: [FAVORITE_DECK_IMAGES_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

export const getRecentDecks = unstable_cache(
  async () =>
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
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    }),
  ["recent-decks-v1"],
  { tags: [RECENT_DECKS_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

const getSeriesSpotlightRows = unstable_cache(
  async (seriesIds: string[]) =>
    prisma.deck.findMany({
      where: { seriesId: { in: seriesIds } },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      select: {
        id: true,
        name: true,
        seriesId: true,
        tags: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
      },
    }),
  ["series-spotlight-rows-v1"],
  { tags: [SERIES_SPOTLIGHT_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

export async function getSeriesSpotlightDecks(seriesIds: string[]) {
  const rows = await getSeriesSpotlightRows(seriesIds);
  return new Map(
    seriesIds.map((seriesId) => {
      const decks = rows.filter((deck) => deck.seriesId === seriesId);
      return [seriesId, decks.find((deck) => deck.images.length > 0) ?? decks[0] ?? null];
    })
  );
}

/** Lightweight deck cards for the full archive: one image URL per deck. */
export async function getBrowseDeckCards() {
  const { totalDecks } = await getCoreCatalogMetadata();
  const pageCount = Math.ceil(totalDecks / DECK_BROWSE_CACHE_PAGE_SIZE);
  const deckPages = await Promise.all(
    Array.from({ length: pageCount }, (_, page) => getBrowseDeckPage(page))
  );
  return deckPages.flat();
}

/** Lightweight cards for the full archive: one image URL per deck. */
export async function getBrowseCatalogCards() {
  const [decks, coins] = await Promise.all([getBrowseDeckCards(), getBrowseCoins()]);
  return { decks, coins };
}

/** Admin maintenance totals derived from the same deck snapshot used by /collection. */
export async function getDeckWorkCounts() {
  const decks = await getBrowseDeckCards();
  const decksWithPhoto = decks.filter((deck) => deck.images.length > 0).length;

  return {
    missingPhotoCount: decks.length - decksWithPhoto,
    missingYearCount: decks.filter((deck) => deck.releaseYear === null).length,
    photoCompletionPercent: decks.length > 0
      ? Math.round((decksWithPhoto / decks.length) * 100)
      : 0,
  };
}

/**
 * Landing pages need every image for their favorite-deck mosaics. Keep those uncommon extra
 * URLs separate so ordinary collection browsing does not repeatedly transfer them from Neon.
 */
export async function getLandingPageCatalog() {
  const [catalog, favoriteImages] = await Promise.all([
    getBrowseCatalogCards(),
    getFavoriteDeckImages(),
  ]);
  const favoriteImagesById = new Map(favoriteImages.map((deck) => [deck.id, deck.images]));

  return {
    decks: catalog.decks.map((deck) => ({
      ...deck,
      images: favoriteImagesById.get(deck.id) ?? deck.images,
    })),
    coins: catalog.coins,
  };
}

export async function getCreatorLandingCatalog(name: string, matchProducerToo = false) {
  const catalog = await getLandingPageCatalog();
  const matches = (item: { designer: string | null; producer: string | null }) =>
    item.designer === name || (matchProducerToo && item.producer === name);
  return {
    decks: catalog.decks.filter(matches),
    coins: catalog.coins.filter(matches),
  };
}

export async function getProducerOrDesignerLandingCatalog(
  producer: string,
  designers: string[]
) {
  const catalog = await getLandingPageCatalog();
  const matches = (item: { designer: string | null; producer: string | null }) =>
    item.producer === producer ||
    (item.designer !== null && designers.includes(item.designer));
  return {
    decks: catalog.decks.filter(matches),
    coins: catalog.coins.filter(matches),
  };
}

export async function getTaggedLandingCatalog(tag: string) {
  const catalog = await getLandingPageCatalog();
  const matches = (item: { tags: string[] }) => item.tags.includes(tag);
  return {
    decks: catalog.decks.filter(matches),
    coins: catalog.coins.filter(matches),
  };
}

export async function getSeriesLandingCatalog(slug: string, legacyCoinSeries?: string) {
  const catalog = await getLandingPageCatalog();
  return {
    decks: catalog.decks.filter((deck) => deck.seriesSlug === slug),
    coins: legacyCoinSeries
      ? catalog.coins.filter((coin) => coin.series === legacyCoinSeries)
      : [],
  };
}
