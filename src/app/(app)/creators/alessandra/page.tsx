import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { DeckCard } from "@/components/deck-card";
import { DeckSpotlightCard } from "@/components/deck-spotlight-card";

const ALESSANDRA_HERO_IMAGE_URL =
  "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/alessandra-gagliano-2uvyjYhOQt3rT21EyxThGqBvmyHM6s.webp";

export default async function AlessandraLandingPage() {
  const decks = await prisma.deck.findMany({
    where: { designer: "Alessandra Gagliano" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
  const favoriteDecks = decks.filter((d) => d.favorite);
  const restDecks = decks.filter((d) => !d.favorite);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <Image
          src={ALESSANDRA_HERO_IMAGE_URL}
          alt=""
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="pointer-events-none object-cover opacity-[0.18] lg:opacity-100"
        />
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--felt-bg) 90%, transparent) 0%, color-mix(in srgb, var(--felt-bg) 90%, transparent) 44%, transparent 58%)",
          }}
        />
        <div className="relative flex flex-col gap-3 p-6 lg:max-w-lg">
          <h1 className="font-display text-3xl font-semibold text-felt-ink sm:text-4xl">
            Alessandra Gagliano
          </h1>
          <p className="text-sm font-medium tracking-wide text-brass">The Folklorist</p>
          <p className="text-sm text-felt-sub">
            I was backer number two on Jocu’s first Kickstarter campaign, Fillide, and I haven’t looked back. Alessandra Gagliano creates wonderful artwork rooted in mythology, folklore, and the natural world—often drawing from stories obscure enough that the deck becomes an introduction to them. Her work can be beautiful and inviting at first glance, but there is always more underneath: symbolism, history, emotion, and a genuine reverence for the traditions inspiring it. That balance is what makes Jocu’s decks so appealing to me. They do not simply borrow the imagery of nature and mythology; they explore why those stories endured and find new ways to tell them through playing cards.
          </p>
        </div>
      </div>

      {decks.length === 0 ? (
        <p className="py-16 text-center text-felt-sub">No decks yet.</p>
      ) : (
        <>
          {favoriteDecks.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteDecks.map((deck) => (
                <DeckSpotlightCard key={deck.id} deck={deck} />
              ))}
            </div>
          )}
          {restDecks.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {restDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
