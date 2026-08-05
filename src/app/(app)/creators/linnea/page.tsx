import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { DeckCard } from "@/components/deck-card";
import { DeckSpotlightCard } from "@/components/deck-spotlight-card";

const LINNEA_HERO_IMAGE_URL =
  "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/linnea-gits-n1daqfnRv94mpDmbyuUdU4Ix6pRg5x.webp";

export default async function LinneaLandingPage() {
  const decks = await prisma.deck.findMany({
    where: { designer: "Linnea Gits" },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
  const favoriteDecks = decks.filter((d) => d.favorite);
  const restDecks = decks.filter((d) => !d.favorite);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <Image
          src={LINNEA_HERO_IMAGE_URL}
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
            Linnea Gits
          </h1>
          <p className="text-sm font-medium tracking-wide text-brass">The Painter</p>
          <p className="text-sm text-felt-sub">
            Linnea Gits may be the finest pure artist working in playing cards. Her painting is on another level, and I’m not sure anyone else in the industry can truly match it. But the appeal of Uusi goes beyond technical skill. Linnea and Peter Dunham take a deeply considered, emotional approach to every project, whether they are creating a tarot or a traditional playing-card deck. The imagery feels lived-in and human, with texture and imperfections that could never be replicated by work that was merely polished. Pagan was my first deck of theirs, given to me as a gift, and I’ve been in love with their work ever since. Their decks feel less like products than complete artistic statements.
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
