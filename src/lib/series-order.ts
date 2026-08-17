export interface SeriesOrderedDeck {
  id: string;
  name: string;
  seriesOrder: number | null;
  releaseYear: number | null;
}

export function compareSeriesDecks(a: SeriesOrderedDeck, b: SeriesOrderedDeck): number {
  if (a.seriesOrder !== null || b.seriesOrder !== null) {
    if (a.seriesOrder === null) return 1;
    if (b.seriesOrder === null) return -1;
    if (a.seriesOrder !== b.seriesOrder) return a.seriesOrder - b.seriesOrder;
  }

  if (a.releaseYear !== null || b.releaseYear !== null) {
    if (a.releaseYear === null) return 1;
    if (b.releaseYear === null) return -1;
    if (a.releaseYear !== b.releaseYear) return a.releaseYear - b.releaseYear;
  }

  const byName = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  return byName || a.id.localeCompare(b.id);
}

export function sortSeriesDecks<T extends SeriesOrderedDeck>(decks: T[]): T[] {
  return [...decks].sort(compareSeriesDecks);
}
