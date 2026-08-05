"use client";

import { useEffect, useState } from "react";

const ANIMATION_DURATION_MS = 900;

export function AnimatedStatValue({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let animationFrame = 0;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animationFrame = requestAnimationFrame(() => setDisplayValue(value));
      return () => cancelAnimationFrame(animationFrame);
    }

    const startedAt = performance.now();

    function animate(now: number) {
      const progress = Math.min((now - startedAt) / ANIMATION_DURATION_MS, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * easedProgress));

      if (progress < 1) animationFrame = requestAnimationFrame(animate);
    }

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  return (
    <span aria-label={`${value.toLocaleString()}${suffix}`}>
      <span aria-hidden="true">
        {displayValue.toLocaleString()}
        {suffix}
      </span>
    </span>
  );
}
