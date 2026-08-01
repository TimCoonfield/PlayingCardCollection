"use client";

import { useRouter } from "next/navigation";

export function BackLink({
  fallbackHref,
  children,
}: {
  fallbackHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="text-sm text-felt-sub hover:text-felt-ink"
    >
      {children}
    </button>
  );
}
