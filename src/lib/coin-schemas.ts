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

const optionalUrl = z
  .string()
  .transform((v) => v.trim())
  .transform((v) => (v.length > 0 ? v : undefined))
  .pipe(z.string().url().optional());

export const coinFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  series: optionalString,
  designer: optionalString,
  designerCreatorId: optionalString,
  newDesignerName: optionalString,
  producer: optionalString,
  producerCreatorId: optionalString,
  newProducerName: optionalString,
  material: optionalString,
  diameter: optionalString,
  ownershipStatus: z.string().trim().min(1).default("Owned"),
  qty: z
    .string()
    .transform((v) => (v.trim().length > 0 ? Number(v) : 1))
    .pipe(z.number().int().positive()),
  releaseYear: optionalInt,
  notes: optionalString,
  catalogNumber: optionalString,
  tags: z.array(z.string()).default([]),
  obverseImageUrl: optionalUrl,
  reverseImageUrl: optionalUrl,
})
  .refine((data) => !(data.designerCreatorId && data.newDesignerName), {
    message: "Choose an existing Creator or create a new one, not both.",
    path: ["designer"],
  })
  .refine(
    (data) =>
      !data.designer ||
      Boolean(data.designerCreatorId || data.newDesignerName === data.designer),
    {
      message: "Choose an existing Creator or use the Create option.",
      path: ["designer"],
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
  );

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
    designer: formData.get("designerQuery") ?? "",
    designerCreatorId: formData.get("designerCreatorId") ?? "",
    newDesignerName: formData.get("newDesignerName") ?? "",
    producer: formData.get("producerQuery") ?? "",
    producerCreatorId: formData.get("producerCreatorId") ?? "",
    newProducerName: formData.get("newProducerName") ?? "",
    material: formData.get("material") ?? "",
    diameter: formData.get("diameter") ?? "",
    ownershipStatus: formData.get("ownershipStatus") || "Owned",
    qty: formData.get("qty") ?? "",
    releaseYear: formData.get("releaseYear") ?? "",
    notes: formData.get("notes") ?? "",
    catalogNumber: formData.get("catalogNumber") ?? "",
    tags: formData.getAll("tags").map(String),
    obverseImageUrl: formData.get("obverseImageUrl") ?? "",
    reverseImageUrl: formData.get("reverseImageUrl") ?? "",
  });
}
