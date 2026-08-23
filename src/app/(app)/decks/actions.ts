"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { z, type ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { deleteUnreferencedBlobUrls } from "@/lib/blob-cleanup";
import {
  DECK_BROWSE_CACHE_PAGE_SIZE,
  invalidateAllDeckBrowsePages,
  invalidateAllCatalogMetadataCaches,
  invalidateArchiveSeriesMetadataCache,
  invalidateCollectionCatalogMetadataCache,
  invalidateCoreCatalogMetadataCache,
  invalidateCreatorCatalogMetadataCache,
  invalidateDeckBrowsePage,
  invalidateFavoriteDeckImagesCache,
  invalidateHomeCatalogMetadataCache,
  invalidatePublicDeckDetail,
  invalidateRecentDecksCache,
  invalidateSeriesSpotlightCache,
  invalidateStatsCatalogMetadataCache,
} from "@/lib/catalog-cache";
import { parseDeckFormData, type DeckFormValues } from "@/lib/schemas";
import { seriesCollisionSlug, seriesSlugBase } from "@/lib/series-slug";

export interface DeckFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export interface QuickReleaseYearState {
  status?: "saved" | "error";
  message?: string;
  savedYear?: number;
}

const quickReleaseYearSchema = z.coerce
  .number()
  .int()
  .min(1000, "Enter a four-digit year")
  .max(9999, "Enter a four-digit year");

// Server Actions are reachable via direct POST requests regardless of what the UI
// shows, so every mutation checks the session itself rather than relying on the
// proxy or a hidden button to keep read-only visitors from writing data.
async function isAuthenticated() {
  const session = await getSession();
  return Boolean(session.authenticated);
}

async function getDeckBrowsePageIndex(name: string, id: string) {
  const precedingDecks = await prisma.deck.count({
    where: {
      OR: [
        { name: { lt: name } },
        { name, id: { lt: id } },
      ],
    },
  });
  return Math.floor(precedingDecks / DECK_BROWSE_CACHE_PAGE_SIZE);
}

function sameStrings(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
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

function toEditorialDeckData(values: DeckFormValues) {
  return {
    collectionReasonPrimary: values.collectionReasonPrimary ?? null,
    collectionReasonSecondary: values.collectionReasonSecondary ?? null,
    hook: values.hook ?? null,
    notes: values.notes ?? null,
    essay: values.essay ?? null,
  };
}

class SeriesSelectionError extends Error {}

async function resolveSeries(
  tx: Prisma.TransactionClient,
  values: DeckFormValues
): Promise<{ id: string; name: string; isNew: boolean } | null> {
  if (values.seriesId) {
    const selected = await tx.series.findUnique({
      where: { id: values.seriesId },
      select: { id: true, name: true },
    });
    if (!selected) throw new SeriesSelectionError("The selected Series no longer exists.");
    return { ...selected, isNew: false };
  }

  if (!values.newSeriesName) return null;

  const existing = await tx.series.findUnique({
    where: { name: values.newSeriesName },
    select: { id: true, name: true },
  });
  if (existing) return { ...existing, isNew: false };

  const base = seriesSlugBase(values.newSeriesName);
  const candidates = base
    ? [base, ...[8, 12, 16, 32, 64].map((length) => seriesCollisionSlug(values.newSeriesName!, length))]
    : [8, 12, 16, 32, 64].map((length) => seriesCollisionSlug(values.newSeriesName!, length));

  for (const slug of candidates) {
    const occupied = await tx.series.findUnique({ where: { slug }, select: { id: true } });
    if (!occupied) {
      const created = await tx.series.create({
        data: { name: values.newSeriesName, slug },
        select: { id: true, name: true },
      });
      return { ...created, isNew: true };
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

  invalidateAllDeckBrowsePages();
  invalidateAllCatalogMetadataCaches();
  invalidateRecentDecksCache();
  invalidateSeriesSpotlightCache();
  invalidatePublicDeckDetail(deck.id);
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

  const existingDeck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: {
      name: true,
      seriesId: true,
      designer: true,
      producer: true,
      qty: true,
      releaseYear: true,
      notes: true,
      tags: true,
      collectionReasonPrimary: true,
      collectionReasonSecondary: true,
      favorite: true,
      notesReviewedAt: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: { url: true },
      },
    },
  });
  if (!existingDeck) return { error: "This deck no longer exists." };

  const existingBrowsePage = await getDeckBrowsePageIndex(existingDeck.name, deckId);

  let savedSeries = { id: null as string | null, isNew: false };
  try {
    savedSeries = await prisma.$transaction(async (tx) => {
      const series = await resolveSeries(tx, parsed.data);
      await tx.deckImage.deleteMany({ where: { deckId } });
      await tx.deckEdition.deleteMany({ where: { deckId } });
      await tx.deck.update({
        where: { id: deckId },
        data: {
          ...toDeckData(parsed.data, series),
          ...toEditorialDeckData(parsed.data),
          notesReviewedAt: parsed.data.notesReviewed
            ? existingDeck?.notesReviewedAt ?? new Date()
            : null,
          images: {
            create: parsed.data.imageUrls.map((url, i) => ({ url, sortOrder: i })),
          },
          editions: {
            create: parsed.data.editionNumbers.map((deckNumber) => ({ deckNumber })),
          },
        },
      });
      return { id: series?.id ?? null, isNew: series?.isNew ?? false };
    });
  } catch (error) {
    if (error instanceof SeriesSelectionError) {
      return { error: "Please fix the errors below.", fieldErrors: { seriesId: error.message } };
    }
    throw error;
  }

  const retainedUrls = new Set(parsed.data.imageUrls);
  await deleteUnreferencedBlobUrls(
    existingDeck.images.map(({ url }) => url).filter((url) => !retainedUrls.has(url))
  );

  const previousImageUrls = existingDeck.images.map(({ url }) => url);
  const imagesChanged = !sameStrings(previousImageUrls, parsed.data.imageUrls);
  const nameChanged = existingDeck.name !== parsed.data.name;
  const seriesChanged = existingDeck.seriesId !== savedSeries.id;
  const designerChanged = existingDeck.designer !== (parsed.data.designer ?? null);
  const producerChanged = existingDeck.producer !== (parsed.data.producer ?? null);
  const quantityChanged = existingDeck.qty !== parsed.data.qty;
  const releaseYearChanged = existingDeck.releaseYear !== (parsed.data.releaseYear ?? null);
  const tagsChanged = !sameStrings(existingDeck.tags, parsed.data.tags);
  const browseChanged = nameChanged ||
    seriesChanged ||
    designerChanged ||
    producerChanged ||
    quantityChanged ||
    releaseYearChanged ||
    existingDeck.notes !== (parsed.data.notes ?? null) ||
    tagsChanged ||
    existingDeck.collectionReasonPrimary !== (parsed.data.collectionReasonPrimary ?? null) ||
    existingDeck.collectionReasonSecondary !== (parsed.data.collectionReasonSecondary ?? null) ||
    imagesChanged;

  invalidatePublicDeckDetail(deckId);
  if (browseChanged) {
    if (nameChanged) invalidateAllDeckBrowsePages();
    else invalidateDeckBrowsePage(existingBrowsePage);
    invalidateRecentDecksCache();
  }
  if (designerChanged || savedSeries.isNew) invalidateCoreCatalogMetadataCache();
  if (designerChanged || producerChanged || releaseYearChanged || savedSeries.isNew) {
    invalidateCollectionCatalogMetadataCache();
  }
  if (designerChanged || producerChanged || nameChanged || imagesChanged) {
    invalidateCreatorCatalogMetadataCache();
  }
  if (tagsChanged || seriesChanged) invalidateHomeCatalogMetadataCache();
  if (designerChanged || quantityChanged || releaseYearChanged || tagsChanged || seriesChanged) {
    invalidateStatsCatalogMetadataCache();
  }
  if (seriesChanged || savedSeries.isNew) invalidateArchiveSeriesMetadataCache();
  if (imagesChanged && existingDeck.favorite) invalidateFavoriteDeckImagesCache();
  if (nameChanged || seriesChanged || tagsChanged || imagesChanged) {
    invalidateSeriesSpotlightCache();
  }
  redirect(`/decks/${deckId}`);
}

export async function updateDeckReleaseYear(
  deckId: string,
  _prevState: QuickReleaseYearState,
  formData: FormData
): Promise<QuickReleaseYearState> {
  if (!(await isAuthenticated())) {
    return { status: "error", message: "Your login has expired. Refresh and log in again." };
  }

  const parsed = quickReleaseYearSchema.safeParse(formData.get("releaseYear"));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Enter a valid year" };
  }

  const deck = await prisma.deck.findUnique({ where: { id: deckId }, select: { name: true } });
  if (!deck) return { status: "error", message: "This deck no longer exists." };
  const browsePage = await getDeckBrowsePageIndex(deck.name, deckId);

  const result = await prisma.deck.updateMany({
    where: { id: deckId },
    data: { releaseYear: parsed.data },
  });
  if (result.count === 0) {
    return { status: "error", message: "This deck no longer exists." };
  }

  invalidateDeckBrowsePage(browsePage);
  invalidateCollectionCatalogMetadataCache();
  invalidateStatsCatalogMetadataCache();
  invalidatePublicDeckDetail(deckId);
  return { status: "saved", message: "Saved", savedYear: parsed.data };
}

export async function deleteDeck(deckId: string) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { favorite: true, images: { select: { url: true } } },
  });
  await prisma.deck.delete({ where: { id: deckId } });
  await deleteUnreferencedBlobUrls(deck?.images.map(({ url }) => url) ?? []);
  invalidateAllDeckBrowsePages();
  invalidateAllCatalogMetadataCaches();
  invalidateRecentDecksCache();
  invalidateSeriesSpotlightCache();
  invalidatePublicDeckDetail(deckId);
  if (deck?.favorite) invalidateFavoriteDeckImagesCache();
  redirect("/collection");
}

export async function toggleFavorite(deckId: string) {
  if (!(await isAuthenticated())) return;

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { favorite: true, name: true },
  });
  if (!deck) return;

  const browsePage = await getDeckBrowsePageIndex(deck.name, deckId);
  await prisma.deck.update({ where: { id: deckId }, data: { favorite: !deck.favorite } });
  invalidateDeckBrowsePage(browsePage);
  invalidateFavoriteDeckImagesCache();
  invalidateRecentDecksCache();
  invalidatePublicDeckDetail(deckId);
  refresh();
}

export async function toggleWhiteWhale(deckId: string) {
  if (!(await isAuthenticated())) return;

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    select: { whiteWhale: true, name: true },
  });
  if (!deck) return;

  const browsePage = await getDeckBrowsePageIndex(deck.name, deckId);
  await prisma.deck.update({
    where: { id: deckId },
    data: { whiteWhale: !deck.whiteWhale },
  });
  invalidateDeckBrowsePage(browsePage);
  invalidateHomeCatalogMetadataCache();
  invalidateRecentDecksCache();
  invalidatePublicDeckDetail(deckId);
  refresh();
}

function flatten(error: ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
