/** Nullable only during the additive migration/backfill rollout. Never derive a URL from a title. */
export function deckPath(deck: { id: string; slug: string | null }) {
  return `/decks/${deck.slug ?? deck.id}`;
}
