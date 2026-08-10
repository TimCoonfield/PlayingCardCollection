"use client";

import { useRouter } from "next/navigation";

export function SurpriseMeButton({
  preferredDeckIds,
  fallbackDeckIds,
}: {
  preferredDeckIds: string[];
  fallbackDeckIds: string[];
}) {
  const router = useRouter();
  const hasDecks = fallbackDeckIds.length > 0;

  function chooseDeck() {
    const pool = preferredDeckIds.length > 0 ? preferredDeckIds : fallbackDeckIds;
    if (pool.length === 0) return;
    const deckId = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/decks/${deckId}`);
  }

  return (
    <button
      type="button"
      onClick={chooseDeck}
      disabled={!hasDecks}
      title={hasDecks ? "Open a random matching deck" : "No decks match these filters"}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-brass/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brass transition-colors hover:bg-brass/10 disabled:cursor-not-allowed disabled:border-felt-line disabled:text-felt-sub/50 disabled:hover:bg-transparent"
    >
      <span aria-hidden="true">✦</span>
      Surprise Me
    </button>
  );
}
