import { z } from "zod";
import { COLLECTION_REASON_VALUES } from "@/lib/collection-reasons";
import { uniqueDesignerNames } from "@/lib/designers";

const optionalString = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v.length > 0 ? v : undefined))
  .optional();

const optionalInt = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v.length > 0 ? Number(v) : undefined))
  .pipe(z.number().int().positive().optional());

const optionalBoundedString = (max: number) =>
  z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().max(max))
    .transform((v) => (v.length > 0 ? v : undefined))
    .optional();

// Unlike short catalog fields, editorial text should not be silently rewritten when a Deck is
// saved. An empty field still clears to null, but existing leading/trailing whitespace survives.
const optionalVerbatimText = z
  .string()
  .transform((v) => (v.length > 0 ? v : undefined))
  .optional();

const optionalCollectionReason = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v.length > 0 ? v : undefined))
  .pipe(z.enum(COLLECTION_REASON_VALUES).optional());

export const deckFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    seriesQuery: optionalString,
    seriesId: optionalString,
    newSeriesName: optionalBoundedString(200),
    seriesOrder: optionalInt,
    variantNote: optionalBoundedString(300),
    designerNames: z
      .array(z.string().trim().min(1, "Designer name cannot be blank"))
      .max(20, "A deck can have at most 20 designer credits")
      .transform(uniqueDesignerNames)
      .default([]),
    designerCreatorIds: z.array(z.string().trim()).max(20).default([]),
    newDesignerNames: z.array(z.string().trim()).max(20).default([]),
    producer: optionalString,
    producerCreatorId: optionalString,
    newProducerName: optionalBoundedString(200),
    ownershipStatus: z.string().trim().min(1).default("Owned"),
    qty: z
      .string()
      .transform((v) => (v.trim().length > 0 ? Number(v) : 1))
      .pipe(z.number().int().positive()),
    editionNumbers: z.array(z.coerce.number().int().positive()).default([]),
    productionRun: optionalInt,
    releaseYear: optionalInt,
    collectionReasonPrimary: optionalCollectionReason,
    collectionReasonSecondary: optionalCollectionReason,
    hook: optionalBoundedString(240),
    notes: optionalVerbatimText,
    essay: optionalVerbatimText,
    notesReviewed: z.boolean().default(false),
    catalogNumber: optionalString,
    tags: z.array(z.string()).default([]),
    imageUrls: z.array(z.string().url()).default([]),
  })
  .refine((data) => data.editionNumbers.length <= data.qty, {
    message: "Can't have more editions than quantity",
    path: ["editionNumbers"],
  })
  .refine(
    (data) =>
      data.designerNames.length === data.designerCreatorIds.length &&
      data.designerNames.length === data.newDesignerNames.length,
    {
      message: "Choose each Designer again.",
      path: ["designerNames"],
    }
  )
  .refine(
    (data) =>
      data.designerNames.every((name, index) => {
        const creatorId = data.designerCreatorIds[index];
        const newName = data.newDesignerNames[index];
        return !(creatorId && newName) && Boolean(creatorId || newName === name);
      }),
    {
      message: "Choose an existing Creator or use the Create option for every Designer.",
      path: ["designerNames"],
    }
  )
  .refine((data) => !(data.producerCreatorId && data.newProducerName), {
    message: "Choose an existing Creator or create a new one, not both.",
    path: ["producer"],
  })
  .refine(
    (data) =>
      !data.producer ||
      Boolean(data.producerCreatorId || data.newProducerName === data.producer),
    {
      message: "Choose an existing Creator or use the Create option.",
      path: ["producer"],
    }
  )
  .refine(
    (data) =>
      !data.collectionReasonPrimary ||
      !data.collectionReasonSecondary ||
      data.collectionReasonPrimary !== data.collectionReasonSecondary,
    {
      message: "Primary and secondary reasons must be different",
      path: ["collectionReasonSecondary"],
    }
  )
  .refine((data) => !(data.seriesId && data.newSeriesName), {
    message: "Choose an existing Series or create a new one, not both",
    path: ["seriesId"],
  })
  .refine(
    (data) => !data.seriesQuery || Boolean(data.seriesId || data.newSeriesName),
    {
      message: "Choose an existing Series or use the Create option",
      path: ["seriesId"],
    }
  )
  .refine(
    (data) =>
      !data.newSeriesName ||
      !data.seriesQuery ||
      data.newSeriesName === data.seriesQuery,
    {
      message: "Choose the Create option for the Series name you entered",
      path: ["seriesId"],
    }
  );

export type DeckFormValues = z.infer<typeof deckFormSchema>;

export const ALL_TAGS = [
  "Modern",
  "Vintage",
  "Antique",
  "Gilded",
  "Signed",
  "Mini",
  "Tarot",
  "Prototype",
  "Edge Painted",
] as const;

export function parseDeckFormData(formData: FormData) {
  return deckFormSchema.safeParse({
    name: formData.get("name") ?? "",
    seriesQuery: formData.get("seriesQuery") ?? "",
    seriesId: formData.get("seriesId") ?? "",
    newSeriesName: formData.get("newSeriesName") ?? "",
    seriesOrder: formData.get("seriesOrder") ?? "",
    variantNote: formData.get("variantNote") ?? "",
    designerNames: formData.getAll("designerQueries").map(String),
    designerCreatorIds: formData.getAll("designerCreatorIds").map(String),
    newDesignerNames: formData.getAll("newDesignerNames").map(String),
    producer: formData.get("producerQuery") ?? "",
    producerCreatorId: formData.get("producerCreatorId") ?? "",
    newProducerName: formData.get("newProducerName") ?? "",
    ownershipStatus: formData.get("ownershipStatus") || "Owned",
    qty: formData.get("qty") ?? "",
    editionNumbers: formData.getAll("editionNumbers").map(String),
    productionRun: formData.get("productionRun") ?? "",
    releaseYear: formData.get("releaseYear") ?? "",
    collectionReasonPrimary: formData.get("collectionReasonPrimary") ?? "",
    collectionReasonSecondary: formData.get("collectionReasonSecondary") ?? "",
    hook: formData.get("hook") ?? "",
    notes: formData.get("notes") ?? "",
    essay: formData.get("essay") ?? "",
    notesReviewed: formData.has("notesReviewed"),
    catalogNumber: formData.get("catalogNumber") ?? "",
    tags: formData.getAll("tags").map(String),
    imageUrls: formData.getAll("imageUrls").map(String),
  });
}
