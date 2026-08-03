import { prisma } from "@/lib/prisma";
import { DeckCard } from "@/components/deck-card";

// A faint tiled camera-icon pattern behind the hero, echoing the same technique used on the
// homepage hero — generated inline so it doesn't need a hosted image asset.
const SOUVENIR_WATERMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="110" viewBox="0 0 110 110"><g transform="translate(6,8) scale(1.3)" fill="none" stroke="#f3ead1" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></g><g transform="translate(58,58) scale(1)" fill="none" stroke="#f3ead1" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></g></svg>`;
const SOUVENIR_WATERMARK_URL = `url("data:image/svg+xml,${encodeURIComponent(SOUVENIR_WATERMARK_SVG)}")`;

export default async function SouvenirDecksPage() {
  const decks = await prisma.deck.findMany({
    where: { series: "Souvenir Decks" },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: SOUVENIR_WATERMARK_URL, backgroundRepeat: "repeat" }}
        />
        <div className="relative flex flex-col gap-3 p-6">
          <h1 className="font-display text-2xl font-semibold text-felt-ink sm:text-3xl">
            Souvenir Decks
          </h1>
          <p className="max-w-2xl text-sm text-felt-sub">
            Souvenir decks hold a special place in the collection — the ones picked up from a
            trip, a museum gift shop, or a roadside stand, each one a small paper postcard of
            somewhere I&rsquo;ve been (or wish I had). Unlike a numbered art-deck release, these
            are printed for tourists first and collectors second, which somehow makes them more
            charming: cheerful, a little kitschy, and completely unpretentious about what they
            are. This is where I&rsquo;m gathering them together.
          </p>
        </div>
      </div>

      {decks.length === 0 ? (
        <p className="py-16 text-center text-felt-sub">No souvenir decks tagged yet.</p>
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
