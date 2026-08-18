import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DeckForm } from "@/components/deck-form";
import { updateDeck } from "../../actions";

export const metadata: Metadata = {
  title: "Edit Deck",
  robots: { index: false, follow: false },
};

export default async function EditDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [deck, designers, producers, seriesOptions] = await Promise.all([
    prisma.deck.findUnique({
      where: { id },
      include: {
        series: true,
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
    prisma.series.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
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
          seriesId: deck.seriesId ?? undefined,
          seriesName: deck.series?.name,
          seriesRaw: deck.seriesRaw ?? undefined,
          seriesOrder: deck.seriesOrder,
          variantNote: deck.variantNote ?? undefined,
          designer: deck.designer ?? undefined,
          producer: deck.producer ?? undefined,
          qty: deck.qty,
          editionNumbers: deck.editions.map((e) => e.deckNumber),
          productionRun: deck.productionRun,
          releaseYear: deck.releaseYear,
          collectionReasonPrimary: deck.collectionReasonPrimary ?? undefined,
          collectionReasonSecondary: deck.collectionReasonSecondary ?? undefined,
          hook: deck.hook ?? undefined,
          notes: deck.notes ?? undefined,
          essay: deck.essay ?? undefined,
          notesReviewedAt: deck.notesReviewedAt?.toISOString(),
          catalogNumber: deck.catalogNumber ?? undefined,
          tags: deck.tags,
        }}
        initialImages={deck.images.map((i) => ({ url: i.url }))}
        designers={designers.map((d) => d.designer!).filter(Boolean)}
        producers={producers.map((p) => p.producer!).filter(Boolean)}
        seriesOptions={seriesOptions}
        submitLabel="Save changes"
        showEditorialFields
      />
    </div>
  );
}
