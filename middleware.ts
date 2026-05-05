import { type NextRequest, NextResponse } from "next/server";

/**
 * EDGE-SAFE MIDDLEWARE
 * 
 * Why this is lightweight:
 * 1. Next.js Edge Middleware has strict execution limits and can easily timeout (504s).
 * 2. Supabase auth.getUser() / getSession() make network calls to the database/auth API.
 * 3. Doing network calls in middleware blocks the request and causes Vercel 504 errors.
 * 
 * Solution:
 * - Middleware ONLY checks for the presence of the auth cookie.
 * - If the cookie is missing on a protected route, it redirects to /login.
 * - ALL real token validation (Supabase calls) happens in Server Components / Route Handlers.
 */

// Define protected routes explicitly instead of broad matchers like /:path*
const PROTECTED_ROUTES = [
  "/create-profile",
  "/chat",
  "/discover",
  "/admin",
  "/hackathon",
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Bypass check for public routes and static assets early
  if (
    path.startsWith("/login") ||
    path.startsWith("/signup") ||
    path.startsWith("/api") ||
    path.startsWith("/_next") ||
    path.includes(".") // fast check for files (e.g. favicon.ico, images)
  ) {
    return NextResponse.next();
  }

  // 2. Determine if the route requires authentication
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => path.startsWith(route));

  // 3. Edge-Safe Auth Check (Cookies Only!)
  if (isProtectedRoute) {
    // Supabase sets cookies in the format `sb-[project-ref]-auth-token`
    // Next.js might chunk cookies (e.g. `sb-[project-ref]-auth-token.0`)
    const hasAuthCookie = request.cookies.getAll().some(
      (cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("token")
    );

    // If no cookie is found, immediately redirect to login (no redirect loop because /login is excluded above)
    if (!hasAuthCookie) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect_to", path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 4. Set Security Headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.delete("X-Powered-By");

  return response;
}

// Scope middleware only to the routes that need checking to prevent unnecessary execution
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (auth route)
     * - signup (auth route)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup).*)",
  ],
};

