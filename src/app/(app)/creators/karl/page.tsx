import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { DeckCard } from "@/components/deck-card";
import { DeckSpotlightCard } from "@/components/deck-spotlight-card";
import { HeartIcon } from "@/components/icons";

const KARL_HERO_IMAGE_URL =
  "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/karl-gerich-joker.jpg";

export default async function KarlLandingPage() {
  const decks = await prisma.deck.findMany({
    where: { OR: [{ designer: "Karl Gerich" }, { producer: "Karl Gerich" }] },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { name: "asc" },
  });
  const favoriteDecks = decks.filter((d) => d.favorite);
  const restDecks = decks.filter((d) => !d.favorite);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <Image
          src={KARL_HERO_IMAGE_URL}
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
            Karl Gerich
          </h1>
          <p className="text-sm font-medium tracking-wide text-brass">The Craftsman</p>
          <p className="text-sm text-felt-sub">
            Few creators have changed the way I understand playing cards as profoundly as Karl Gerich. I have poured more time into studying, collecting, and appreciating his work than perhaps that of any other artist. His decks are stunning, but beauty is only the beginning. Gerich understood the history and visual language of playing cards intimately, then reinterpreted them with extraordinary craftsmanship, intelligence, and imagination. Because he controlled so much of the process himself, every deck feels intensely personal—an object made by an artist rather than simply designed by one. His work rewards close study, and each new deck has expanded my appreciation for what playing cards can be. Collecting Gerich has become a collection within the collection.
          </p>
        </div>
      </div>

      {decks.length === 0 ? (
        <p className="py-16 text-center text-felt-sub">No decks yet.</p>
      ) : (
        <>
          {favoriteDecks.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 text-sm font-medium text-felt-sub">
                <HeartIcon filled className="h-4 w-4 text-brick" />
                Featured
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteDecks.map((deck) => (
                  <DeckSpotlightCard key={deck.id} deck={deck} />
                ))}
              </div>
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
