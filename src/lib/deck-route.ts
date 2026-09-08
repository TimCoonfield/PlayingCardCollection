import { cache } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "./prisma";
import { getDeckPageData } from "./deck-data";
import { deckPath } from "./deck-path";

// Resolve the address separately from cached content: renames must never serve a stale redirect.
export const resolveDeckAddress = cache(async (address: string) => {
  if (address.length > 240) return null;
  const direct = await prisma.deck.findFirst({
    where: { OR: [{ id: address }, { slug: address }] },
    select: { id: true, slug: true },
  });
  if (direct) return direct;
  const historical = await prisma.deckSlugHistory.findUnique({
    where: { slug: address }, select: { deck: { select: { id: true, slug: true } } },
  });
  return historical?.deck ?? null;
});

export const getDeckRouteData = cache(async (address: string) => {
  const resolved = await resolveDeckAddress(address);
  if (!resolved) notFound();
  if (resolved.slug && resolved.slug !== address) permanentRedirect(deckPath(resolved));
  const deck = await getDeckPageData(resolved.id);
  if (!deck) notFound();
  return { ...deck, slug: resolved.slug };
});
