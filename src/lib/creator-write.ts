import type { Prisma } from "@/generated/prisma/client";
import { creatorCollisionSlug, creatorSlugBase } from "./creator-slug";

export class CreatorSelectionError extends Error {
  constructor(
    message: string,
    readonly field: "designerNames" | "producer" | "designer"
  ) {
    super(message);
  }
}

export interface CreatorSelection {
  query?: string;
  creatorId?: string;
  newCreatorName?: string;
}

export interface ResolvedCreator {
  id: string;
  name: string;
  isNew: boolean;
}

export async function resolveCreatorSelection(
  tx: Prisma.TransactionClient,
  selection: CreatorSelection,
  field: CreatorSelectionError["field"]
): Promise<ResolvedCreator | null> {
  if (selection.creatorId) {
    const selected = await tx.creator.findUnique({
      where: { id: selection.creatorId },
      select: { id: true, name: true },
    });
    if (!selected) throw new CreatorSelectionError("The selected Creator no longer exists.", field);
    return { ...selected, isNew: false };
  }

  if (!selection.newCreatorName) {
    if (selection.query) {
      throw new CreatorSelectionError(
        "Choose an existing Creator or use the Create option.",
        field
      );
    }
    return null;
  }

  const existing = await tx.creator.findUnique({
    where: { name: selection.newCreatorName },
    select: { id: true, name: true },
  });
  if (existing) return { ...existing, isNew: false };

  const base = creatorSlugBase(selection.newCreatorName);
  const candidates = base
    ? [base, ...[8, 12, 16, 32, 64].map((length) => creatorCollisionSlug(selection.newCreatorName!, length))]
    : [8, 12, 16, 32, 64].map((length) => creatorCollisionSlug(selection.newCreatorName!, length));

  for (const slug of candidates) {
    const occupied = await tx.creator.findUnique({ where: { slug }, select: { id: true } });
    if (!occupied) {
      const created = await tx.creator.create({
        data: { name: selection.newCreatorName, slug },
        select: { id: true, name: true },
      });
      return { ...created, isNew: true };
    }
  }

  throw new CreatorSelectionError("Could not generate a unique URL for this Creator.", field);
}
