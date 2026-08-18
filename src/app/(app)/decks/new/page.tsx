import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DeckForm } from "@/components/deck-form";
import { createDeck } from "../actions";

export const metadata: Metadata = {
  title: "Add Deck",
  robots: { index: false, follow: false },
};

export default async function NewDeckPage() {
  const [designers, producers, seriesOptions] = await Promise.all([
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-felt-ink">Add Deck</h1>
      <DeckForm
        action={createDeck}
        designers={designers.map((d) => d.designer!).filter(Boolean)}
        producers={producers.map((p) => p.producer!).filter(Boolean)}
        seriesOptions={seriesOptions}
        submitLabel="Save deck"
        enableAiIdentify
      />
    </div>
  );
}
