export const COLLECTION_REASON_VALUES = [
  "ARTISTRY",
  "CRAFT",
  "LORE",
  "HISTORY",
  "RARITY",
  "ACQUISITION",
  "COMPLETION",
  "VOLUME",
  "NOSTALGIA",
  "PERSONAL",
] as const;

export type CollectionReasonValue = (typeof COLLECTION_REASON_VALUES)[number];

export const COLLECTION_REASON_DETAILS: Record<
  CollectionReasonValue,
  { label: string; description: string }
> = {
  ARTISTRY: {
    label: "Artistry",
    description:
      "The illustration, graphic design, visual language, or overall aesthetic is a major reason this Deck belongs in the collection.",
  },
  CRAFT: {
    label: "Craft",
    description:
      "Physical execution matters: printing, construction, finishing, handmade work, unusual materials, tuck engineering, or production technique.",
  },
  LORE: {
    label: "Lore",
    description:
      "The concept, symbolism, narrative, world-building, thematic depth, or intellectual idea behind the Deck matters.",
  },
  HISTORY: {
    label: "History",
    description:
      "Historical, cultural, industry, playing-card, creator, or event significance matters.",
  },
  RARITY: {
    label: "Rarity",
    description:
      "Scarcity, unusual survival, limited production, prototype or proof status, or difficulty of acquisition matters.",
  },
  ACQUISITION: {
    label: "Acquisition",
    description:
      "The circumstances or story of obtaining this particular Deck are themselves meaningful.",
  },
  COMPLETION: {
    label: "Completion",
    description:
      "The Deck fills, advances, or completes a meaningful run, Series, creator body of work, historical set, or similar pursuit.",
  },
  VOLUME: {
    label: "Volume",
    description:
      "The Deck reflects a period of broad, less discriminating collecting within a category, creator, campaign ecosystem, or similar area—not merely that many copies exist.",
  },
  NOSTALGIA: {
    label: "Nostalgia",
    description:
      "The subject, imagery, place, brand, or cultural touchstone connects to personal history—especially childhood memories or an earlier chapter of life.",
  },
  PERSONAL: {
    label: "Personal",
    description:
      "A gift, friendship, creator relationship, milestone, formative collecting experience, or another direct personal connection matters.",
  },
};

export function isCollectionReason(value: string): value is CollectionReasonValue {
  return COLLECTION_REASON_VALUES.includes(value as CollectionReasonValue);
}
