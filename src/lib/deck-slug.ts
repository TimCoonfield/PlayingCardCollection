import { createHash } from "node:crypto";
import { seriesSlugBase } from "./series-slug";

export interface SlugDeck {
  id: string;
  name: string;
  releaseYear: number | null;
  producer: string | null;
}

export const RESERVED_DECK_SLUGS = new Set(["new", "missing-years"]);

export function deckSlugCandidates(deck: SlugDeck): string[] {
  const title = seriesSlugBase(deck.name) || "deck";
  const year = deck.releaseYear;
  const base = (year && !title.endsWith(`-${year}`) && title !== String(year)
    ? `${title}-${year}` : title).slice(0, 170).replace(/-+$/, "");
  const producer = seriesSlugBase(deck.producer ?? "").slice(0, 40).replace(/-+$/, "");
  const credited = producer ? `${base}-${producer}` : base;
  const hash = createHash("sha256").update(deck.id).digest("hex");
  return [base, credited, ...[8, 12, 16, 24].map((size) => `${credited}-${hash.slice(0, size)}`)]
    .filter((slug, index, all) => all.indexOf(slug) === index && !RESERVED_DECK_SLUGS.has(slug)
      && !/^c[a-z0-9]{24}$/.test(slug));
}
