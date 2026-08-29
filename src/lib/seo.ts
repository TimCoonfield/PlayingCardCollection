import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const DEFAULT_SITE_DESCRIPTION =
  "A visual archive of a personal playing card and coin collection — decks, series, creators, and the stories behind them.";

export const DEFAULT_SOCIAL_IMAGE = {
  url: "/images/home/archive-hero-desktop.webp",
  width: 1042,
  height: 746,
  alt: "The Card Guy Archive displayed with playing cards and collector coins",
};

export interface PageMetadataOptions {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  imageAlt?: string;
  keywords?: string[];
  noIndex?: boolean;
}

export function buildPageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  keywords,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const socialImage = image
    ? { url: image, alt: imageAlt ?? title }
    : DEFAULT_SOCIAL_IMAGE;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    robots: noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description,
      url: path,
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export const WEBSITE_JSON_LD_REFERENCE = {
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: SITE_URL,
};

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
  idPath: string
) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${SITE_URL}${idPath}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function creativeWorkListItem(
  item: { id: string; name: string },
  index: number,
  kind: "deck" | "coin" = "deck"
) {
  const path = kind === "deck" ? `/decks/${item.id}` : `/coins/${item.id}`;
  return {
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "CreativeWork",
      "@id": `${SITE_URL}${path}#${kind}`,
      name: item.name,
      url: `${SITE_URL}${path}`,
    },
  };
}
