import { SITE_URL } from "@/lib/site";
import type { MetadataRoute } from "next";

const AI_TRAINING_CRAWLERS = [
  "Amazonbot",
  "Bytespider",
  "CCBot",
  "ClaudeBot",
  "Google-Extended",
  "GPTBot",
  "meta-externalagent",
  "meta-externalfetcher",
];

export default function robots(): MetadataRoute.Robots {
  return {
    sitemap: `${SITE_URL}/sitemap.xml`,
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: AI_TRAINING_CRAWLERS, disallow: "/" },
    ],
  };
}
