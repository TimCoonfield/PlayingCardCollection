import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CoinGallery } from "@/components/coin-gallery";
import { BackLink } from "@/components/back-link";
import { CoinTagChip } from "@/components/coin-tag-chip";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { getSession } from "@/lib/auth";
import { deleteCoin } from "../actions";

export default async function CoinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [coin, session] = await Promise.all([
    prisma.coin.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    }),
    getSession(),
  ]);

  if (!coin) notFound();

  const isAuthenticated = Boolean(session.authenticated);
  const deleteCoinWithId = deleteCoin.bind(null, coin.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <BackLink fallbackHref="/coins">← Back to coins</BackLink>
        {isAuthenticated && (
          <div className="flex gap-2">
            <Link
              href={`/coins/${coin.id}/edit`}
              aria-label="Edit coin"
              title="Edit"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-brass/50 text-brass transition-colors hover:bg-brass/10"
            >
              <PencilIcon className="h-4 w-4" />
            </Link>
            <form
              action={async () => {
                "use server";
                await deleteCoinWithId();
              }}
            >
              <button
                type="submit"
                aria-label="Delete coin"
                title="Delete"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brick/50 text-brick transition-colors hover:bg-brick/10"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <CoinGallery images={coin.images} tags={coin.tags} coinName={coin.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            {coin.series && (
              <Link
                href={`/coins?series=${encodeURIComponent(coin.series)}`}
                className="text-sm text-felt-sub hover:text-brass"
              >
                {coin.series}
              </Link>
            )}
            <div className="flex items-center gap-2.5">
              <h1 className="font-display text-3xl font-semibold text-felt-ink">{coin.name}</h1>
              {coin.qty > 1 && (
                <span className="rounded-full bg-felt-surface px-2 py-0.5 text-xs font-medium text-felt-sub">
                  ×{coin.qty}
                </span>
              )}
            </div>
          </div>

          {(coin.designer || coin.producer || coin.material || coin.releaseYear) && (
            <div className="flex flex-col divide-y divide-felt-line rounded-lg border border-felt-line bg-felt-surface">
              {coin.designer && (
                <CreditRow
                  label="Designer"
                  value={coin.designer}
                  href={`/coins?designer=${encodeURIComponent(coin.designer)}`}
                />
              )}
              {coin.producer && (
                <CreditRow
                  label="Producer"
                  value={coin.producer}
                  href={`/coins?producer=${encodeURIComponent(coin.producer)}`}
                />
              )}
              {coin.material && <CreditRow label="Material" value={coin.material} />}
              {coin.releaseYear && <CreditRow label="Release year" value={String(coin.releaseYear)} />}
            </div>
          )}

          {coin.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {coin.tags.map((tag) => (
                <CoinTagChip key={tag} tag={tag} />
              ))}
            </div>
          )}

          {coin.catalogNumber && (
            <p className="text-xs text-felt-sub">
              <span className="uppercase tracking-wide text-felt-sub/70">Catalog #</span>{" "}
              {coin.catalogNumber}
            </p>
          )}

          {coin.notes && (
            <div className="rounded-lg border border-felt-line bg-felt-surface p-4">
              <h2 className="mb-1 text-xs font-medium uppercase tracking-wide text-felt-sub/70">
                Notes
              </h2>
              <p className="whitespace-pre-wrap text-sm text-felt-sub">{coin.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CreditRow({ label, value, href }: { label: string; value: string; href?: string }) {
  const content = (
    <>
      <span className="text-xs uppercase tracking-wide text-felt-sub/70">{label}</span>
      <span className="truncate text-sm font-medium text-felt-ink group-hover:text-brass">
        {value}
      </span>
    </>
  );

  if (!href) {
    return <div className="flex items-center justify-between gap-3 px-4 py-3">{content}</div>;
  }

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-felt-surface-2"
    >
      {content}
    </Link>
  );
}
