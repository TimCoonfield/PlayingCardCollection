"use server";

import { refresh } from "next/cache";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { deleteUnreferencedBlobUrls } from "@/lib/blob-cleanup";
import {
  invalidateAllDeckBrowsePages,
  invalidateAllPublicDeckDetails,
  invalidateCoinBrowseCache,
  invalidateCollectionCatalogMetadataCache,
  invalidateCoreCatalogMetadataCache,
  invalidateCreatorCatalogMetadataCache,
  invalidateCreatorProfileCache,
  invalidateStatsCatalogMetadataCache,
} from "@/lib/catalog-cache";
import { joinDesignerNames } from "@/lib/designers";
import { parseCreatorFormData } from "@/lib/creator-schemas";

export interface CreatorFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
}

export async function updateCreator(
  creatorId: string,
  _previousState: CreatorFormState,
  formData: FormData
): Promise<CreatorFormState> {
  const session = await getSession();
  if (!session.authenticated) return { error: "You must be logged in to edit a Creator." };

  const parsed = parseCreatorFormData(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: flatten(parsed.error) };
  }

  const current = await prisma.creator.findUnique({
    where: { id: creatorId },
    select: { name: true, slug: true, heroImageUrl: true, favorite: true },
  });
  if (!current) return { error: "This Creator no longer exists." };

  const duplicate = await prisma.creator.findFirst({
    where: { name: parsed.data.name, id: { not: creatorId } },
    select: { id: true },
  });
  if (duplicate) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: { name: "A Creator with this exact name already exists. Use the merge workflow instead." },
    };
  }

  const nameChanged = current.name !== parsed.data.name;
  await prisma.$transaction(async (tx) => {
    await tx.creator.update({
      where: { id: creatorId },
      data: {
        name: parsed.data.name,
        displayName: parsed.data.displayName ?? null,
        tagline: parsed.data.tagline ?? null,
        description: parsed.data.description ?? null,
        heroImageUrl: parsed.data.heroImageUrl ?? null,
        favorite: parsed.data.favorite,
      },
    });

    if (!nameChanged) return;

    await Promise.all([
      tx.deck.updateMany({
        where: { producerCreatorId: creatorId },
        data: { producer: parsed.data.name },
      }),
      tx.coin.updateMany({
        where: { designerCreatorId: creatorId },
        data: { designer: parsed.data.name },
      }),
      tx.coin.updateMany({
        where: { producerCreatorId: creatorId },
        data: { producer: parsed.data.name },
      }),
    ]);

    const designedDecks = await tx.deck.findMany({
      where: { designers: { some: { designerId: creatorId } } },
      select: {
        id: true,
        designers: {
          orderBy: { sortOrder: "asc" },
          select: { designer: { select: { name: true } } },
        },
      },
    });
    for (const deck of designedDecks) {
      await tx.deck.update({
        where: { id: deck.id },
        data: { designerLegacy: joinDesignerNames(deck.designers.map(({ designer }) => designer.name)) },
      });
    }
  });

  if (current.heroImageUrl && current.heroImageUrl !== parsed.data.heroImageUrl) {
    await deleteUnreferencedBlobUrls([current.heroImageUrl]);
  }

  invalidateCreatorCatalogMetadataCache();
  invalidateCreatorProfileCache(current.slug);
  if (nameChanged) {
    invalidateAllDeckBrowsePages();
    invalidateCoinBrowseCache();
    invalidateCoreCatalogMetadataCache();
    invalidateCollectionCatalogMetadataCache();
    invalidateStatsCatalogMetadataCache();
    invalidateAllPublicDeckDetails();
  }
  refresh();
  return { saved: true };
}

function flatten(error: ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
