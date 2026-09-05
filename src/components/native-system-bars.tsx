"use client";

import { useEffect } from "react";

/**
 * Keeps Android's edge-to-edge system bar icon style (light/dark) in sync
 * with our own in-app theme toggle. Capacitor 8's SystemBars plugin (bundled
 * in @capacitor/core) defaults its "DEFAULT" style to the device's OS-level
 * dark/light setting — but our app lets the user override light/dark
 * independently of the OS, so without this, toggling the app to dark mode
 * on a light-mode phone would leave the status bar showing dark icons
 * against our now-dark header, and vice versa.
 *
 * No-ops entirely on the web (Capacitor.isNativePlatform() is false there),
 * so this is safe to render unconditionally in the root layout.
 */
export function NativeSystemBars() {
  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | undefined;

    import("@capacitor/core")
      .then(({ Capacitor, SystemBars, SystemBarsStyle }) => {
        if (cancelled || !Capacitor.isNativePlatform()) return;

        const sync = () => {
          const isDark = document.documentElement.classList.contains("dark");
          SystemBars.setStyle({
            style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
          }).catch(() => {
            // ignore — best-effort on unsupported platforms/versions
          });
        };

        sync();

        observer = new MutationObserver(sync);
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["class"],
        });
      })
      .catch(() => {
        // @capacitor/core not usable in this environment — ignore
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  return null;
}
