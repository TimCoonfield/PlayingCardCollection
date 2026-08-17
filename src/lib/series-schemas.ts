import { z } from "zod";

const optionalText = (max?: number) => {
  let value = z.string().trim();
  if (max !== undefined) value = value.max(max);
  return value.transform((text) => (text.length > 0 ? text : undefined));
};

const heroImageUrl = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : undefined))
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("/") && !value.startsWith("//")) return true;
      try {
        const url = new URL(value);
        return (
          url.protocol === "https:" &&
          url.hostname.endsWith(".public.blob.vercel-storage.com")
        );
      } catch {
        return false;
      }
    },
    "Use a local asset path or a Vercel Blob image URL"
  );

export const seriesFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  subtitle: optionalText(300),
  attributionLabel: optionalText(80),
  attributionText: optionalText(300),
  description: optionalText(),
  heroImageUrl,
});

export type SeriesFormValues = z.infer<typeof seriesFormSchema>;

export function parseSeriesFormData(formData: FormData) {
  return seriesFormSchema.safeParse({
    name: formData.get("name") ?? "",
    subtitle: formData.get("subtitle") ?? "",
    attributionLabel: formData.get("attributionLabel") ?? "",
    attributionText: formData.get("attributionText") ?? "",
    description: formData.get("description") ?? "",
    heroImageUrl: formData.get("heroImageUrl") ?? "",
  });
}
