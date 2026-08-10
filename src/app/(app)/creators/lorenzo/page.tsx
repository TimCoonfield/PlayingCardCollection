import { prisma } from "@/lib/prisma";
import { DecksLandingPage } from "@/components/decks-landing-page";

const LORENZO_HERO_IMAGE_URL =
  "/images/creators/lorenzo-gaggiotti-hero.webp";

export default async function LorenzoLandingPage() {
  const decks = await prisma.deck.findMany({
    where: { OR: [{ designer: "Lorenzo Gaggiotti" }, { producer: "Lorenzo Gaggiotti" }] },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <DecksLandingPage
      title="Lorenzo Gaggiotti"
      tagline="The Architect"
      heroImageUrl={LORENZO_HERO_IMAGE_URL}
      blurb="Lorenzo Gaggiotti may or may not be my single favorite playing card creator—there are too many artists whose work I love to make that an easy call. But he is probably the clearest archetype of what I want a creator in my collection to be. The House of the Rising Spade was my first deck of his, and it immediately showed me the full package: impeccable artwork, rich storytelling, and phenomenal execution. Lorenzo does not simply design cards; he builds complete worlds around them, with their own characters, symbols, histories, and artifacts. The artistry is second to none, but it is the way every element supports the larger vision that makes his work feel so complete."
      decks={decks}
    />
  );
}
