import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
import {
  authenticationConfigured,
  validateStaging,
  STAGING_AUTH_ORIGINS,
  STAGING_ORIGIN,
} from "./lib/config";
const protectedRoute = createRouteMatcher([
  "/:locale/workspace(.*)",
  "/:locale/service-setup(.*)",
]);
const handler = clerkMiddleware(
  async (auth, req) => {
    if (protectedRoute(req)) await auth.protect();
  },
  { authorizedParties: STAGING_AUTH_ORIGINS },
);
export default function proxy(req: NextRequest, event: NextFetchEvent) {
  validateStaging({
    ...process.env,
    APP_ENV: process.env.APP_ENV ?? "staging",
  });
  if (
    process.env.VERCEL_ENV === "production" &&
    req.nextUrl.hostname === "academyos-web.vercel.app" &&
    ["GET", "HEAD"].includes(req.method) &&
    !req.nextUrl.pathname.startsWith("/api/")
  ) {
    const target = new URL(
      req.nextUrl.pathname + req.nextUrl.search,
      STAGING_ORIGIN,
    );
    return NextResponse.redirect(target, 307);
  }
  if (!authenticationConfigured(process.env)) {
    if (protectedRoute(req))
      return new NextResponse("Authentication is not configured", {
        status: 503,
      });
    return NextResponse.next();
  }
  return handler(req, event);
}
export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };
