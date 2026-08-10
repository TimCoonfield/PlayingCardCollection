import { prisma } from "@/lib/prisma";
import { DecksLandingPage } from "@/components/decks-landing-page";

const KARL_HERO_IMAGE_URL =
  "/images/creators/karl-gerich-joker.webp";

export default async function KarlLandingPage() {
  const creatorWhere = { OR: [{ designer: "Karl Gerich" }, { producer: "Karl Gerich" }] };
  const [decks, coins] = await Promise.all([
    prisma.deck.findMany({
      where: creatorWhere,
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.coin.findMany({ where: creatorWhere, orderBy: { name: "asc" } }),
  ]);

  return (
    <DecksLandingPage
      title="Karl Gerich"
      tagline="The Craftsman"
      heroImageUrl={KARL_HERO_IMAGE_URL}
      blurb="Few creators have changed the way I understand playing cards as profoundly as Karl Gerich. I have poured more time into studying, collecting, and appreciating his work than perhaps that of any other artist. His decks are stunning, but beauty is only the beginning. Gerich understood the history and visual language of playing cards intimately, then reinterpreted them with extraordinary craftsmanship, intelligence, and imagination. Because he controlled so much of the process himself, every deck feels intensely personal—an object made by an artist rather than simply designed by one. His work rewards close study, and each new deck has expanded my appreciation for what playing cards can be. Collecting Gerich has become a collection within the collection."
      decks={decks}
      coins={coins}
      showFilters
    />
  );
}
