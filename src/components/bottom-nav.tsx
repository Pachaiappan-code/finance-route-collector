"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, LayoutDashboard, MoreHorizontal, Users, Wallet } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/collections", label: "Today", icon: CalendarCheck },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/due", label: "Due", icon: Wallet },
  { href: "/more", label: "More", icon: MoreHorizontal },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 backdrop-blur-lg"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="mx-auto flex h-16 max-w-2xl">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium"
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.4 : 1.8}
                className={active ? "text-brand-navy dark:text-brand-navy-strong" : "text-muted"}
              />
              <span className={active ? "text-brand-navy dark:text-brand-navy-strong" : "text-muted"}>
                {item.label}
              </span>
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-navy dark:bg-brand-navy-strong" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
