import Link from "next/link";
import { MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info-soft text-info">
        <MapPinOff size={26} />
      </div>
      <h1 className="text-base font-semibold text-foreground">Page not found</h1>
      <p className="max-w-xs text-sm text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 flex h-11 items-center justify-center rounded-xl bg-brand-navy px-6 text-sm font-medium text-white shadow-sm dark:bg-brand-navy-strong"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
