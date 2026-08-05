import { prisma } from "@/lib/prisma";
import { DecksLandingPage } from "@/components/decks-landing-page";

const LINNEA_HERO_IMAGE_URL =
  "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/linnea-gits-n1daqfnRv94mpDmbyuUdU4Ix6pRg5x.webp";

export default async function LinneaLandingPage() {
  const decks = await prisma.deck.findMany({
    where: { designer: "Linnea Gits" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <DecksLandingPage
      title="Linnea Gits"
      tagline="The Painter"
      heroImageUrl={LINNEA_HERO_IMAGE_URL}
      blurb="Linnea Gits may be the finest pure artist working in playing cards. Her painting is on another level, and I’m not sure anyone else in the industry can truly match it. But the appeal of Uusi goes beyond technical skill. Linnea and Peter Dunham take a deeply considered, emotional approach to every project, whether they are creating a tarot or a traditional playing-card deck. The imagery feels lived-in and human, with texture and imperfections that could never be replicated by work that was merely polished. Pagan was my first deck of theirs, given to me as a gift, and I’ve been in love with their work ever since. Their decks feel less like products than complete artistic statements."
      decks={decks}
    />
  );
}
