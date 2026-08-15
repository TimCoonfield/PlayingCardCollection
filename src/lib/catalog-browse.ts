import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CATALOG_CACHE_REVALIDATE_SECONDS, CATALOG_CACHE_TAG } from "@/lib/catalog-cache";
import { getCoreCatalogMetadata } from "@/lib/catalog-metadata";

const DECK_CACHE_PAGE_SIZE = 400;

// Vercel cache entries have a 2 MB ceiling. Paging the archive keeps each entry comfortably
// below it as notes and image URLs accumulate, while still hydrating Neon only once per write.
const getBrowseDeckPage = unstable_cache(
  async (page: number) =>
    prisma.deck.findMany({
      select: {
        id: true,
        name: true,
        series: true,
        designer: true,
        producer: true,
        qty: true,
        tags: true,
        favorite: true,
        whiteWhale: true,
        releaseYear: true,
        notes: true,
        createdAt: true,
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
          select: { url: true },
        },
      },
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: page * DECK_CACHE_PAGE_SIZE,
      take: DECK_CACHE_PAGE_SIZE,
    }),
  ["browse-deck-page-v1"],
  { tags: [CATALOG_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

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
  { tags: [CATALOG_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
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
  { tags: [CATALOG_CACHE_TAG], revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

/** Lightweight cards for the full archive: one image URL per deck. */
export async function getBrowseCatalogCards() {
  const [{ totalDecks }, coins] = await Promise.all([
    getCoreCatalogMetadata(),
    getBrowseCoins(),
  ]);
  const pageCount = Math.ceil(totalDecks / DECK_CACHE_PAGE_SIZE);
  const deckPages = await Promise.all(
    Array.from({ length: pageCount }, (_, page) => getBrowseDeckPage(page))
  );
  return { decks: deckPages.flat(), coins };
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

export async function getSeriesLandingCatalog(series: string) {
  const catalog = await getLandingPageCatalog();
  const matches = (item: { series: string | null }) => item.series === series;
  return {
    decks: catalog.decks.filter(matches),
    coins: catalog.coins.filter(matches),
  };
}
