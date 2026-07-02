import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Same-origin routing for the Django backend (dev / single-host prod).
 *
 * When BACKEND_INTERNAL_URL is set (a runtime env var — no build-time baking),
 * /svc/api/* requests are proxied to Django with the path preserved EXACTLY,
 * including trailing slashes. next.config `rewrites()` cannot do this: its
 * `:path*` destinations drop trailing slashes, which sends Django's admin
 * into a redirect loop against APPEND_SLASH.
 *
 * In production behind ALB path-based routing, leave BACKEND_INTERNAL_URL
 * unset — /svc/api/* traffic never reaches Next.js at all.
 *
 * skipTrailingSlashRedirect (next.config.ts) disables Next's automatic
 * slash-stripping 308 so Django-owned URLs pass through untouched; the
 * default behavior is re-applied here for every path Next itself serves.
 */

const backendInternal =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ?? "";

export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === "/svc/api" || pathname.startsWith("/svc/api/")) {
    if (!backendInternal) {
      return NextResponse.next();
    }
    return NextResponse.rewrite(
      new URL(`${pathname}${search}`, backendInternal),
    );
  }

  // Re-apply Next's default trailing-slash removal for its own routes.
  // Plain URL on purpose: NextURL.clone() re-normalizes the pathname back
  // to the original trailing-slash form, producing a self-redirect.
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return NextResponse.redirect(
      new URL(`${pathname.replace(/\/+$/, "")}${search}`, req.url),
      308,
    );
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
