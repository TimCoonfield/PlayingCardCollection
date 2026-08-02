"use client";

import { useState } from "react";
import Image from "next/image";
import { DeckPlaceholder, AccentBar } from "./deck-placeholder";

export function DeckGallery({
  images,
  tags,
  deckName,
}: {
  images: { url: string }[];
  tags: string[];
  deckName: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[3/4] overflow-hidden rounded-lg border border-felt-line">
        <DeckPlaceholder tags={tags} size="lg" thickAccent />
      </div>
    );
  }

  const hasMultiple = images.length > 1;
  const active = images[activeIndex];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <Image
          key={active.url}
          src={active.url}
          alt={deckName}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        <AccentBar tags={tags} thick />

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((i) => (i - 1 + images.length) % images.length)}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-felt-bg/70 text-lg text-felt-ink transition-colors hover:bg-felt-bg/90"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((i) => (i + 1) % images.length)}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-felt-bg/70 text-lg text-felt-ink transition-colors hover:bg-felt-bg/90"
            >
              ›
            </button>
            <span className="absolute right-2 top-2 rounded-full bg-felt-bg/80 px-2 py-0.5 text-xs font-medium text-felt-ink">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActiveIndex(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === activeIndex}
              className={`relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-md border transition-colors ${
                i === activeIndex ? "border-brass" : "border-felt-line hover:border-brass/50"
              }`}
            >
              <Image src={img.url} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
