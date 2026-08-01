"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
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
    deckNumber: values.deckNumber ?? null,
    productionRun: values.productionRun ?? null,
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
    },
  });

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

  await prisma.$transaction([
    prisma.deckImage.deleteMany({ where: { deckId } }),
    prisma.deck.update({
      where: { id: deckId },
      data: {
        ...toDeckData(parsed.data),
        images: {
          create: parsed.data.imageUrls.map((url, i) => ({ url, sortOrder: i })),
        },
      },
    }),
  ]);

  revalidatePath("/collection");
  revalidatePath(`/decks/${deckId}`);
  redirect(`/decks/${deckId}`);
}

export async function deleteDeck(deckId: string) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  await prisma.deck.delete({ where: { id: deckId } });
  revalidatePath("/collection");
  redirect("/collection");
}

function flatten(error: ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
