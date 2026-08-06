import { prisma } from "@/lib/prisma";
import { DecksLandingPage } from "@/components/decks-landing-page";

export default async function JackBrutusPennyLandingPage() {
  const decks = await prisma.deck.findMany({
    where: { designer: "Jack Brutus Penny" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
  const heroImageUrl = decks.find((deck) => deck.images.length > 0)?.images[0]?.url;

  return (
    <DecksLandingPage
      title="Jack Brutus Penny"
      tagline="Master of the Marvelously Absurd"
      heroImageUrl={heroImageUrl}
      blurb={
        <>
          Some creators make beautiful decks. Some tell compelling stories. Jack Brutus Penny
          somehow takes ideas that sound completely ridiculous on paper and transforms them into
          works of art that feel inevitable once they&apos;re in your hands. I&apos;ve been
          fortunate to support his work from the very beginning with <em>Culturae Animalis</em>,
          and every release since has only reinforced why he&apos;s one of my favorite creators.
          His decks overflow with detail, creativity, whimsy, and hidden surprises, and beyond the
          cards, Jack is one of the genuinely kind, intelligent, and creative people I&apos;ve had
          the pleasure of calling a friend.
        </>
      }
      decks={decks}
      emptyMessage="No Jack Brutus Penny decks yet."
    />
  );
}
