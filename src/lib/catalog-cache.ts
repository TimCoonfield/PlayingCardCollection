import { updateTag } from "next/cache";

export const CATALOG_CACHE_REVALIDATE_SECONDS = 86_400;
export const CATALOG_CACHE_TAG = "catalog-data";

export function invalidateCatalogCaches() {
  // Authenticated Server Actions use updateTag so their redirect reads the newly written data.
  updateTag(CATALOG_CACHE_TAG);
}
