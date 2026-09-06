"use client";

// global-error replaces the entire root layout when a crash happens above
// any other error boundary, so it renders its own <html>/<body> and can't
// rely on globals.css or Tailwind classes — everything here is inline,
// matching the EMF brand colors by hand (see src/app/globals.css) with a
// prefers-color-scheme fallback so it still looks right in dark mode.
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
          background: "#f7f8fa",
          color: "#14172b",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, maxWidth: 320 }}>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "0 0 20px", lineHeight: 1.5 }}>
            EMF Collections ran into a problem. Your data is safe — nothing was changed unless you
            saw a success message.
          </p>
          <button
            onClick={() => retry()}
            style={{
              height: 46,
              padding: "0 28px",
              borderRadius: 12,
              border: "none",
              background: "#14225c",
              color: "#fff",
              fontSize: 15,
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
