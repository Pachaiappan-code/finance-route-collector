"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertTriangle size={26} />
      </div>
      <h1 className="text-base font-semibold text-foreground">Something went wrong</h1>
      <p className="max-w-xs text-sm text-muted">
        This screen ran into a problem. Your data is safe — nothing was changed unless you saw a
        success message.
      </p>
      <button
        onClick={() => retry()}
        className="mt-2 h-11 rounded-xl bg-brand-navy px-6 text-sm font-medium text-white shadow-sm dark:bg-brand-navy-strong"
      >
        Try again
      </button>
    </div>
  );
}
