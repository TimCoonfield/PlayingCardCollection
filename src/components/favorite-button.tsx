"use client";

import { useState, useTransition } from "react";
import { HeartIcon } from "./icons";
import { toggleFavorite } from "@/app/(app)/decks/actions";

export function FavoriteButton({
  deckId,
  initialFavorite,
}: {
  deckId: string;
  initialFavorite: boolean;
}) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setFavorite((f) => !f);
    startTransition(async () => {
      await toggleFavorite(deckId);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={favorite}
      aria-label={favorite ? "Remove from favorites" : "Mark as favorite"}
      title={favorite ? "Remove from favorites" : "Mark as favorite"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
        favorite
          ? "border-brick/60 text-brick hover:bg-brick/10"
          : "border-brass/50 text-brass hover:bg-brass/10"
      }`}
    >
      <HeartIcon filled={favorite} className="h-4 w-4" />
    </button>
  );
}
