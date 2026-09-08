import type { Prisma } from "@/generated/prisma/client";
import { deckSlugCandidates, type SlugDeck } from "./deck-slug";

export async function assignDeckSlug(tx: Prisma.TransactionClient, deck: SlugDeck) {
  // Serialize allocations, including concurrent creates with the same title.
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(73529, 1)::text`;
  for (const slug of deckSlugCandidates(deck)) {
    const occupied = await tx.deckSlugHistory.findUnique({ where: { slug } });
    const deckWithSlug = await tx.deck.findFirst({ where: { OR: [{ slug }, { id: slug }] }, select: { id: true } });
    if ((occupied && occupied.deckId !== deck.id) || (deckWithSlug && deckWithSlug.id !== deck.id)) continue;
    return tx.deck.update({ where: { id: deck.id }, data: { slug }, select: { id: true, slug: true } });
  }
  throw new Error("Could not allocate a unique deck slug.");
}
