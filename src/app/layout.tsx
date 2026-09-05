import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme-script";
import { NativeSystemBars } from "@/components/native-system-bars";
import { BackButtonHandler } from "@/components/back-button-handler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EMF Collections",
  description: "Easwar Finance — finance route collection & lending management",
};

// viewport-fit=cover lets a modern Android WebView report real safe-area
// insets via env(); see src/components/native-system-bars.tsx and
// node_modules/@capacitor/core/system-bars.md for the full picture.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NativeSystemBars />
        <BackButtonHandler />
        {children}
      </body>
    </html>
  );
}
