/** Friendly message for an unexpected thrown error (network loss, server unreachable, etc.) — never shows the raw error to the user. */
export function getFriendlyErrorMessage(): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return "You're offline. Please check your internet connection and try again.";
  }
  return "Something went wrong. Please check your connection and try again.";
}
