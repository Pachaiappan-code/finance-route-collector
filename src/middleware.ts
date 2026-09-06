import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";

// offline.html is the Capacitor-native error page (see capacitor.config.ts's
// server.errorPath) shown by the Android WebView on a load failure — it's
// normally resolved from the app's local bundled assets, never fetched over
// the network, but excluding it here too means it can never get redirected
// to /login if something ever does request it remotely.
const PUBLIC_PATHS = ["/login", "/offline.html"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth");

  if (isPublic) return NextResponse.next();

  if (!req.auth) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};
