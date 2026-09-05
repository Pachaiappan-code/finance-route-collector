import Link from "next/link";
import {
  ChevronRight,
  Route as RouteIcon,
  Bell,
  BarChart3,
  Settings as SettingsIcon,
  UserX,
} from "lucide-react";

const LINKS = [
  { href: "/routes", label: "Routes", description: "Manage collection routes", icon: RouteIcon },
  { href: "/reminders", label: "Reminders", description: "Upcoming payment promises", icon: Bell },
  { href: "/reports", label: "Reports", description: "Daily, weekly & route summaries", icon: BarChart3 },
  {
    href: "/customers/deactivated",
    label: "Deactivated customers",
    description: "View and reactivate paused customers",
    icon: UserX,
  },
  { href: "/settings", label: "Settings", description: "Business preferences & appearance", icon: SettingsIcon },
] as const;

export default function MorePage() {
  return (
    <div className="flex flex-col gap-2.5 p-4 pt-5">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">More</h1>
      {LINKS.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-info-soft text-info">
              <Icon size={18} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{link.label}</p>
              <p className="text-xs text-muted">{link.description}</p>
            </div>
            <ChevronRight size={18} className="text-muted" />
          </Link>
        );
      })}
    </div>
  );
}
