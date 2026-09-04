import Image from "next/image";

const SUITS = ["♠", "♥", "♣", "♦"] as const;

const MINOR_WORDS = new Set([
  "a",
  "an",
  "and",
  "at",
  "by",
  "de",
  "del",
  "di",
  "for",
  "in",
  "la",
  "le",
  "of",
  "on",
  "the",
  "to",
  "with",
]);

function stableIndex(value: string, length: number) {
  let hash = 2_166_136_261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0) % length;
}

function getMonogram(value: string) {
  const words = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return getInitial(words[0]);

  const majorWords = words.filter((word) => !MINOR_WORDS.has(normalizeWord(word)));
  const monogramWords = (majorWords.length > 0 ? majorWords : words).slice(0, 2);
  return monogramWords.map(getInitial).join("");
}

function normalizeWord(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
}

function getInitial(value: string) {
  return value.match(/[\p{L}\p{N}]/u)?.[0]?.toLocaleUpperCase() ?? "?";
}

export function ProfileModalFallback({ title, seed }: { title: string; seed: string }) {
  const suit = SUITS[stableIndex(seed, SUITS.length)];

  return (
    <div className="profile-modal-fallback absolute inset-0" aria-hidden="true">
      <div className="absolute left-1/2 top-[42%] h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass/35 sm:h-56 sm:w-56" />
      <div className="absolute left-1/2 top-[42%] h-36 w-36 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-felt-ink/15 sm:h-44 sm:w-44" />
      <span className="absolute left-5 top-4 font-display text-3xl text-brass/45 sm:left-7 sm:top-6 sm:text-4xl">
        {suit}
      </span>
      <span className="absolute bottom-4 right-5 rotate-180 font-display text-3xl text-brass/45 sm:bottom-6 sm:right-7 sm:text-4xl">
        {suit}
      </span>
      <span className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 font-display text-6xl font-semibold tracking-[-0.06em] text-felt-ink/85 sm:text-7xl">
        {getMonogram(title)}
      </span>
    </div>
  );
}

export function ProfileHeaderWatermark({ title, seed }: { title: string; seed: string }) {
  const suit = SUITS[stableIndex(seed, SUITS.length)];

  return (
    <div
      className="pointer-events-none absolute right-[7%] top-1/2 hidden h-32 w-32 -translate-y-1/2 place-items-center rounded-full border border-brass/20 text-felt-ink/[0.08] sm:grid lg:h-40 lg:w-40"
      aria-hidden="true"
    >
      <div className="absolute inset-3 rotate-45 border border-felt-ink/[0.06] lg:inset-4" />
      <div className="absolute inset-[34%] rounded-full border border-brass/15" />
      <span className="font-display text-5xl font-semibold tracking-[-0.08em] lg:text-6xl">
        {getMonogram(title)}
      </span>
      <span className="absolute -left-5 top-1/2 -translate-y-1/2 font-display text-2xl text-brass/20">
        {suit}
      </span>
      <span className="absolute -right-5 top-1/2 -translate-y-1/2 rotate-180 font-display text-2xl text-brass/20">
        {suit}
      </span>
    </div>
  );
}

export function ProfileHeaderArtwork({
  title,
  seed,
  heroImageUrl,
}: {
  title: string;
  seed: string;
  heroImageUrl?: string | null;
}) {
  if (!heroImageUrl) {
    return <ProfileHeaderWatermark title={title} seed={seed} />;
  }

  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 w-[70%] overflow-hidden bg-felt-header opacity-70 sm:w-[58%] sm:opacity-85 lg:w-[48%] lg:opacity-100"
      aria-hidden="true"
    >
      <Image
        src={heroImageUrl}
        alt=""
        fill
        sizes="(max-width: 639px) 70vw, (max-width: 1023px) 58vw, 48vw"
        className="object-cover"
        unoptimized={heroImageUrl.startsWith("/")}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, var(--felt-surface) 0%, color-mix(in srgb, var(--felt-surface) 92%, transparent) 18%, color-mix(in srgb, var(--felt-surface) 25%, transparent) 58%, color-mix(in srgb, var(--felt-header) 8%, transparent) 100%), linear-gradient(0deg, color-mix(in srgb, var(--felt-header) 40%, transparent), transparent 64%)",
        }}
      />
    </div>
  );
}
