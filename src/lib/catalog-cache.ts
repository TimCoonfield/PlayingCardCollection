import { updateTag } from "next/cache";

export const CATALOG_CACHE_REVALIDATE_SECONDS = 86_400;
export const DECK_BROWSE_CACHE_PAGE_SIZE = 400;
export const DECK_BROWSE_CACHE_TAG = "catalog-deck-browse";
export const COIN_BROWSE_CACHE_TAG = "catalog-coin-browse";
export const CORE_CATALOG_METADATA_CACHE_TAG = "catalog-metadata-core";
export const HOME_CATALOG_METADATA_CACHE_TAG = "catalog-metadata-home";
export const STATS_CATALOG_METADATA_CACHE_TAG = "catalog-metadata-stats";
export const COLLECTION_CATALOG_METADATA_CACHE_TAG = "catalog-metadata-collection";
export const CREATOR_DIRECTORY_CACHE_TAG = "catalog-creators-directory";
export const FAVORITE_CREATORS_CACHE_TAG = "catalog-creators-favorites";
export const CREATOR_PROFILES_CACHE_TAG = "catalog-creator-profiles";
export const ARCHIVE_SERIES_METADATA_CACHE_TAG = "catalog-metadata-archive-series";
export const FAVORITE_DECK_IMAGES_CACHE_TAG = "catalog-favorite-deck-images";
export const RECENT_DECKS_CACHE_TAG = "catalog-recent-decks";
export const SERIES_SPOTLIGHT_CACHE_TAG = "catalog-series-spotlights";
export const PUBLIC_DECK_DETAILS_CACHE_TAG = "catalog-public-deck-details";
export const SERIES_PAGES_CACHE_TAG = "catalog-series-pages";
export const COIN_DETAILS_CACHE_TAG = "catalog-coin-details";

export const ALL_CATALOG_CACHE_TAGS = [
  DECK_BROWSE_CACHE_TAG,
  COIN_BROWSE_CACHE_TAG,
  CORE_CATALOG_METADATA_CACHE_TAG,
  HOME_CATALOG_METADATA_CACHE_TAG,
  STATS_CATALOG_METADATA_CACHE_TAG,
  COLLECTION_CATALOG_METADATA_CACHE_TAG,
  CREATOR_DIRECTORY_CACHE_TAG,
  FAVORITE_CREATORS_CACHE_TAG,
  CREATOR_PROFILES_CACHE_TAG,
  ARCHIVE_SERIES_METADATA_CACHE_TAG,
  FAVORITE_DECK_IMAGES_CACHE_TAG,
  RECENT_DECKS_CACHE_TAG,
  SERIES_SPOTLIGHT_CACHE_TAG,
  PUBLIC_DECK_DETAILS_CACHE_TAG,
  SERIES_PAGES_CACHE_TAG,
  COIN_DETAILS_CACHE_TAG,
] as const;

export function deckBrowsePageCacheTag(page: number) {
  return `catalog-deck-browse-page-${page}`;
}

export function publicDeckDetailCacheTag(deckId: string) {
  return `catalog-public-deck-${deckId}`;
}

export function creatorProfileCacheTag(slug: string) {
  return `catalog-creator-profile-${slug}`;
}

export function seriesPageCacheTag(slug: string) {
  return `catalog-series-page-${slug}`;
}

export function coinDetailCacheTag(coinId: string) {
  return `catalog-coin-${coinId}`;
}

// These helpers are intentionally mutation-specific. updateTag gives the authenticated owner
// read-your-own-writes behavior without expiring unrelated catalog snapshots after every save.
export function invalidateAllDeckBrowsePages() {
  updateTag(DECK_BROWSE_CACHE_TAG);
}

export function invalidateDeckBrowsePage(page: number) {
  updateTag(deckBrowsePageCacheTag(page));
}

export function invalidateCoinBrowseCache() {
  updateTag(COIN_BROWSE_CACHE_TAG);
}

export function invalidateAllCatalogMetadataCaches() {
  invalidateCoreCatalogMetadataCache();
  invalidateHomeCatalogMetadataCache();
  invalidateStatsCatalogMetadataCache();
  invalidateCollectionCatalogMetadataCache();
  invalidateCreatorCatalogMetadataCache();
  invalidateArchiveSeriesMetadataCache();
}

export function invalidateCoreCatalogMetadataCache() {
  updateTag(CORE_CATALOG_METADATA_CACHE_TAG);
}

export function invalidateHomeCatalogMetadataCache() {
  updateTag(HOME_CATALOG_METADATA_CACHE_TAG);
}

export function invalidateStatsCatalogMetadataCache() {
  updateTag(STATS_CATALOG_METADATA_CACHE_TAG);
}

export function invalidateCollectionCatalogMetadataCache() {
  updateTag(COLLECTION_CATALOG_METADATA_CACHE_TAG);
}

export function invalidateCreatorCatalogMetadataCache() {
  updateTag(CREATOR_DIRECTORY_CACHE_TAG);
  updateTag(FAVORITE_CREATORS_CACHE_TAG);
}

export function invalidateCreatorProfileCache(slug: string) {
  updateTag(creatorProfileCacheTag(slug));
}

export function invalidateArchiveSeriesMetadataCache() {
  updateTag(ARCHIVE_SERIES_METADATA_CACHE_TAG);
}

export function invalidateFavoriteDeckImagesCache() {
  updateTag(FAVORITE_DECK_IMAGES_CACHE_TAG);
}

export function invalidateRecentDecksCache() {
  updateTag(RECENT_DECKS_CACHE_TAG);
}

export function invalidateSeriesSpotlightCache() {
  updateTag(SERIES_SPOTLIGHT_CACHE_TAG);
}

export function invalidatePublicDeckDetail(deckId: string) {
  updateTag(publicDeckDetailCacheTag(deckId));
}

export function invalidateAllPublicDeckDetails() {
  updateTag(PUBLIC_DECK_DETAILS_CACHE_TAG);
}

export function invalidateSeriesPageCache(slug: string) {
  updateTag(seriesPageCacheTag(slug));
}

export function invalidateCoinDetailCache(coinId: string) {
  updateTag(coinDetailCacheTag(coinId));
}

export function invalidateAllCoinDetails() {
  updateTag(COIN_DETAILS_CACHE_TAG);
}
