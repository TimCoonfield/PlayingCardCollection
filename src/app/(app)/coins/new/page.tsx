import { prisma } from "@/lib/prisma";
import { CoinForm } from "@/components/coin-form";
import { createCoin } from "../actions";

export default async function NewCoinPage() {
  const [designers, producers] = await Promise.all([
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-felt-ink">Add Coin</h1>
      <CoinForm
        action={createCoin}
        designers={designers.map((d) => d.designer!).filter(Boolean)}
        producers={producers.map((p) => p.producer!).filter(Boolean)}
        submitLabel="Save coin"
      />
    </div>
  );
}
