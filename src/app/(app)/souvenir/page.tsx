import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { DeckCard } from "@/components/deck-card";

const SOUVENIR_HERO_IMAGE_URL =
  "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/pages/souvenir-hero.jpg";

export default async function SouvenirDecksPage() {
  const decks = await prisma.deck.findMany({
    where: { series: "Souvenir Decks" },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <Image
          src={SOUVENIR_HERO_IMAGE_URL}
          alt=""
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="pointer-events-none object-cover opacity-[0.18] lg:object-right lg:opacity-100"
        />
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(to right, var(--felt-bg) 0%, var(--felt-bg) 44%, transparent 58%)",
          }}
        />
        <div className="relative flex flex-col gap-3 p-6 lg:max-w-xl">
          <h1 className="font-display text-2xl font-semibold text-felt-ink sm:text-3xl">
            Souvenir Decks
          </h1>
          <p className="text-sm text-felt-sub">
            Souvenir decks hold a special place in my collection because they are more than keepsakes—they are small historical objects. I first became interested in them after seeing the Niagara Falls and White Pass and Yukon Route decks at the 2024 52+Joker Convention, and Matt Schacht’s excellent talk the following year only deepened that interest. Made for tourists rather than collectors, these decks preserve how a place, attraction, railroad, or business chose to present itself at a particular moment in time. They can be cheerful, kitschy, and unassuming, but they also capture pieces of history that might otherwise disappear. This is where I’m gathering those stories together.
          </p>
        </div>
      </div>

      {decks.length === 0 ? (
        <p className="py-16 text-center text-felt-sub">No souvenir decks yet.</p>
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
