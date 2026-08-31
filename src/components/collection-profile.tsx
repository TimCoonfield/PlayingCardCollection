import Link from "next/link";
import { TagIcon } from "@/components/tag-icon";
import {
  COLLECTION_REASON_DETAILS,
  type CollectionReasonValue,
} from "@/lib/collection-reasons";
import { getTagStyle } from "@/lib/placeholders";

const TAG_ACCENT_CLASSES: Record<string, string> = {
  plum: "border-plum/40 bg-plum/10 text-plum hover:bg-plum/20",
  brass: "border-brass/40 bg-brass/10 text-brass hover:bg-brass/20",
  sage: "border-sage/40 bg-sage/10 text-sage hover:bg-sage/20",
  brick: "border-brick/40 bg-brick/10 text-brick hover:bg-brick/20",
  "felt-ink": "border-felt-ink/30 bg-felt-ink/10 text-felt-ink hover:bg-felt-ink/15",
};

const CLASSIFICATION_DESCRIPTIONS: Record<string, string> = {
  Modern: "This deck is categorized as a modern-era release.",
  Vintage: "This deck is categorized as vintage rather than modern or antique.",
  Antique: "This deck is categorized as antique because of its historical age.",
  Gilded: "This deck has gilded card edges.",
  Signed: "This copy includes a creator or producer signature.",
  Mini: "This deck uses a miniature format.",
  Tarot: "This deck uses a tarot format or structure.",
  Prototype: "This deck is a prototype, proof, or pre-production piece.",
  "Edge Painted": "This deck has painted or otherwise decorated card edges.",
};

export function CollectionProfile({
  collectionReasons,
  tags,
}: {
  collectionReasons: CollectionReasonValue[];
  tags: string[];
}) {
  if (collectionReasons.length === 0 && tags.length === 0) return null;

  return (
    <section
      className="relative flex items-center justify-between gap-3 px-4 py-3"
      aria-labelledby="collection-profile-heading"
    >
      <h2
        id="collection-profile-heading"
        className="text-xs uppercase tracking-wide text-felt-sub/70"
      >
        Collection profile
      </h2>
      <div className="flex flex-wrap justify-end gap-2">
        {collectionReasons.map((reason) => {
          const details = COLLECTION_REASON_DETAILS[reason];

          return (
            <ProfileIconLink
              key={reason}
              href={`/collection?reason=${reason}`}
              label={`Why it’s here: ${details.label}`}
              description={details.description}
              accentClass="border-brass/40 bg-brass/10 text-brass hover:bg-brass/20"
            >
              <CollectionReasonIcon reason={reason} className="h-4 w-4" />
            </ProfileIconLink>
          );
        })}

        {tags.map((tag) => {
          const style = getTagStyle(tag);
          const accentClass = TAG_ACCENT_CLASSES[style.accent] ?? TAG_ACCENT_CLASSES.brass;
          const description =
            CLASSIFICATION_DESCRIPTIONS[tag] ??
            `This deck carries the ${tag} classification in the archive.`;

          return (
            <ProfileIconLink
              key={tag}
              href={`/collection?tag=${encodeURIComponent(tag)}`}
              label={`Classification: ${tag}`}
              description={description}
              accentClass={accentClass}
            >
              <TagIcon icon={style.icon} className="h-4 w-4" />
            </ProfileIconLink>
          );
        })}
      </div>
    </section>
  );
}

function ProfileIconLink({
  href,
  label,
  description,
  accentClass,
  children,
}: {
  href: string;
  label: string;
  description: string;
  accentClass: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={`${label}. ${description}`}
      className={`group/profile inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${accentClass}`}
    >
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none invisible absolute bottom-[calc(100%+0.5rem)] right-3 z-30 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-felt-line bg-felt-bg p-3 text-left opacity-0 shadow-lg transition-opacity group-focus-visible/profile:visible group-focus-visible/profile:opacity-100 group-hover/profile:visible group-hover/profile:opacity-100"
      >
        <span className="block font-display text-sm font-semibold text-felt-ink">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-felt-sub">{description}</span>
      </span>
    </Link>
  );
}

function CollectionReasonIcon({
  reason,
  className,
}: {
  reason: CollectionReasonValue;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {reason === "ARTISTRY" && (
        <>
          <path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 2-1.8 0-1.1-1.2-1.6-1.2-2.7 0-.9.7-1.5 1.6-1.5H16a4 4 0 0 0 4-4c0-4.4-3.6-8-8-8Z" />
          <circle cx="7.5" cy="10.5" r=".8" fill="currentColor" stroke="none" />
          <circle cx="10" cy="7" r=".8" fill="currentColor" stroke="none" />
          <circle cx="14.2" cy="7" r=".8" fill="currentColor" stroke="none" />
          <circle cx="16.5" cy="10.5" r=".8" fill="currentColor" stroke="none" />
        </>
      )}
      {reason === "CRAFT" && (
        <>
          <path d="m14 4 6 6-3 3-6-6 3-3Z" />
          <path d="m13 10-8.5 8.5a1.8 1.8 0 0 0 2.5 2.5l8.5-8.5" />
        </>
      )}
      {reason === "LORE" && (
        <>
          <path d="M4 5.5c3-.7 5.7 0 8 2v12c-2.3-2-5-2.7-8-2V5.5Z" />
          <path d="M20 5.5c-3-.7-5.7 0-8 2v12c2.3-2 5-2.7 8-2V5.5Z" />
          <path d="m17 2 .5 1.4L19 4l-1.5.6L17 6l-.5-1.4L15 4l1.5-.6L17 2Z" />
        </>
      )}
      {reason === "HISTORY" && (
        <>
          <path d="m3 9 9-5 9 5M5 10h14M6 10v8M10 10v8M14 10v8M18 10v8M4 18h16M3 21h18" />
        </>
      )}
      {reason === "RARITY" && (
        <>
          <path d="m7 4-4 6 9 10 9-10-4-6H7Z" />
          <path d="m3 10 9 2 9-2M7 4l5 8 5-8" />
        </>
      )}
      {reason === "ACQUISITION" && (
        <>
          <circle cx="8" cy="15" r="4" />
          <path d="m11 12 8-8 2 2-2 2 1.5 1.5-2.5 2.5-1.5-1.5-3 3" />
        </>
      )}
      {reason === "COMPLETION" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="m7.5 12 3 3 6-7" />
        </>
      )}
      {reason === "VOLUME" && (
        <>
          <path d="m12 4 8 4.5-8 4.5-8-4.5L12 4Z" />
          <path d="m4 13 8 4.5 8-4.5M4 17.5 12 22l8-4.5" />
        </>
      )}
      {reason === "PERSONAL" && (
        <path d="M12 20.3s-7.6-4.5-10-9.2C.5 7.7 2.4 4.4 5.9 4c2-.2 3.9.8 4.9 2.4 1.1-1.7 3.1-2.7 5.1-2.4 3.5.4 5.4 3.7 3.9 7.1-2.4 4.7-9.8 9.2-9.8 9.2Z" />
      )}
    </svg>
  );
}
