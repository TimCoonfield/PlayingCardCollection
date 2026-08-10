"use client";

import { useState, useTransition } from "react";
import { toggleWhiteWhale } from "@/app/(app)/decks/actions";

export function WhiteWhaleButton({
  deckId,
  initialWhiteWhale,
}: {
  deckId: string;
  initialWhiteWhale: boolean;
}) {
  const [whiteWhale, setWhiteWhale] = useState(initialWhiteWhale);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setWhiteWhale((value) => !value);
    startTransition(async () => {
      await toggleWhiteWhale(deckId);
    });
  }

  const label = whiteWhale ? "Remove White Whale designation" : "Mark as a White Whale";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={whiteWhale}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full border text-base transition-colors disabled:opacity-60 ${
        whiteWhale
          ? "border-sage/70 bg-sage/10 hover:bg-sage/20"
          : "border-brass/50 grayscale hover:bg-brass/10 hover:grayscale-0"
      }`}
    >
      <span aria-hidden="true">🐋</span>
    </button>
  );
}
