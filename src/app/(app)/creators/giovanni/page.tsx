import { getCreatorLandingCatalog } from "@/lib/catalog-browse";
import { DecksLandingPage } from "@/components/decks-landing-page";

const GIOVANNI_HERO_IMAGE_URL =
  "/images/creators/giovanni-meroni.webp";

export default async function GiovanniLandingPage() {
  const { decks, coins } = await getCreatorLandingCatalog("Giovanni Meroni");

  return (
    <DecksLandingPage
      title="Giovanni Meroni"
      tagline="The Mythmaker"
      heroImageUrl={GIOVANNI_HERO_IMAGE_URL}
      blurb="Giovanni Meroni is another of my absolute favorite creators, largely because of the depth of the stories he builds behind his decks. My first was Dedalo, which arrived almost accidentally as a single deck in an eBay lot. Its interpretation of the Minotaur, the Labyrinth, and the larger mythology surrounding them drew me in immediately. Since then, I’ve had the privilege of speaking with Giovanni several times, and his excitement when explaining the characters, symbolism, and hidden lore behind his work is infectious. The artwork is striking on its own, but understanding how thoughtfully every detail fits into the story makes the decks far more rewarding. Giovanni creates designs that invite you to keep looking, reading, and discovering."
      decks={decks}
      coins={coins}
      showFilters
    />
  );
}
