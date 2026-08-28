import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MissingYearsWorkbench } from "@/components/missing-years-workbench";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Decks Missing a Year",
  robots: { index: false, follow: false },
};

export default async function MissingYearsPage() {
  const session = await getSession();
  if (!session.authenticated) redirect("/login?from=/decks/missing-years");

  const decks = await prisma.deck.findMany({
    where: { releaseYear: null },
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      series: { select: { name: true } },
      producer: true,
      designers: {
        orderBy: { sortOrder: "asc" },
        select: { designer: { select: { name: true } } },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass">Catalog workbench</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-felt-ink">Decks Missing a Year</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-felt-sub">
          Enter a four-digit launch year and move to the next field. Each value saves automatically
          when you click away or press Enter.
        </p>
      </div>

      <MissingYearsWorkbench
        initialDecks={decks.map((deck) => ({
          ...deck,
          series: deck.series?.name ?? null,
          designers: deck.designers.map(({ designer }) => designer.name),
        }))}
      />
    </div>
  );
}
