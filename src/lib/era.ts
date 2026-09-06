// Zero-dependency constants + pure functions for Deck era classification. Kept free of any
// import of "@/lib/prisma" so client components (deck-form.tsx) can import this safely — see the
// comment history around the old era-tags.ts for why that boundary matters.

export const ERA_VALUES = ["Modern", "Vintage", "Antique"] as const;

export type EraValue = (typeof ERA_VALUES)[number];

export function isEraValue(value: string): value is EraValue {
  return (ERA_VALUES as readonly string[]).includes(value);
}

export const ANTIQUE_MIN_AGE_YEARS = 100;
export const VINTAGE_MIN_AGE_YEARS = 25;

/**
 * Era is a code-level calculated field, not a stored classification: when a Deck has a
 * `releaseYear`, its era is always derived from age relative to the current year (>=100 years =
 * Antique, >=25 and <100 = Vintage, otherwise Modern). `manualEra` is purely a fallback for the
 * decks with no known release year — see Deck.manualEra in prisma/schema.prisma, which is
 * business-rule-nulled whenever a releaseYear is present (src/app/(app)/decks/actions.ts).
 */
export function computeEra(
  releaseYear: number | null | undefined,
  manualEra: EraValue | null | undefined,
  currentYear: number = new Date().getFullYear()
): EraValue | null {
  if (releaseYear != null) {
    const age = currentYear - releaseYear;
    if (age >= ANTIQUE_MIN_AGE_YEARS) return "Antique";
    if (age >= VINTAGE_MIN_AGE_YEARS) return "Vintage";
    return "Modern";
  }
  return manualEra ?? null;
}
