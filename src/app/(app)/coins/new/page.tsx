import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CoinForm } from "@/components/coin-form";
import { createCoin } from "../actions";

export const metadata: Metadata = {
  title: "Add Coin",
  robots: { index: false, follow: false },
};

export default async function NewCoinPage() {
  const creators = await prisma.creator.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-xl font-semibold text-felt-ink">Add Coin</h1>
      <CoinForm
        action={createCoin}
        creators={creators}
        submitLabel="Save coin"
      />
    </div>
  );
}
