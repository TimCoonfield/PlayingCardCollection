import type { Metadata } from "next";
import { getCreatorLandingCatalog } from "@/lib/catalog-browse";
import { DecksLandingPage } from "@/components/decks-landing-page";

const GIOVANNI_HERO_IMAGE_URL =
  "/images/creators/giovanni-meroni.webp";
const GIOVANNI_BLURB =
  "Giovanni Meroni is another of my absolute favorite creators, largely because of the depth of the stories he builds behind his decks. My first was Dedalo, which arrived almost accidentally as a single deck in an eBay lot. Its interpretation of the Minotaur, the Labyrinth, and the larger mythology surrounding them drew me in immediately. Since then, I’ve had the privilege of speaking with Giovanni several times, and his excitement when explaining the characters, symbolism, and hidden lore behind his work is infectious. The artwork is striking on its own, but understanding how thoughtfully every detail fits into the story makes the decks far more rewarding. Giovanni creates designs that invite you to keep looking, reading, and discovering.";

export const metadata: Metadata = {
  title: "Giovanni Meroni",
  description: "Decks by Giovanni Meroni (Thirdway Industries) in the Card Guy Archive collection.",
};

export default async function GiovanniLandingPage() {
  const { decks, coins } = await getCreatorLandingCatalog("Giovanni Meroni");

  return (
    <DecksLandingPage
      title="Giovanni Meroni"
      tagline="The Mythmaker"
      path="/creators/giovanni"
      heroImageUrl={GIOVANNI_HERO_IMAGE_URL}
      blurb={GIOVANNI_BLURB}
      description={GIOVANNI_BLURB}
      decks={decks}
      coins={coins}
      showFilters
    />
  );
}
