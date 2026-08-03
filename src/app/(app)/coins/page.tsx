import { redirect } from "next/navigation";

export default async function CoinsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (key === "type") continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else if (value) {
      params.set(key, value);
    }
  }
  params.set("type", "coin");
  redirect(`/collection?${params.toString()}`);
}
