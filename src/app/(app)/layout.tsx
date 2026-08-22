import Image from "next/image";
import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth/config";
import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-lg">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo-icon.png"
            alt="EMF"
            width={34}
            height={34}
            className="rounded-full"
            priority
          />
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight text-foreground">
              EMF Collections
            </p>
            <p className="text-[11px] text-muted">Easwar Finance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              aria-label="Sign out"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:text-danger"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 pb-24">{children}</main>
      <BottomNav />
    </div>
  );
}
