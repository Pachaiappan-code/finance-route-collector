"use client";

import { Moon, Sun } from "lucide-react";
import { useIsDark } from "@/lib/hooks/use-is-dark";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const isDark = useIsDark();

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore storage failures (private browsing, disabled storage)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-foreground ${className}`}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
