import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeckForm } from "@/components/deck-form";
import { updateDeck } from "../../actions";

export default async function EditDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [deck, designers, producers] = await Promise.all([
    prisma.deck.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        editions: { orderBy: { deckNumber: "asc" } },
      },
    }),
    prisma.deck.findMany({
      distinct: ["designer"],
      where: { designer: { not: null } },
      select: { designer: true },
      orderBy: { designer: "asc" },
    }),
    prisma.deck.findMany({
      distinct: ["producer"],
      where: { producer: { not: null } },
      select: { producer: true },
      orderBy: { producer: "asc" },
    }),
  ]);

  if (!deck) notFound();

  const updateDeckWithId = updateDeck.bind(null, deck.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-felt-ink">Edit Deck</h1>
      <DeckForm
        action={updateDeckWithId}
        defaultValues={{
          name: deck.name,
          series: deck.series ?? undefined,
          designer: deck.designer ?? undefined,
          producer: deck.producer ?? undefined,
          qty: deck.qty,
          editionNumbers: deck.editions.map((e) => e.deckNumber),
          productionRun: deck.productionRun,
          releaseYear: deck.releaseYear,
          notes: deck.notes ?? undefined,
          catalogNumber: deck.catalogNumber ?? undefined,
          tags: deck.tags,
        }}
        initialImages={deck.images.map((i) => ({ url: i.url }))}
        designers={designers.map((d) => d.designer!).filter(Boolean)}
        producers={producers.map((p) => p.producer!).filter(Boolean)}
        submitLabel="Save changes"
      />
    </div>
  );
}
