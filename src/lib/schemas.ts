import { z } from "zod";

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

export const deckFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required"),
    series: optionalString,
    designer: optionalString,
    producer: optionalString,
    ownershipStatus: z.string().trim().min(1).default("Owned"),
    qty: z
      .string()
      .transform((v) => (v.trim().length > 0 ? Number(v) : 1))
      .pipe(z.number().int().positive()),
    editionNumbers: z.array(z.coerce.number().int().positive()).default([]),
    productionRun: optionalInt,
    releaseYear: optionalInt,
    notes: optionalString,
    catalogNumber: optionalString,
    tags: z.array(z.string()).default([]),
    imageUrls: z.array(z.string().url()).default([]),
  })
  .refine((data) => data.editionNumbers.length <= data.qty, {
    message: "Can't have more editions than quantity",
    path: ["editionNumbers"],
  });

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
  "Souvenir",
] as const;

export function parseDeckFormData(formData: FormData) {
  return deckFormSchema.safeParse({
    name: formData.get("name") ?? "",
    series: formData.get("series") ?? "",
    designer: formData.get("designer") ?? "",
    producer: formData.get("producer") ?? "",
    ownershipStatus: formData.get("ownershipStatus") || "Owned",
    qty: formData.get("qty") ?? "",
    editionNumbers: formData.getAll("editionNumbers").map(String),
    productionRun: formData.get("productionRun") ?? "",
    releaseYear: formData.get("releaseYear") ?? "",
    notes: formData.get("notes") ?? "",
    catalogNumber: formData.get("catalogNumber") ?? "",
    tags: formData.getAll("tags").map(String),
    imageUrls: formData.getAll("imageUrls").map(String),
  });
}
