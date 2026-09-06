"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { WifiOff } from "lucide-react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  // Assume online on the server render — the real state is only knowable
  // client-side, and this avoids ever flashing the banner on first paint.
  return true;
}

export function OfflineBanner() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const router = useRouter();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      // Data fetched while offline may be stale — refresh the current
      // screen now that the connection is back, without touching form state.
      router.refresh();
    }
  }, [isOnline, router]);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-danger px-4 py-2 text-center text-xs font-medium text-white shadow-md"
      style={{ paddingTop: "calc(0.5rem + var(--safe-top))" }}
    >
      <WifiOff size={14} />
      No internet connection — some actions won&apos;t work until it&apos;s back.
    </div>
  );
}
