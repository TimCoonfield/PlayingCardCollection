export type CreatorAccent = "plum" | "brass" | "sage" | "brick" | "felt-ink";

export const JACK_BRUTUS_PENNY_IMAGE_URL =
  "/images/creators/jack-brutus-penny.webp";

export interface CreatorProfile {
  /** Presentation-only title. `designer` remains the exact database attribution key. */
  displayName?: string;
  designer: string;
  producer: string;
  bio: string;
  accent: CreatorAccent;
  initials: string;
  /** Real brand logo (or other representative image), stored as a static asset. Falls back to a
   * monogram when absent. Not used by the current poster-style homepage card, but kept for
   * the commented-out CreatorCard fallback in page.tsx. */
  logoUrl?: string;
  /** Alt text for logoUrl. Defaults to "{producer} logo" when omitted. */
  logoAlt?: string;
  /** Short epithet shown under the name on the homepage spotlight card, e.g. "The Painter". */
  tagline: string;
  /** Wide/portrait image used as the full-bleed watermark background on creator cards.
   * Fixed artwork can be a compressed static asset; the directory falls back to collection
   * artwork when absent. */
  spotlightImageUrl?: string;
  /** Alt text for spotlightImageUrl. */
  spotlightImageAlt?: string;
  /** When true, "their decks" also includes decks where they're only credited as producer
   * (not designer) — e.g. decks they produced but someone else drew. Changes the "View all"
   * link from ?designer= to the OR-matching ?creator= filter. */
  matchProducerToo?: boolean;
  /** Use exact producer/designer credits as this profile's inclusive collection scope. */
  collectionProducer?: string;
  collectionDesigners?: string[];
  landingPageHref: string;
  featuredOnHomepage: boolean;
  featuredInNavigation: boolean;
}

// Hand-curated, not derived from collection stats. Every entry appears in the full creator
// directory; the two feature flags reserve homepage and navigation space for a smaller selection.
// Bios are a starting point sourced from public interviews/brand pages and meant to be refined.
export const CREATORS: CreatorProfile[] = [
  {
    designer: "Giovanni Meroni",
    landingPageHref: "/creators/giovanni",
    featuredOnHomepage: true,
    featuredInNavigation: true,
    producer: "Thirdway Industries",
    bio: "Giovanni Meroni is a freelance designer and art director from Italy who founded Thirdway Industries in 2014, weaving ancient myths and Mediterranean-inspired artwork into decks like Good & Evil and SINS. His work is known for a distinctive classical, literary feel that sets it apart from typical playing card designs.",
    accent: "brick",
    initials: "GM",
    logoUrl: "/images/creators/thirdway-industries-logo.webp",
    tagline: "The Mythmaker",
    spotlightImageUrl:
      "/images/creators/giovanni-meroni.webp",
    spotlightImageAlt: "Illustrated card design by Giovanni Meroni",
  },
  {
    designer: "Lorenzo Gaggiotti",
    landingPageHref: "/creators/lorenzo",
    featuredOnHomepage: true,
    featuredInNavigation: true,
    producer: "Stockholm17",
    bio: "Lorenzo Gaggiotti is an Italian-born designer now based in Stockholm, who launched Stockholm17 in 2012 with his first crowdfunded deck. His mythology- and sacred-geometry-inspired work has earned him 52 Plus Joker's Artist of the Year four times (2019, 2022–2024) and multiple Deck of the Year awards.",
    accent: "brass",
    initials: "LG",
    logoUrl: "/images/creators/stockholm17-logo.webp",
    tagline: "The Architect",
    spotlightImageUrl:
      "/images/creators/lorenzo-gaggiotti-card.webp",
    spotlightImageAlt: "Hand-drawn map aces from a Lorenzo Gaggiotti deck",
  },
  {
    designer: "Linnea Gits",
    displayName: "Linnea Gits & Peter Dunham",
    landingPageHref: "/creators/linnea",
    featuredOnHomepage: true,
    featuredInNavigation: true,
    producer: "Uusi",
    collectionProducer: "Uusi",
    collectionDesigners: ["Linnea Gits", "Peter Dunham"],
    bio: "Linnea Gits co-founded the design studio Uusi with Peter Dunham in 2010, hand-painting original artwork in oils and watercolors for decks like Blue Blood, Pagan, and Republic. The duo has funded 13 tarot and playing card projects on Kickstarter and collaborated with brands like Herman Miller and Taschen.",
    accent: "felt-ink",
    initials: "LG",
    logoUrl: "/images/creators/uusi-logo.webp",
    tagline: "The Painter",
    spotlightImageUrl:
      "/images/creators/linnea-gits.webp",
    spotlightImageAlt: "Linnea Gits hand-painting a deck",
  },
  {
    designer: "Alessandra Gagliano",
    displayName: "Alessandra Gagliano & Anthony Holt",
    landingPageHref: "/creators/alessandra",
    featuredOnHomepage: true,
    featuredInNavigation: true,
    producer: "Jocu",
    bio: "I was backer #2 on Jocu's very first Kickstarter, Fillide, and I've been along for the ride ever since. Alessandra's work has a warmth and humanity to it that I find incredibly distinctive—beautifully illustrated decks steeped in folklore, nature, history and a wonderful sense of place. But Jocu has always been a partnership. Her partner Anthony Holt works alongside her on nearly everything beyond the artwork itself, helping turn those ideas and illustrations into the thoughtful, beautifully produced decks that eventually land in our hands. Together they've built something that feels unmistakably their own, and it's been a genuine pleasure watching that body of work grow from the very beginning.",
    accent: "sage",
    initials: "AG",
    logoUrl: "/images/creators/jocu-logo.webp",
    tagline: "The Folklorist",
    spotlightImageUrl:
      "/images/creators/alessandra-gagliano.webp",
    spotlightImageAlt: "The Green Man deck box and ace by Alessandra Gagliano",
  },
  {
    designer: "Elettra Deganello",
    landingPageHref: "/creators/elettra",
    featuredOnHomepage: true,
    featuredInNavigation: true,
    producer: "Elettra Deganello",
    bio: "Elettra Deganello is an illustrator and designer based in Prato, Italy, who entered the custom playing card world in 2017 with Pinocchio and Florentia for Passione Playing Cards. She was nominated for 52 Plus Joker's Artist of the Year in the 2021 Diamond Awards and later designed the typography-driven Bicycle Bold Slab deck.",
    accent: "plum",
    initials: "ED",
    logoUrl: "/images/creators/elettra-deganello-logo.webp",
    tagline: "The Interpreter",
    spotlightImageUrl:
      "/images/creators/elettra-deganello.webp",
    spotlightImageAlt: "Pinocchio Vermilion deck box by Elettra Deganello",
  },
  {
    designer: "Karl Gerich",
    landingPageHref: "/creators/karl",
    featuredOnHomepage: true,
    featuredInNavigation: true,
    producer: "Karl Gerich",
    bio: "Karl Alexander Gerich (1956–2016) hand-etched and hand-coloured playing cards from his studio in Bath, England, producing 37 numbered designs between 1980 and 1998 on his own printing press — he even made the boxes himself. His partner Georgina Harvey drew several of the decks he produced, working together as the Victoria Playing Card Co.",
    accent: "brick",
    initials: "KG",
    logoUrl: "/images/creators/karl-gerich-joker.webp",
    logoAlt: "Joker card self-portrait by Karl Gerich",
    tagline: "The Craftsman",
    spotlightImageUrl: "/images/creators/karl-gerich-joker.webp",
    spotlightImageAlt: "Joker card self-portrait by Karl Gerich",
    matchProducerToo: true,
  },
  {
    designer: "Jack Brutus Penny",
    landingPageHref: "/creators/jack",
    featuredOnHomepage: false,
    featuredInNavigation: false,
    producer: "Jack Brutus Penny",
    bio: "Jack Brutus Penny transforms marvelously absurd ideas into intricate, story-rich works of art filled with detail, whimsy, and hidden surprises.",
    accent: "plum",
    initials: "JBP",
    tagline: "Master of the Marvelously Absurd",
    spotlightImageUrl: JACK_BRUTUS_PENNY_IMAGE_URL,
    spotlightImageAlt: "Gold-foiled Culturae Animalis deck boxes with Jack Brutus Penny's logo",
  },
  {
    designer: "Steve Minty",
    landingPageHref: "/creators/steve-minty",
    featuredOnHomepage: false,
    featuredInNavigation: false,
    producer: "Steve Minty",
    bio: "Steve Minty reimagines well-known mythologies and cultural traditions through story-rich illustration, vibrant color, and unmistakably lavish production. His Signature Series pushes deck presentation into sculpture, with extravagant cases designed to be impossible to ignore.",
    accent: "brass",
    initials: "SM",
    tagline: "The Gilded Storyteller",
  },
];

export const HOMEPAGE_CREATORS = CREATORS.filter((creator) => creator.featuredOnHomepage);
export const NAVIGATION_CREATORS = CREATORS.filter((creator) => creator.featuredInNavigation);
