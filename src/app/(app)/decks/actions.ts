"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { deleteUnreferencedBlobUrls } from "@/lib/blob-cleanup";
import { invalidateCatalogCaches } from "@/lib/catalog-cache";
import { parseDeckFormData, type DeckFormValues } from "@/lib/schemas";
import { seriesCollisionSlug, seriesSlugBase } from "@/lib/series-slug";

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

function toDeckData(
  values: DeckFormValues,
  series: { id: string; name: string } | null
) {
  return {
    name: values.name,
    seriesId: series?.id ?? null,
    seriesLegacy: series?.name ?? null,
    seriesOrder: series ? values.seriesOrder ?? null : null,
    variantNote: series ? values.variantNote ?? null : null,
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

class SeriesSelectionError extends Error {}

async function resolveSeries(
  tx: Prisma.TransactionClient,
  values: DeckFormValues
): Promise<{ id: string; name: string } | null> {
  if (values.seriesId) {
    const selected = await tx.series.findUnique({
      where: { id: values.seriesId },
      select: { id: true, name: true },
    });
    if (!selected) throw new SeriesSelectionError("The selected Series no longer exists.");
    return selected;
  }

  if (!values.newSeriesName) return null;

  const existing = await tx.series.findUnique({
    where: { name: values.newSeriesName },
    select: { id: true, name: true },
  });
  if (existing) return existing;

  const base = seriesSlugBase(values.newSeriesName);
  const candidates = base
    ? [base, ...[8, 12, 16, 32, 64].map((length) => seriesCollisionSlug(values.newSeriesName!, length))]
    : [8, 12, 16, 32, 64].map((length) => seriesCollisionSlug(values.newSeriesName!, length));

  for (const slug of candidates) {
    const occupied = await tx.series.findUnique({ where: { slug }, select: { id: true } });
    if (!occupied) {
      return tx.series.create({
        data: { name: values.newSeriesName, slug },
        select: { id: true, name: true },
      });
    }
  }

  throw new SeriesSelectionError("Could not generate a unique slug for this Series.");
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

  let deck: { id: string };
  try {
    deck = await prisma.$transaction(async (tx) => {
      const series = await resolveSeries(tx, parsed.data);
      return tx.deck.create({
        data: {
          ...toDeckData(parsed.data, series),
          images: {
            create: parsed.data.imageUrls.map((url, i) => ({ url, sortOrder: i })),
          },
          editions: {
            create: parsed.data.editionNumbers.map((deckNumber) => ({ deckNumber })),
          },
        },
        select: { id: true },
      });
    });
  } catch (error) {
    if (error instanceof SeriesSelectionError) {
      return { error: "Please fix the errors below.", fieldErrors: { seriesId: error.message } };
    }
    throw error;
  }

  invalidateCatalogCaches();
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

  try {
    await prisma.$transaction(async (tx) => {
      const series = await resolveSeries(tx, parsed.data);
      await tx.deckImage.deleteMany({ where: { deckId } });
      await tx.deckEdition.deleteMany({ where: { deckId } });
      await tx.deck.update({
        where: { id: deckId },
        data: {
          ...toDeckData(parsed.data, series),
          images: {
            create: parsed.data.imageUrls.map((url, i) => ({ url, sortOrder: i })),
          },
          editions: {
            create: parsed.data.editionNumbers.map((deckNumber) => ({ deckNumber })),
          },
        },
      });
    });
  } catch (error) {
    if (error instanceof SeriesSelectionError) {
      return { error: "Please fix the errors below.", fieldErrors: { seriesId: error.message } };
    }
    throw error;
  }

  const retainedUrls = new Set(parsed.data.imageUrls);
  await deleteUnreferencedBlobUrls(
    existingImages.map(({ url }) => url).filter((url) => !retainedUrls.has(url))
  );

  invalidateCatalogCaches();
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
  invalidateCatalogCaches();
  revalidatePath("/collection");
  redirect("/collection");
}

export async function toggleFavorite(deckId: string) {
  if (!(await isAuthenticated())) return;

  const deck = await prisma.deck.findUnique({ where: { id: deckId }, select: { favorite: true } });
  if (!deck) return;

  await prisma.deck.update({ where: { id: deckId }, data: { favorite: !deck.favorite } });
  invalidateCatalogCaches();
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
  invalidateCatalogCaches();
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
