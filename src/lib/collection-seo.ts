import type { Metadata } from "next";

type Params = Record<string, string | string[] | undefined>;

/** Pagination is indexable; intentional search/filter/sort variants are not. */
export function collectionSeo(params: Params): Metadata {
  const defaults: Record<string, string> = { type: "all", sort: "featured", scope: "all" };
  const filters = new Set([
    "q", "type", "sort", "scope", "designer", "producer", "creator", "series", "tag",
    "reason", "reasonField", "minYear", "maxYear", "randomSeed", "missingPhoto",
    "missingYear", "missingHook", "missingNote",
  ]);
  const filtered = Object.entries(params).some(([key, value]) => {
    const values = Array.isArray(value) ? value : [value];
    return filters.has(key) && values.some((v) => v?.trim() && v !== defaults[key]);
  });
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Number(rawPage || 1);
  const validPage = Number.isSafeInteger(page) && page >= 1;
  if (filtered || !validPage) {
    return { robots: { index: false, follow: true }, alternates: { canonical: null } };
  }
  return { alternates: { canonical: page === 1 ? "/collection" : `/collection?page=${page}` } };
}
