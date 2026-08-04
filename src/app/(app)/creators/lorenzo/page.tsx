import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { DeckCard } from "@/components/deck-card";

const LORENZO_HERO_IMAGE_URL =
  "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/pages/lorenzo-hero.webp";

export default async function LorenzoLandingPage() {
  const decks = await prisma.deck.findMany({
    where: { OR: [{ designer: "Lorenzo Gaggiotti" }, { producer: "Lorenzo Gaggiotti" }] },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <Image
          src={LORENZO_HERO_IMAGE_URL}
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
            Lorenzo Gaggiotti
          </h1>
          <p className="text-sm font-medium tracking-wide text-brass">The Architect</p>
          <p className="text-sm text-felt-sub">
            Lorenzo Gaggiotti may or may not be my single favorite playing card creator—there are too many artists whose work I love to make that an easy call. But he is probably the clearest archetype of what I want a creator in my collection to be. The House of the Rising Spade was my first deck of his, and it immediately showed me the full package: impeccable artwork, rich storytelling, and phenomenal execution. Lorenzo does not simply design cards; he builds complete worlds around them, with their own characters, symbols, histories, and artifacts. The artistry is second to none, but it is the way every element supports the larger vision that makes his work feel so complete.
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
