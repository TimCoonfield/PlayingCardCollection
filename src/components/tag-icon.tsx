export type TagIconName =
  | "tarot"
  | "mini"
  | "prototype"
  | "signed"
  | "antique"
  | "vintage"
  | "gilded"
  | "edge-painted";

export function TagIcon({
  icon,
  fallback = "deck",
  className,
}: {
  icon: TagIconName | null;
  fallback?: "deck" | "coin";
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
      {icon === "tarot" && (
        <>
          <path d="M7 17.5h10M8.5 21h7" />
          <path d="M9 17.5c0-2-2.5-3.4-2.5-6.5a5.5 5.5 0 0 1 11 0c0 3.1-2.5 4.5-2.5 6.5" />
          <path d="m12 7 .7 1.5 1.6.2-1.2 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1.1 1.6-.2L12 7Z" />
        </>
      )}
      {icon === "mini" && (
        <>
          <rect x="5" y="4" width="10" height="14" rx="1.5" />
          <path d="m14.5 16.5 4.5 4.5M8 8h4M8 11h3" />
        </>
      )}
      {icon === "prototype" && (
        <>
          <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
          <path d="M7.5 15h9M9.5 12.5h5" />
        </>
      )}
      {icon === "signed" && (
        <>
          <path d="M5 19c3-1 4.5-3.5 6.5-6.5L18 4l2 2-8.5 6.5L8 14l-1.5 3.5L5 19Z" />
          <path d="M4 21c3-1 5-.4 7 .2 2 .6 4 .9 9-.7" />
        </>
      )}
      {icon === "antique" && (
        <>
          <circle cx="12" cy="13" r="7.5" />
          <path d="M9.5 3h5M12 3v2.5M12 9v4l2.5 1.5M17.5 7.5 19 6" />
        </>
      )}
      {icon === "vintage" && (
        <>
          <rect x="3.5" y="7" width="17" height="12" rx="2" />
          <path d="m7 7 8-4M7 11h7v5H7z" />
          <circle cx="17.5" cy="11.5" r="1" />
          <path d="M16.5 15h2" />
        </>
      )}
      {icon === "gilded" && (
        <>
          <path d="M12 2.5 13.4 8l4.1 1.5-4.1 1.5L12 16.5 10.6 11 6.5 9.5 10.6 8 12 2.5Z" />
          <path d="m18.5 14 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
          <path d="m5 15 .5 1.5L7 17l-1.5.5L5 19l-.5-1.5L3 17l1.5-.5L5 15Z" />
        </>
      )}
      {icon === "edge-painted" && (
        <>
          <path d="m14.5 4 5.5 5.5-8.5 8.5-6 1.5 1.5-6L14.5 4Z" />
          <path d="m12.5 6 5.5 5.5M5.5 19.5 3 22" />
        </>
      )}
      {!icon && fallback === "deck" && (
        <path d="M12 3C10 7 5.5 9 5.5 13a4 4 0 0 0 7 2.6V19H9v2h6v-2h-3.5v-3.4a4 4 0 0 0 7-2.6C18.5 9 14 7 12 3Z" />
      )}
      {!icon && fallback === "coin" && (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="5.5" />
          <path d="M12 8.5v7M9.5 12h5" />
        </>
      )}
    </svg>
  );
}
