import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { CATALOG_CACHE_REVALIDATE_SECONDS } from "@/lib/catalog-cache";
import type { EraValue } from "@/lib/era";

/**
 * All normalized deck tags, for rendering the checkbox list on the deck form. Adding a new tag is
 * just an INSERT into the Tag table — no code or schema change needed here. This is a tiny,
 * rarely-changing table with no app-level mutation path yet, so it's cached generously with no
 * explicit invalidation wiring; add one if/when a tag-management UI is built.
 */
export const getAllTags = unstable_cache(
  () => prisma.tag.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ["all-tags-v1"],
  { revalidate: CATALOG_CACHE_REVALIDATE_SECONDS }
);

/**
 * Merges the normalized tag names with the computed era value, producing the same flat
 * `tags: string[]` shape every display/filter component already expects (chips, placeholder art,
 * the stats era chart's underlying tag-precedence rules, tag filters). Keeps era looking like
 * "just another tag" to every reader even though it's no longer stored — see src/lib/era.ts.
 */
export function flattenDeckTags(
  tags: { tag: { name: string } }[],
  era: EraValue | null
): string[] {
  const names = tags.map(({ tag }) => tag.name);
  return era ? [...names, era] : names;
}
