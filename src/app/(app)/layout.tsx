import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth/config";
import { BottomNav } from "@/components/bottom-nav";

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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
        <span className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
          EMF Collections
        </span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button className="text-sm font-medium text-zinc-500">Sign out</button>
        </form>
      </header>
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
