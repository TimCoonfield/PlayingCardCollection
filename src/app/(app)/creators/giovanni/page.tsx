import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { DeckCard } from "@/components/deck-card";

const GIOVANNI_HERO_IMAGE_URL =
  "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/creators/giovanni-meroni-noRU3HevoEaag8w1MAVrWe1TkPjfIY.png";

export default async function GiovanniLandingPage() {
  const decks = await prisma.deck.findMany({
    where: { designer: "Giovanni Meroni" },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <Image
          src={GIOVANNI_HERO_IMAGE_URL}
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
            Giovanni Meroni
          </h1>
          <p className="text-sm font-medium tracking-wide text-brass">The Mythmaker</p>
          <p className="text-sm text-felt-sub">
            Giovanni Meroni is another of my absolute favorite creators, largely because of the depth of the stories he builds behind his decks. My first was Dedalo, which arrived almost accidentally as a single deck in an eBay lot. Its interpretation of the Minotaur, the Labyrinth, and the larger mythology surrounding them drew me in immediately. Since then, I’ve had the privilege of speaking with Giovanni several times, and his excitement when explaining the characters, symbolism, and hidden lore behind his work is infectious. The artwork is striking on its own, but understanding how thoughtfully every detail fits into the story makes the decks far more rewarding. Giovanni creates designs that invite you to keep looking, reading, and discovering.
          </p>
        </div>
      </div>

      {decks.length === 0 ? (
        <p className="py-16 text-center text-felt-sub">No decks yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}
    </div>
  );
}
