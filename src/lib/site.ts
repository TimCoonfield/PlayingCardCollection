// Vercel sets these automatically at build/runtime — no manual env var to configure.
// Falls back to localhost for local dev, where metadata/JSON-LD URLs are never actually crawled.
const rawHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL ?? "localhost:3000";
const protocol = rawHost.startsWith("localhost") ? "http" : "https";

export const SITE_URL = `${protocol}://${rawHost}`;
export const SITE_NAME = "Card Guy Archive";
