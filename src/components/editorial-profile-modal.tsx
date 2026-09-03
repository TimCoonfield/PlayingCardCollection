"use client";

import Image from "next/image";
import { createPortal } from "react-dom";
import { ProfileModalFallback } from "@/components/profile-monogram-art";
import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

type EditorialProfileModalProps = {
  kind: "Series" | "Creator";
  title: string;
  tagline?: string | null;
  heroImageUrl?: string | null;
  fallbackSeed: string;
  metadata?: string[];
  children: ReactNode;
};

export function EditorialProfileModal({
  kind,
  title,
  tagline,
  heroImageUrl,
  fallbackSeed,
  metadata = [],
  children,
}: EditorialProfileModalProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleId = useId();

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 170);
  }, [closing]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      trigger?.focus();
    };
  }, [open]);

  function openModal() {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setClosing(false);
    setOpen(true);
  }

  function handleDialogKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) ?? []
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

  const modal = open ? (
    <div
      className={`profile-modal-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6 ${
        closing ? "profile-modal-backdrop-out" : "profile-modal-backdrop-in"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={handleDialogKeyDown}
        className={`profile-modal-panel relative grid max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl grid-rows-[12rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-brass/70 bg-felt-surface shadow-2xl sm:max-h-[calc(100dvh-3rem)] sm:grid-rows-[15rem_minmax(0,1fr)] md:grid-cols-[minmax(17rem,0.9fr)_minmax(0,1.35fr)] md:grid-rows-1 ${
          closing ? "profile-modal-panel-out" : "profile-modal-panel-in"
        }`}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          aria-label={`Close About this ${kind}`}
          className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-felt-ink/30 bg-felt-header/80 text-2xl leading-none text-felt-ink shadow-lg backdrop-blur-sm transition-colors hover:border-brass hover:bg-felt-header focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass sm:right-4 sm:top-4"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="relative min-h-0 overflow-hidden bg-felt-header">
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt=""
              fill
              sizes="(max-width: 767px) 100vw, 36rem"
              className="object-cover"
              unoptimized={heroImageUrl.startsWith("/")}
            />
          ) : (
            <ProfileModalFallback title={title} seed={fallbackSeed} />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-felt-surface via-felt-surface/10 to-felt-header/15 md:bg-gradient-to-r md:from-transparent md:via-felt-surface/15 md:to-felt-surface/90" />
        </div>

        <div className="min-h-0 overflow-y-auto bg-[radial-gradient(circle_at_100%_0%,color-mix(in_srgb,var(--brass)_10%,transparent),transparent_36%)] px-5 pb-7 pt-7 sm:px-8 sm:pb-9 sm:pt-8 md:px-10 md:pb-10 md:pt-14">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-brass">
            About this {kind}
          </p>
          <h2 id={titleId} className="mt-2 pr-10 font-display text-4xl font-semibold leading-tight text-felt-ink sm:text-5xl">
            {title}
          </h2>
          {tagline && (
            <p className="mt-3 font-display text-lg italic leading-7 text-brass sm:text-xl">
              {tagline}
            </p>
          )}
          <div className="my-5 h-px w-12 bg-brass/75 sm:my-6" />
          <div className="profile-modal-markdown">{children}</div>
          {metadata.length > 0 && (
            <div className="mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-felt-line pt-5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-felt-sub/75">
              {metadata.map((item, index) => (
                <span key={item} className="flex items-center gap-3">
                  {index > 0 && <span className="h-1 w-1 rounded-full bg-brass/75" aria-hidden="true" />}
                  {item}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openModal}
        className="group mt-3 inline-flex min-h-11 w-fit items-center gap-3 rounded-full border border-brass/70 bg-felt-header/25 px-5 text-xs font-bold uppercase tracking-[0.14em] text-felt-ink transition-colors hover:border-brass hover:bg-brass/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass"
      >
        About this {kind}
        <span aria-hidden="true" className="text-lg leading-none text-brass transition-transform group-hover:translate-x-0.5">
          ↗
        </span>
      </button>
      {typeof document !== "undefined" && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
