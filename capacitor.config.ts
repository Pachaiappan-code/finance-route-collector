import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.emf.collections",
  appName: "EMF Collections",
  webDir: "public",
  server: {
    // The Android app is a thin WebView shell around the live Vercel
    // deployment — all data reads/writes go through the same Next.js
    // API and Neon database as the website. No local data storage.
    url: "https://finance-route-collector.vercel.app",
    cleartext: false,
    // Capacitor's own WebViewClient loads this bundled local page (from
    // webDir, i.e. public/offline.html) instead of the OS's raw network
    // error page whenever the main-frame load fails — this is what covers
    // the "no internet at all when the app is first opened" case, since at
    // that point nothing from the remote site (including our own React
    // offline banner) has loaded yet to handle it in JS.
    errorPath: "offline.html",
  },
  plugins: {
    // Capacitor 8's edge-to-edge system bars (bundled in @capacitor/core,
    // not the legacy @capacitor/status-bar plugin). Solid background colors
    // are no longer supported on Android — the status/nav bars are always
    // transparent overlays showing our own page background through them.
    // "DEFAULT" matches system light/dark, same as our own theme script's
    // default; src/components/native-system-bars.tsx keeps it in sync
    // whenever the user overrides the in-app theme away from system.
    SystemBars: {
      insetsHandling: "css",
      style: "DEFAULT",
    },
  },
};

export default config;
