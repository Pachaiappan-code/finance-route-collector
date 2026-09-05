"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useThemeChoice, type ThemeChoice } from "@/lib/hooks/use-is-dark";

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
];

function applyTheme(choice: ThemeChoice) {
  const isDark =
    choice === "dark" ||
    (choice === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeSettingsControl() {
  const choice = useThemeChoice();

  function select(next: ThemeChoice) {
    applyTheme(next);
    try {
      if (next === "system") {
        localStorage.removeItem("theme");
      } else {
        localStorage.setItem("theme", next);
      }
    } catch {
      // ignore storage failures
    }
  }

  return (
    <div className="flex gap-2">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = choice === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => select(opt.value)}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors ${
              active
                ? "border-brand-navy bg-info-soft text-brand-navy dark:border-brand-navy-strong dark:text-brand-navy-strong"
                : "border-border bg-surface text-muted"
            }`}
          >
            <Icon size={18} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
