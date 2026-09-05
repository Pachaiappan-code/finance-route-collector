"use client";

import { useEffect } from "react";

/**
 * Android hardware back button: go back within the app's own navigation
 * history when there's somewhere to go back to; only at the very root
 * (nothing left to go back to) does it ask for confirmation and exit the
 * app. Without this, Capacitor's default behavior is to exit immediately
 * on any back press, which feels broken for a multi-screen app.
 *
 * No-ops entirely on the web (Capacitor.isNativePlatform() is false
 * there), so this is safe to render unconditionally in the root layout.
 */
export function BackButtonHandler() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    import("@capacitor/app")
      .then(async ({ App }) => {
        const { Capacitor } = await import("@capacitor/core");
        if (cancelled || !Capacitor.isNativePlatform()) return;

        const handle = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
            return;
          }
          if (window.confirm("Exit EMF Collections?")) {
            App.exitApp();
          }
        });

        cleanup = () => handle.remove();
      })
      .catch(() => {
        // @capacitor/app not usable in this environment — ignore
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return null;
}
