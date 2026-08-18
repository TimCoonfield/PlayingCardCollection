import type { Metadata } from "next";
import { getLandingPageCatalog } from "@/lib/catalog-browse";
import { DecksLandingPage } from "@/components/decks-landing-page";

const WHITE_WHALES_HERO_IMAGE_URL = "/images/specialty/white-whales.webp";
const WHITE_WHALES_BLURB =
  "These are the decks that sit beyond ordinary rarity—the ones I may spend years watching for, the pieces whose appearance can feel almost mythical. Some were produced in vanishingly small numbers; others simply disappeared into collections and almost never return to the market. A White Whale is not necessarily the most expensive deck I own, but it is one whose scarcity, history, or personal significance makes finding it feel like a genuine event. This is where the hardest-won pieces of the collection gather.";

export const metadata: Metadata = {
  title: "White Whales",
  description: "The rarest, hardest-won decks in the Card Guy Archive collection.",
};

export default async function WhiteWhalesPage() {
  const catalog = await getLandingPageCatalog();
  const decks = catalog.decks.filter((deck) => deck.whiteWhale);

  return (
    <DecksLandingPage
      title="White Whales"
      tagline="The rarest of the rare"
      path="/white-whales"
      heroImageUrl={WHITE_WHALES_HERO_IMAGE_URL}
      heroObjectRight
      showFeaturedDecks={false}
      showFilters
      filterTagSet="all"
      blurb={WHITE_WHALES_BLURB}
      description={WHITE_WHALES_BLURB}
      decks={decks}
      emptyMessage="No White Whales have surfaced yet."
    />
  );
}
