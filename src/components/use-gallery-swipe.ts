"use client";

import { useRef, type PointerEvent } from "react";

/** Touch-only navigation; let the browser handle vertical scrolling and pinch zoom. */
export function useGallerySwipe(onSwipe: (direction: -1 | 1) => void, enabled: boolean) {
  const start = useRef<{ id: number; x: number; y: number } | null>(null);

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) {
      start.current = null;
      return;
    }
    if (!enabled || event.pointerType !== "touch" || !window.matchMedia("(max-width: 767px)").matches
      || (event.target instanceof Element && event.target.closest("button"))) return;
    start.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const origin = start.current;
    start.current = null;
    if (!origin || origin.id !== event.pointerId) return;
    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      onSwipe(dx < 0 ? 1 : -1);
    }
  }

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel: () => { start.current = null; },
  };
}
