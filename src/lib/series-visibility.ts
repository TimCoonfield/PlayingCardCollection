export const MIN_DECKS_FOR_SERIES_PAGE = 2;

export function hasSeriesPage(deckCount: number) {
  return deckCount >= MIN_DECKS_FOR_SERIES_PAGE;
}
