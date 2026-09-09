"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import {
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

type GalleryLightboxProps = {
  images: { url: string }[];
  activeIndex: number;
  setActiveIndex: Dispatch<SetStateAction<number>>;
  itemName: string;
};

export function GalleryLightbox({
  images,
  activeIndex,
  setActiveIndex,
  itemName,
}: GalleryLightboxProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const hasMultiple = images.length > 1;
  const active = images[activeIndex];

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  function movePhoto(offset: number) {
    setActiveIndex((index) => (index + offset + images.length) % images.length);
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (hasMultiple && event.key === "ArrowLeft") {
      event.preventDefault();
      movePhoto(-1);
      return;
    }

    if (hasMultiple && event.key === "ArrowRight") {
      event.preventDefault();
      movePhoto(1);
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? []
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const viewer = open ? (
    <div
      className="fixed inset-0 z-[80] bg-black/95 p-2 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${itemName} photo viewer`}
        onKeyDown={handleKeyDown}
        className="relative h-full w-full overflow-hidden rounded-lg bg-felt-header shadow-2xl focus:outline-none"
      >
        <Image
          key={active.url}
          src={active.url}
          alt={`${itemName}, photo ${activeIndex + 1}`}
          fill
          sizes="100vw"
          className="object-contain"
        />

        <button
          ref={closeButtonRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close full-screen photo"
          className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-felt-ink/30 bg-felt-bg/85 text-2xl leading-none text-felt-ink shadow-lg backdrop-blur-sm transition-colors hover:border-brass hover:bg-felt-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
        >
          <span aria-hidden="true">×</span>
        </button>

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => movePhoto(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-felt-ink/25 bg-felt-bg/80 text-3xl leading-none text-felt-ink shadow-lg backdrop-blur-sm transition-colors hover:border-brass hover:bg-felt-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass sm:left-5"
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              onClick={() => movePhoto(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-felt-ink/25 bg-felt-bg/80 text-3xl leading-none text-felt-ink shadow-lg backdrop-blur-sm transition-colors hover:border-brass hover:bg-felt-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass sm:right-5"
            >
              <span aria-hidden="true">›</span>
            </button>
            <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-felt-bg/85 px-3 py-1 text-xs font-medium text-felt-ink shadow-lg backdrop-blur-sm sm:bottom-5">
              {activeIndex + 1} / {images.length}
            </span>
          </>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="View photo full screen"
        title="View full screen"
        className="absolute left-2 top-2 z-10 grid h-10 w-10 place-items-center rounded-full border border-felt-ink/20 bg-felt-bg/80 text-felt-ink shadow-md backdrop-blur-sm transition-colors hover:border-brass hover:bg-felt-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m15.2 15.2 4.3 4.3M10.5 7.5v6M7.5 10.5h6" />
        </svg>
      </button>
      {typeof document !== "undefined" && viewer ? createPortal(viewer, document.body) : null}
    </>
  );
}
