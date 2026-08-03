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

export const coinFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  series: optionalString,
  designer: optionalString,
  producer: optionalString,
  material: optionalString,
  ownershipStatus: z.string().trim().min(1).default("Owned"),
  qty: z
    .string()
    .transform((v) => (v.trim().length > 0 ? Number(v) : 1))
    .pipe(z.number().int().positive()),
  releaseYear: optionalInt,
  notes: optionalString,
  catalogNumber: optionalString,
  tags: z.array(z.string()).default([]),
  imageUrls: z.array(z.string().url()).default([]),
});

export type CoinFormValues = z.infer<typeof coinFormSchema>;

export const COIN_TAGS = [
  "Modern",
  "Vintage",
  "Antique",
  "Gilded",
  "Signed",
  "Prototype",
] as const;

export function parseCoinFormData(formData: FormData) {
  return coinFormSchema.safeParse({
    name: formData.get("name") ?? "",
    series: formData.get("series") ?? "",
    designer: formData.get("designer") ?? "",
    producer: formData.get("producer") ?? "",
    material: formData.get("material") ?? "",
    ownershipStatus: formData.get("ownershipStatus") || "Owned",
    qty: formData.get("qty") ?? "",
    releaseYear: formData.get("releaseYear") ?? "",
    notes: formData.get("notes") ?? "",
    catalogNumber: formData.get("catalogNumber") ?? "",
    tags: formData.getAll("tags").map(String),
    imageUrls: formData.getAll("imageUrls").map(String),
  });
}
