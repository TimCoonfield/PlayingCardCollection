import { prisma } from "@/lib/prisma";
import { DecksLandingPage } from "@/components/decks-landing-page";

const WHITE_WHALES_HERO_IMAGE_URL = "/images/specialty/white-whales.webp";

export default async function WhiteWhalesPage() {
  const decks = await prisma.deck.findMany({
    where: { whiteWhale: true },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <DecksLandingPage
      title="White Whales"
      tagline="The rarest of the rare"
      heroImageUrl={WHITE_WHALES_HERO_IMAGE_URL}
      heroObjectRight
      showFeaturedDecks={false}
      blurb="These are the decks that sit beyond ordinary rarity—the ones I may spend years watching for, the pieces whose appearance can feel almost mythical. Some were produced in vanishingly small numbers; others simply disappeared into collections and almost never return to the market. A White Whale is not necessarily the most expensive deck I own, but it is one whose scarcity, history, or personal significance makes finding it feel like a genuine event. This is where the hardest-won pieces of the collection gather."
      decks={decks}
      emptyMessage="No White Whales have surfaced yet."
    />
  );
}
