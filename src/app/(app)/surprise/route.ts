import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const deckCount = await prisma.deck.count();
    if (deckCount === 0) return redirectToCollection(request);

    const deck = await prisma.deck.findFirst({
      orderBy: { id: "asc" },
      skip: Math.floor(Math.random() * deckCount),
      select: { id: true },
    });

    if (!deck) return redirectToCollection(request);
    return noStoreRedirect(new URL(`/decks/${deck.id}`, request.url));
  } catch {
    return redirectToCollection(request);
  }
}

function redirectToCollection(request: Request) {
  return noStoreRedirect(new URL("/collection?type=deck", request.url));
}

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
