import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { rateLimit } from "@/lib/rate-limit";

export async function middleware(request: NextRequest) {
  // 1. Rate Limiting (Lightweight)
  // Only apply to API routes to avoid blocking static assets or page navigations
  if (request.nextUrl.pathname.startsWith("/api")) {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = await rateLimit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too Many Requests. Please try again later." },
        { status: 429 }
      );
    }
  }

  // 2. Supabase Auth Session
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
      Run on all routes except:
      - _next static files
      - images
      - favicon
    */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
