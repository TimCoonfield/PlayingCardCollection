"use client";

import { useRouter } from "next/navigation";

export function SurpriseMeButton({
  preferredDeckIds,
  fallbackDeckIds,
  preferredCoinIds = [],
  fallbackCoinIds = [],
  excludeDeckId,
  deckHrefSuffix = "",
}: {
  preferredDeckIds: string[];
  fallbackDeckIds: string[];
  preferredCoinIds?: string[];
  fallbackCoinIds?: string[];
  excludeDeckId?: string;
  deckHrefSuffix?: string;
}) {
  const router = useRouter();
  const hasItems =
    fallbackDeckIds.some((id) => id !== excludeDeckId) || fallbackCoinIds.length > 0;

  function chooseItem() {
    const preferred = [
      ...preferredDeckIds
        .filter((id) => id !== excludeDeckId)
        .map((id) => ({ kind: "deck" as const, id })),
      ...preferredCoinIds.map((id) => ({ kind: "coin" as const, id })),
    ];
    const fallback = [
      ...fallbackDeckIds
        .filter((id) => id !== excludeDeckId)
        .map((id) => ({ kind: "deck" as const, id })),
      ...fallbackCoinIds.map((id) => ({ kind: "coin" as const, id })),
    ];
    const pool = preferred.length > 0 ? preferred : fallback;
    if (pool.length === 0) return;
    const item = pool[Math.floor(Math.random() * pool.length)];
    router.push(
      `/${item.kind === "deck" ? "decks" : "coins"}/${item.id}${
        item.kind === "deck" ? deckHrefSuffix : ""
      }`
    );
  }

  return (
    <button
      type="button"
      onClick={chooseItem}
      disabled={!hasItems}
      title={hasItems ? "Open a random matching item" : "No items match these filters"}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-brass/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brass transition-colors hover:bg-brass/10 disabled:cursor-not-allowed disabled:border-felt-line disabled:text-felt-sub/50 disabled:hover:bg-transparent"
    >
      <span aria-hidden="true">✦</span>
      Surprise Me
    </button>
  );
}
