"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  // Matches what the server always renders (no .dark class yet) — the
  // blocking inline script in <head> may have already added it client-side
  // by the time React hydrates, and useSyncExternalStore reconciles that
  // without a manual "mounted" effect/state flag.
  return false;
}

/** Whether the `.dark` class is currently on <html>, kept live via a MutationObserver — no hydration-mismatch risk, no manual "mounted" flag needed. */
export function useIsDark(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export type ThemeChoice = "light" | "dark" | "system";

function getThemeChoiceSnapshot(): ThemeChoice {
  try {
    const stored = localStorage.getItem("theme");
    return stored === "dark" || stored === "light" ? stored : "system";
  } catch {
    return "system";
  }
}

function getThemeChoiceServerSnapshot(): ThemeChoice {
  return "system";
}

/**
 * The user's explicit Light/Dark/System choice. Every place that changes
 * the theme also toggles the `.dark` class in the same tick as writing
 * localStorage, so observing that class change is a reliable trigger to
 * re-read the stored choice here too — even when the change came from a
 * different mounted component (e.g. the header toggle vs. this control).
 */
export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, getThemeChoiceSnapshot, getThemeChoiceServerSnapshot);
}
