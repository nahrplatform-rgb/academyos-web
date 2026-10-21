import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {
  NextResponse,
  type NextRequest,
  type NextFetchEvent,
} from "next/server";
import { authenticationConfigured, validateStaging } from "./lib/config";
const protectedRoute = createRouteMatcher(["/:locale/workspace(.*)"]);
const handler = clerkMiddleware(async (auth, req) => {
  if (protectedRoute(req)) await auth.protect();
});
export default function proxy(req: NextRequest, event: NextFetchEvent) {
  validateStaging({
    ...process.env,
    APP_ENV: process.env.APP_ENV ?? "staging",
  });
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
