"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { deleteUnreferencedBlobUrls } from "@/lib/blob-cleanup";
import { invalidateCatalogMetadata } from "@/lib/catalog-metadata";
import { parseDeckFormData, type DeckFormValues } from "@/lib/schemas";

export interface DeckFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

// Server Actions are reachable via direct POST requests regardless of what the UI
// shows, so every mutation checks the session itself rather than relying on the
// proxy or a hidden button to keep read-only visitors from writing data.
async function isAuthenticated() {
  const session = await getSession();
  return Boolean(session.authenticated);
}

function toDeckData(values: DeckFormValues) {
  return {
    name: values.name,
    series: values.series ?? null,
    designer: values.designer ?? null,
    producer: values.producer ?? null,
    ownershipStatus: values.ownershipStatus,
    qty: values.qty,
    productionRun: values.productionRun ?? null,
    releaseYear: values.releaseYear ?? null,
    notes: values.notes ?? null,
    catalogNumber: values.catalogNumber ?? null,
    tags: values.tags,
  };
}

export async function createDeck(
  _prevState: DeckFormState,
  formData: FormData
): Promise<DeckFormState> {
  if (!(await isAuthenticated())) {
    return { error: "You must be logged in to add a deck." };
  }

  const parsed = parseDeckFormData(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: flatten(parsed.error) };
  }

  const deck = await prisma.deck.create({
    data: {
      ...toDeckData(parsed.data),
      images: {
        create: parsed.data.imageUrls.map((url, i) => ({ url, sortOrder: i })),
      },
      editions: {
        create: parsed.data.editionNumbers.map((deckNumber) => ({ deckNumber })),
      },
    },
  });

  invalidateCatalogMetadata();
  revalidatePath("/collection");
  redirect(`/decks/${deck.id}`);
}

export async function updateDeck(
  deckId: string,
  _prevState: DeckFormState,
  formData: FormData
): Promise<DeckFormState> {
  if (!(await isAuthenticated())) {
    return { error: "You must be logged in to edit a deck." };
  }

  const parsed = parseDeckFormData(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: flatten(parsed.error) };
  }

  const existingImages = await prisma.deckImage.findMany({
    where: { deckId },
    select: { url: true },
  });

  await prisma.$transaction([
    prisma.deckImage.deleteMany({ where: { deckId } }),
    prisma.deckEdition.deleteMany({ where: { deckId } }),
    prisma.deck.update({
      where: { id: deckId },
      data: {
        ...toDeckData(parsed.data),
        images: {
          create: parsed.data.imageUrls.map((url, i) => ({ url, sortOrder: i })),
        },
        editions: {
          create: parsed.data.editionNumbers.map((deckNumber) => ({ deckNumber })),
        },
      },
    }),
  ]);

  const retainedUrls = new Set(parsed.data.imageUrls);
  await deleteUnreferencedBlobUrls(
    existingImages.map(({ url }) => url).filter((url) => !retainedUrls.has(url))
  );

  invalidateCatalogMetadata();
  revalidatePath("/collection");
  revalidatePath(`/decks/${deckId}`);
  redirect(`/decks/${deckId}`);
}

export async function deleteDeck(deckId: string) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { images: { select: { url: true } } },
  });
  await prisma.deck.delete({ where: { id: deckId } });
  await deleteUnreferencedBlobUrls(deck?.images.map(({ url }) => url) ?? []);
  invalidateCatalogMetadata();
  revalidatePath("/collection");
  redirect("/collection");
}

export async function toggleFavorite(deckId: string) {
  if (!(await isAuthenticated())) return;

  const deck = await prisma.deck.findUnique({ where: { id: deckId }, select: { favorite: true } });
  if (!deck) return;

  await prisma.deck.update({ where: { id: deckId }, data: { favorite: !deck.favorite } });
  invalidateCatalogMetadata();
  // Favorites affect sort order/spotlights on the collection page and every landing page, so
  // just revalidate everything under the app layout rather than tracking each one individually.
  revalidatePath("/", "layout");
}

export async function toggleWhiteWhale(deckId: string) {
  if (!(await isAuthenticated())) return;

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { whiteWhale: true },
  });
  if (!deck) return;

  await prisma.deck.update({
    where: { id: deckId },
    data: { whiteWhale: !deck.whiteWhale },
  });
  invalidateCatalogMetadata();
  revalidatePath("/", "layout");
}

function flatten(error: ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
