import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoinPageData } from "@/lib/coin-data";
import { CoinGallery } from "@/components/coin-gallery";
import { BackLink } from "@/components/back-link";
import { CoinTagChip } from "@/components/coin-tag-chip";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { MarkdownNote } from "@/components/markdown-note";
import { getSession } from "@/lib/auth";
import { deleteCoin } from "../actions";
import { SITE_URL } from "@/lib/site";
import {
  WEBSITE_JSON_LD_REFERENCE,
  breadcrumbJsonLd,
  buildPageMetadata,
  serializeJsonLd,
} from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const coin = await getCoinPageData(id);
  if (!coin) return { title: "Coin Not Found" };

  const credit = [coin.designer, coin.producer].filter(Boolean).join(" / ");
  const description = coin.notes ?? [coin.name, credit, coin.releaseYear].filter(Boolean).join(" — ");
  const image = coin.obverseImageUrl ?? coin.reverseImageUrl ?? undefined;

  return buildPageMetadata({
    title: coin.name,
    description,
    path: `/coins/${coin.id}`,
    image,
    imageAlt: `${coin.name} collector coin`,
    keywords: ["collector coin", ...coin.tags],
  });
}

export default async function CoinDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [coin, session] = await Promise.all([
    getCoinPageData(id),
    getSession(),
  ]);

  if (!coin) notFound();

  const isAuthenticated = Boolean(session.authenticated);
  const deleteCoinWithId = deleteCoin.bind(null, coin.id);
  const galleryImages = [coin.obverseImageUrl, coin.reverseImageUrl]
    .filter((url): url is string => Boolean(url))
    .map((url) => ({ url }));

  const coinUrl = `${SITE_URL}/coins/${coin.id}`;
  const additionalProperty = [
    coin.qty > 1
      ? { "@type": "PropertyValue", name: "Copies in collection", value: coin.qty }
      : null,
    coin.ownershipStatus
      ? { "@type": "PropertyValue", name: "Ownership status", value: coin.ownershipStatus }
      : null,
  ].filter(Boolean);
  const coinJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${coinUrl}#webpage`,
        url: coinUrl,
        name: coin.name,
        description: coin.notes ?? undefined,
        isPartOf: WEBSITE_JSON_LD_REFERENCE,
        mainEntity: { "@id": `${coinUrl}#coin` },
        primaryImageOfPage: galleryImages[0]
          ? { "@type": "ImageObject", url: galleryImages[0].url }
          : undefined,
        breadcrumb: { "@id": `${coinUrl}#breadcrumb` },
        dateModified: coin.updatedAt.toISOString(),
      },
      {
        "@type": "CreativeWork",
        "@id": `${coinUrl}#coin`,
        name: coin.name,
        url: coinUrl,
        mainEntityOfPage: { "@id": `${coinUrl}#webpage` },
        description: coin.notes ?? undefined,
        image: galleryImages.map((image) => image.url),
        genre: "Collector coin",
        creator: coin.designer ? { "@type": "Person", name: coin.designer } : undefined,
        producer: coin.producer
          ? {
              "@type": coin.producer === coin.designer ? "Person" : "Organization",
              name: coin.producer,
            }
          : undefined,
        creditText: [coin.designer, coin.producer].filter(Boolean).join(" / ") || undefined,
        datePublished: coin.releaseYear ? String(coin.releaseYear) : undefined,
        material: coin.material ?? undefined,
        size: coin.diameter ?? undefined,
        keywords: coin.tags.length > 0 ? coin.tags : undefined,
        identifier: coin.catalogNumber
          ? {
              "@type": "PropertyValue",
              propertyID: "Card Guy Archive catalog number",
              value: coin.catalogNumber,
            }
          : undefined,
        isPartOf: coin.series
          ? { "@type": "CreativeWorkSeries", name: coin.series }
          : undefined,
        additionalProperty: additionalProperty.length > 0 ? additionalProperty : undefined,
      },
      breadcrumbJsonLd(
        [
          { name: "Collection", path: "/collection" },
          { name: "Coins", path: "/collection?type=coin" },
          { name: coin.name, path: `/coins/${coin.id}` },
        ],
        `/coins/${coin.id}`
      ),
    ],
  };

  return (
    <div className="flex flex-col gap-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(coinJsonLd) }}
      />
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
              <ConfirmSubmitButton
                confirmMessage={`Delete "${coin.name}"? This can't be undone.`}
                ariaLabel="Delete coin"
                title="Delete"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-brick/50 text-brick transition-colors hover:bg-brick/10"
              >
                <TrashIcon className="h-4 w-4" />
              </ConfirmSubmitButton>
            </form>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <CoinGallery images={galleryImages} tags={coin.tags} coinName={coin.name} />

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

          {(coin.designer || coin.producer || coin.material || coin.diameter || coin.releaseYear) && (
            <div className="flex flex-col divide-y divide-felt-line rounded-lg border border-felt-line bg-felt-surface">
              {coin.designer && (
                <CreditRow
                  label="Designer"
                  value={coin.designer}
                  href={
                    coin.designerCreator
                      ? `/creators/${coin.designerCreator.slug}`
                      : `/collection?designer=${encodeURIComponent(coin.designer)}`
                  }
                />
              )}
              {coin.producer && (
                <CreditRow
                  label="Producer"
                  value={coin.producer}
                  href={
                    coin.producerCreator
                      ? `/creators/${coin.producerCreator.slug}`
                      : `/collection?producer=${encodeURIComponent(coin.producer)}`
                  }
                />
              )}
              {coin.material && <CreditRow label="Material" value={coin.material} />}
              {coin.diameter && <CreditRow label="Diameter" value={coin.diameter} />}
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
              <MarkdownNote>{coin.notes}</MarkdownNote>
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
      <span className="truncate font-display text-base font-medium text-felt-ink group-hover:text-brass">
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
