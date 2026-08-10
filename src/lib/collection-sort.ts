export const COLLECTION_SORT_VALUES = [
  "featured",
  "alpha-asc",
  "alpha-desc",
  "year-asc",
  "year-desc",
  "recent",
  "random",
] as const;

export type CollectionSort = (typeof COLLECTION_SORT_VALUES)[number];

export function isCollectionSort(value: string): value is CollectionSort {
  return COLLECTION_SORT_VALUES.includes(value as CollectionSort);
}

type SortableCollectionItem = {
  id: string;
  name: string;
  releaseYear: number | null;
  createdAt: Date | string;
  favorite?: boolean;
};

export function sortCollectionItems<T extends SortableCollectionItem>(
  items: T[],
  sort: CollectionSort,
  randomSeed = 0
): T[] {
  if (sort === "random") return seededShuffle(items, randomSeed);

  return [...items].sort((a, b) => {
    if (sort === "featured" && Boolean(a.favorite) !== Boolean(b.favorite)) {
      return a.favorite ? -1 : 1;
    }
    if (sort === "year-asc" || sort === "year-desc") {
      if (a.releaseYear === null && b.releaseYear !== null) return 1;
      if (a.releaseYear !== null && b.releaseYear === null) return -1;
      if (a.releaseYear !== null && b.releaseYear !== null && a.releaseYear !== b.releaseYear) {
        return sort === "year-asc"
          ? a.releaseYear - b.releaseYear
          : b.releaseYear - a.releaseYear;
      }
    }
    if (sort === "recent") {
      const createdDifference =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (createdDifference !== 0) return createdDifference;
    }
    const alphabetical = a.name.localeCompare(b.name);
    return sort === "alpha-desc" ? -alphabetical : alphabetical;
  });
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  const shuffled = [...items];
  let state = seed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}
