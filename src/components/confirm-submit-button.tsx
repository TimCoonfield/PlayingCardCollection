"use client";

import type { ReactNode } from "react";

export function ConfirmSubmitButton({
  confirmMessage,
  className,
  ariaLabel,
  title,
  children,
}: {
  confirmMessage: string;
  className?: string;
  ariaLabel: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      aria-label={ariaLabel}
      title={title}
      className={className}
      onClick={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
