import Link from "next/link";

const LINKS = [
  { href: "/routes", label: "Routes" },
  { href: "/reminders", label: "Reminders" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
] as const;

export default function MorePage() {
  return (
    <div className="flex flex-col gap-2 p-4">
      <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">More</h1>
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-xl border border-zinc-200 bg-white p-4 font-medium text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
