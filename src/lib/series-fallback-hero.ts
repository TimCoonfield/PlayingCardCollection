export const SERIES_FALLBACK_HEROES = [
  "/series-fallbacks/archive-emblem-spade.webp",
  "/series-fallbacks/archive-emblem-heart.webp",
  "/series-fallbacks/archive-emblem-club.webp",
  "/series-fallbacks/archive-emblem-diamond.webp",
] as const;

/**
 * Gives every Series a random-looking but stable emblem. Using the immutable id
 * avoids changing the artwork between requests, deployments, or name edits.
 */
export function getSeriesFallbackHero(seriesId: string): string {
  let hash = 2_166_136_261;
  for (let index = 0; index < seriesId.length; index += 1) {
    hash ^= seriesId.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return SERIES_FALLBACK_HEROES[(hash >>> 0) % SERIES_FALLBACK_HEROES.length];
}
