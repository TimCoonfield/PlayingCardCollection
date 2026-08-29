import type { Metadata } from "next";
import { Geist, Geist_Mono, Spectral } from "next/font/google";
import { ArchiveSpotlight } from "@/components/archive-spotlight";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SOCIAL_IMAGE,
  WEBSITE_JSON_LD_REFERENCE,
  serializeJsonLd,
} from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spectral = Spectral({
  variable: "--font-spectral",
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    title: SITE_NAME,
    description: DEFAULT_SITE_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_SITE_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
};

const WEBSITE_JSON_LD = {
  "@context": "https://schema.org",
  ...WEBSITE_JSON_LD_REFERENCE,
  description: DEFAULT_SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(WEBSITE_JSON_LD) }}
        />
        <ArchiveSpotlight />
        {children}
      </body>
    </html>
  );
}
