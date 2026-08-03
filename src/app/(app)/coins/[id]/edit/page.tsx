import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CoinForm } from "@/components/coin-form";
import { updateCoin } from "../../actions";

export default async function EditCoinPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [coin, designers, producers] = await Promise.all([
    prisma.coin.findUnique({ where: { id } }),
    prisma.coin.findMany({
      distinct: ["designer"],
      where: { designer: { not: null } },
      select: { designer: true },
      orderBy: { designer: "asc" },
    }),
    prisma.coin.findMany({
      distinct: ["producer"],
      where: { producer: { not: null } },
      select: { producer: true },
      orderBy: { producer: "asc" },
    }),
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
          designer: coin.designer ?? undefined,
          producer: coin.producer ?? undefined,
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
        designers={designers.map((d) => d.designer!).filter(Boolean)}
        producers={producers.map((p) => p.producer!).filter(Boolean)}
        submitLabel="Save changes"
      />
    </div>
  );
}
