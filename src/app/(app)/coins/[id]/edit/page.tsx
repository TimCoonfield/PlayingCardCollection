import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CoinForm } from "@/components/coin-form";
import { updateCoin } from "../../actions";

export const metadata: Metadata = {
  title: "Edit Coin",
  robots: { index: false, follow: false },
};

export default async function EditCoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [coin, creators] = await Promise.all([
    prisma.coin.findUnique({
      where: { id },
      include: { designerCreator: true, producerCreator: true },
    }),
    prisma.creator.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  if (!coin) notFound();

  const updateCoinWithId = updateCoin.bind(null, coin.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-felt-ink">Edit Coin</h1>
      <CoinForm
        action={updateCoinWithId}
        defaultValues={{
          name: coin.name,
          series: coin.series ?? undefined,
          designerCreator: coin.designerCreator
            ? { id: coin.designerCreator.id, name: coin.designerCreator.name }
            : undefined,
          producerCreator: coin.producerCreator
            ? { id: coin.producerCreator.id, name: coin.producerCreator.name }
            : undefined,
          material: coin.material ?? undefined,
          diameter: coin.diameter ?? undefined,
          qty: coin.qty,
          releaseYear: coin.releaseYear,
          notes: coin.notes ?? undefined,
          catalogNumber: coin.catalogNumber ?? undefined,
          tags: coin.tags,
        }}
        initialObverseUrl={coin.obverseImageUrl ?? undefined}
        initialReverseUrl={coin.reverseImageUrl ?? undefined}
        creators={creators}
        submitLabel="Save changes"
      />
    </div>
  );
}
