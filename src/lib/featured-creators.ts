export type CreatorAccent = "plum" | "brass" | "sage" | "brick" | "felt-ink";

export interface FeaturedCreator {
  designer: string;
  producer: string;
  bio: string;
  accent: CreatorAccent;
  initials: string;
  /** Real brand logo (or other representative image), hosted in Blob. Falls back to a
   * monogram when absent. */
  logoUrl?: string;
  /** Alt text for logoUrl. Defaults to "{producer} logo" when omitted. */
  logoAlt?: string;
  /** When true, "their decks" also includes decks where they're only credited as producer
   * (not designer) — e.g. decks they produced but someone else drew. Changes the "View all"
   * link from ?designer= to the OR-matching ?creator= filter. */
  matchProducerToo?: boolean;
}

// Hand-picked, not derived from collection stats. Bios are a starting point sourced from
// public interviews/brand pages — meant to be refined, not treated as final copy. Add more
// entries here to feature additional creators; no admin UI needed for a curated list this size.
export const FEATURED_CREATORS: FeaturedCreator[] = [
  {
    designer: "Giovanni Meroni",
    producer: "Thirdway Industries",
    bio: "Giovanni Meroni is a freelance designer and art director from Italy who founded Thirdway Industries in 2014, weaving ancient myths and Mediterranean-inspired artwork into decks like Good & Evil and SINS. His work is known for a distinctive classical, literary feel that sets it apart from typical playing card designs.",
    accent: "brick",
    initials: "GM",
    logoUrl: "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/thirdway-industries.png",
  },
  {
    designer: "Lorenzo Gaggioti",
    producer: "Stockholm17",
    bio: "Lorenzo Gaggioti is an Italian-born designer now based in Stockholm, who launched Stockholm17 in 2012 with his first crowdfunded deck. His mythology- and sacred-geometry-inspired work has earned him 52 Plus Joker's Artist of the Year four times (2019, 2022–2024) and multiple Deck of the Year awards.",
    accent: "brass",
    initials: "LG",
    logoUrl: "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/stockholm17.png",
  },
  {
    designer: "Linnea Gits",
    producer: "Uusi",
    bio: "Linnea Gits co-founded the design studio Uusi with Peter Dunham in 2010, hand-painting original artwork in oils and watercolors for decks like Blue Blood, Pagan, and Republic. The duo has funded 13 tarot and playing card projects on Kickstarter and collaborated with brands like Herman Miller and Taschen.",
    accent: "felt-ink",
    initials: "LG",
    logoUrl: "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/uusi.png",
  },
  {
    designer: "Alessandra Gagliano",
    producer: "Jocu",
    bio: "Alessandra Gagliano is a Sicilian artist who hand-designs every Jocu deck from scratch, starting as pencil sketches or paintings before being reimagined digitally. Her work includes Fillide, inspired by Sicilian folklore, and The Green Man, exploring plant mythology.",
    accent: "sage",
    initials: "AG",
    logoUrl: "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/jocu.jpeg",
  },
  {
    designer: "Elettra Deganello",
    producer: "Elettra Deganello",
    bio: "Elettra Deganello is an illustrator and designer based in Prato, Italy, who entered the custom playing card world in 2017 with Pinocchio and Florentia for Passione Playing Cards. She was nominated for 52 Plus Joker's Artist of the Year in the 2021 Diamond Awards and later designed the typography-driven Bicycle Bold Slab deck.",
    accent: "plum",
    initials: "ED",
    logoUrl: "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/elettra-deganello.webp",
  },
  {
    designer: "Karl Gerich",
    producer: "Karl Gerich",
    bio: "Karl Alexander Gerich (1956–2016) hand-etched and hand-coloured playing cards from his studio in Bath, England, producing 37 numbered designs between 1980 and 1998 on his own printing press — he even made the boxes himself. His partner Georgina Harvey drew several of the decks he produced, working together as the Victoria Playing Card Co.",
    accent: "brick",
    initials: "KG",
    logoUrl: "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/karl-gerich-joker.jpg",
    logoAlt: "Joker card self-portrait by Karl Gerich",
    matchProducerToo: true,
  },
];
