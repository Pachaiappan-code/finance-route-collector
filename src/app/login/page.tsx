import Image from "next/image";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth/config";
import { ThemeToggle } from "@/components/theme-toggle";

async function loginAction(formData: FormData) {
  "use server";

  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-background px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-80 bg-gradient-to-b from-brand-navy/10 to-transparent dark:from-brand-navy/20"
      />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center">
        <Image
          src="/logo-full.png"
          alt="Easwar Finance — EMF"
          width={220}
          height={218}
          priority
          className="mb-2"
        />

        <div className="mt-6 w-full rounded-3xl border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-12px_rgba(16,24,40,0.14)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_12px_32px_-12px_rgba(0,0,0,0.5)]">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="mb-6 text-sm text-muted">
            Sign in to manage your collection routes
          </p>

          {params.error && (
            <div className="mb-4 rounded-xl bg-danger-soft px-3 py-2.5 text-sm font-medium text-danger">
              Invalid email or password.
            </div>
          )}

          <form action={loginAction} className="flex flex-col gap-4">
            <input
              type="hidden"
              name="callbackUrl"
              value={params.callbackUrl ?? "/dashboard"}
            />
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="h-12 rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none transition-colors focus:border-brand-navy dark:focus:border-brand-navy-strong"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="h-12 rounded-xl border border-border bg-background px-3.5 text-base text-foreground outline-none transition-colors focus:border-brand-navy dark:focus:border-brand-navy-strong"
              />
            </div>
            <button
              type="submit"
              className="mt-2 h-12 rounded-xl bg-brand-navy text-base font-medium text-white shadow-sm transition-transform active:scale-[0.99] dark:bg-brand-navy-strong dark:text-white"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-6 text-xs text-muted">Miles to go.</p>
      </div>
    </div>
  );
}
