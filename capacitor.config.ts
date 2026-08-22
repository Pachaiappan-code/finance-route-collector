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
  },
};

export default config;
