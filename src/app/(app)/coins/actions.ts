"use server";

import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { deleteUnreferencedBlobUrls } from "@/lib/blob-cleanup";
import {
  invalidateCollectionCatalogMetadataCache,
  invalidateCoinBrowseCache,
  invalidateCoreCatalogMetadataCache,
  invalidateCreatorCatalogMetadataCache,
} from "@/lib/catalog-cache";
import { parseCoinFormData, type CoinFormValues } from "@/lib/coin-schemas";
import {
  CreatorSelectionError,
  resolveCreatorSelection,
  type ResolvedCreator,
} from "@/lib/creator-write";

export interface CoinFormState {
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

function toCoinData(
  values: CoinFormValues,
  designer: ResolvedCreator | null,
  producer: ResolvedCreator | null
) {
  return {
    name: values.name,
    series: values.series ?? null,
    designer: designer?.name ?? null,
    designerCreatorId: designer?.id ?? null,
    producer: producer?.name ?? null,
    producerCreatorId: producer?.id ?? null,
    material: values.material ?? null,
    diameter: values.diameter ?? null,
    ownershipStatus: values.ownershipStatus,
    qty: values.qty,
    releaseYear: values.releaseYear ?? null,
    notes: values.notes ?? null,
    catalogNumber: values.catalogNumber ?? null,
    tags: values.tags,
    obverseImageUrl: values.obverseImageUrl ?? null,
    reverseImageUrl: values.reverseImageUrl ?? null,
  };
}

async function resolveCoinCreators(tx: Prisma.TransactionClient, values: CoinFormValues) {
  const designer = await resolveCreatorSelection(
    tx,
    {
      query: values.designer,
      creatorId: values.designerCreatorId,
      newCreatorName: values.newDesignerName,
    },
    "designer"
  );
  const producer = await resolveCreatorSelection(
    tx,
    {
      query: values.producer,
      creatorId: values.producerCreatorId,
      newCreatorName: values.newProducerName,
    },
    "producer"
  );
  return { designer, producer };
}

export async function createCoin(
  _prevState: CoinFormState,
  formData: FormData
): Promise<CoinFormState> {
  if (!(await isAuthenticated())) {
    return { error: "You must be logged in to add a coin." };
  }

  const parsed = parseCoinFormData(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: flatten(parsed.error) };
  }

  let coin: { id: string };
  try {
    coin = await prisma.$transaction(async (tx) => {
      const creators = await resolveCoinCreators(tx, parsed.data);
      return tx.coin.create({
        data: toCoinData(parsed.data, creators.designer, creators.producer),
        select: { id: true },
      });
    });
  } catch (error) {
    if (error instanceof CreatorSelectionError) {
      return { error: "Please fix the errors below.", fieldErrors: { [error.field]: error.message } };
    }
    throw error;
  }

  invalidateCoinBrowseCache();
  invalidateCoreCatalogMetadataCache();
  invalidateCollectionCatalogMetadataCache();
  invalidateCreatorCatalogMetadataCache();
  redirect(`/coins/${coin.id}`);
}

export async function updateCoin(
  coinId: string,
  _prevState: CoinFormState,
  formData: FormData
): Promise<CoinFormState> {
  if (!(await isAuthenticated())) {
    return { error: "You must be logged in to edit a coin." };
  }

  const parsed = parseCoinFormData(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: flatten(parsed.error) };
  }

  const existingCoin = await prisma.coin.findUnique({
    where: { id: coinId },
    select: { obverseImageUrl: true, reverseImageUrl: true },
  });

  try {
    await prisma.$transaction(async (tx) => {
      const creators = await resolveCoinCreators(tx, parsed.data);
      await tx.coin.update({
        where: { id: coinId },
        data: toCoinData(parsed.data, creators.designer, creators.producer),
      });
    });
  } catch (error) {
    if (error instanceof CreatorSelectionError) {
      return { error: "Please fix the errors below.", fieldErrors: { [error.field]: error.message } };
    }
    throw error;
  }

  const retainedUrls = new Set(
    [parsed.data.obverseImageUrl, parsed.data.reverseImageUrl].filter(
      (url): url is string => Boolean(url)
    )
  );
  const previousUrls = [existingCoin?.obverseImageUrl, existingCoin?.reverseImageUrl].filter(
    (url): url is string => Boolean(url)
  );
  await deleteUnreferencedBlobUrls(
    previousUrls.filter((url) => !retainedUrls.has(url))
  );

  invalidateCoinBrowseCache();
  invalidateCoreCatalogMetadataCache();
  invalidateCollectionCatalogMetadataCache();
  invalidateCreatorCatalogMetadataCache();
  redirect(`/coins/${coinId}`);
}

export async function deleteCoin(coinId: string) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const coin = await prisma.coin.findUnique({
    where: { id: coinId },
    select: { obverseImageUrl: true, reverseImageUrl: true },
  });
  await prisma.coin.delete({ where: { id: coinId } });
  await deleteUnreferencedBlobUrls(
    [coin?.obverseImageUrl, coin?.reverseImageUrl].filter(
      (url): url is string => Boolean(url)
    )
  );
  invalidateCoinBrowseCache();
  invalidateCoreCatalogMetadataCache();
  invalidateCollectionCatalogMetadataCache();
  invalidateCreatorCatalogMetadataCache();
  redirect("/coins");
}

function flatten(error: ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
