"use client";

import { useFormStatus } from "react-dom";

/**
 * Drop-in submit button for a plain `<form action={serverAction}>` (no
 * client-side useTransition wrapper) — useFormStatus reads the pending state
 * of the nearest enclosing form, so this disables itself and shows a
 * "Saving..." label while the action is in flight, preventing a double-tap
 * from firing the action twice.
 */
export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  className,
  disabled,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
