"use server";

import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { invalidateCatalogCaches } from "@/lib/catalog-cache";
import { deleteUnreferencedBlobUrls } from "@/lib/blob-cleanup";
import { parseSeriesFormData } from "@/lib/series-schemas";

export interface SeriesFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
  saved?: boolean;
}

export async function updateSeries(
  seriesId: string,
  _previousState: SeriesFormState,
  formData: FormData
): Promise<SeriesFormState> {
  const session = await getSession();
  if (!session.authenticated) return { error: "You must be logged in to edit a Series." };

  const parsed = parseSeriesFormData(formData);
  if (!parsed.success) {
    return { error: "Please fix the errors below.", fieldErrors: flatten(parsed.error) };
  }

  const current = await prisma.series.findUnique({
    where: { id: seriesId },
    select: { name: true, slug: true, heroImageUrl: true },
  });
  if (!current) return { error: "This Series no longer exists." };

  const duplicate = await prisma.series.findFirst({
    where: { name: parsed.data.name, id: { not: seriesId } },
    select: { id: true },
  });
  if (duplicate) {
    return {
      error: "Please fix the errors below.",
      fieldErrors: { name: "A Series with this exact name already exists. Use the merge workflow instead." },
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.series.update({
      where: { id: seriesId },
      data: {
        name: parsed.data.name,
        subtitle: parsed.data.subtitle ?? null,
        attributionLabel: parsed.data.attributionLabel ?? null,
        attributionText: parsed.data.attributionText ?? null,
        description: parsed.data.description ?? null,
        heroImageUrl: parsed.data.heroImageUrl ?? null,
      },
    });

    if (parsed.data.name !== current.name) {
      await tx.deck.updateMany({
        where: { seriesId },
        data: { seriesLegacy: parsed.data.name },
      });
    }
  });

  if (current.heroImageUrl && current.heroImageUrl !== parsed.data.heroImageUrl) {
    await deleteUnreferencedBlobUrls([current.heroImageUrl]);
  }

  invalidateCatalogCaches();
  revalidatePath(`/series/${current.slug}`);
  revalidatePath("/", "layout");
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
