import { prisma } from "@/lib/prisma";
import { DecksLandingPage } from "@/components/decks-landing-page";

const ALESSANDRA_HERO_IMAGE_URL =
  "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/alessandra-gagliano-2uvyjYhOQt3rT21EyxThGqBvmyHM6s.webp";

export default async function AlessandraLandingPage() {
  const decks = await prisma.deck.findMany({
    where: { designer: "Alessandra Gagliano" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <DecksLandingPage
      title="Alessandra Gagliano"
      tagline="The Folklorist"
      heroImageUrl={ALESSANDRA_HERO_IMAGE_URL}
      blurb="I was backer number two on Jocu’s first Kickstarter campaign, Fillide, and I haven’t looked back. Alessandra Gagliano creates wonderful artwork rooted in mythology, folklore, and the natural world—often drawing from stories obscure enough that the deck becomes an introduction to them. Her work can be beautiful and inviting at first glance, but there is always more underneath: symbolism, history, emotion, and a genuine reverence for the traditions inspiring it. That balance is what makes Jocu’s decks so appealing to me. They do not simply borrow the imagery of nature and mythology; they explore why those stories endured and find new ways to tell them through playing cards."
      decks={decks}
    />
  );
}
