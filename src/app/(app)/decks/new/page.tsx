import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { DeckForm } from "@/components/deck-form";
import { createDeck } from "../actions";

export const metadata: Metadata = {
  title: "Add Deck",
  robots: { index: false, follow: false },
};

export default async function NewDeckPage() {
  const [creators, seriesOptions] = await Promise.all([
    prisma.creator.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
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
        creators={creators}
        seriesOptions={seriesOptions}
        submitLabel="Save deck"
        enableAiIdentify
      />
    </div>
  );
}
