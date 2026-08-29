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
        return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com");
      } catch {
        return false;
      }
    },
    "Use a local asset path or a Vercel Blob image URL"
  );

export const creatorFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  displayName: optionalText(240),
  tagline: optionalText(300),
  description: optionalText(),
  heroImageUrl,
  favorite: z.boolean().default(false),
});

export function parseCreatorFormData(formData: FormData) {
  return creatorFormSchema.safeParse({
    name: formData.get("name") ?? "",
    displayName: formData.get("displayName") ?? "",
    tagline: formData.get("tagline") ?? "",
    description: formData.get("description") ?? "",
    heroImageUrl: formData.get("heroImageUrl") ?? "",
    favorite: formData.has("favorite"),
  });
}
