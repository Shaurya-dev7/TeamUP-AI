import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check for Upstash configuration
const useUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Limiters (Lazy if possible, but top-level for Edge caching)
let limiters: Record<string, Ratelimit> | null = null;

if (useUpstash) {
  const redis = Redis.fromEnv();
  limiters = {
    auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute for auth
      analytics: true,
      prefix: "ratelimit:auth",
    }),
    admin: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "60 s"), // 20 admin actions per minute
      analytics: true,
      prefix: "ratelimit:admin",
    }),
    chat: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 chat creations per minute
      analytics: true,
      prefix: "ratelimit:chat",
    }),
    general: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"), // 60 API calls per minute
      analytics: true,
      prefix: "ratelimit:general",
    }),
  };
}

// Simple in-memory fallback for development without Redis
const memoryMap = new Map<string, number>();
const memoryWindow = 60 * 1000; // 1 minute
const memoryLimit = 100; // Generous limit for dev

async function checkRateLimit(req: NextRequest): Promise<{ success: boolean; limit?: number; remaining?: number }> {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const path = req.nextUrl.pathname;

  // If Upstash is configured, use it
  if (limiters) {
    let limiter = limiters.general;
    if (path.startsWith("/api/auth") || path === "/login") limiter = limiters.auth;
    else if (path.startsWith("/api/admin") || path.startsWith("/admin")) limiter = limiters.admin;
    else if (path.startsWith("/api/create-chat") || path.startsWith("/api/create-group-chat")) limiter = limiters.chat;

    return await limiter.limit(ip);
  }

  // Fallback: In-Memory (Per-Isolate, not distributed)
  // Just to prevent spam in dev
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / memoryWindow)}`;
  const count = (memoryMap.get(key) || 0) + 1;
  memoryMap.set(key, count);

  // cleanup old keys roughly
  if (memoryMap.size > 1000) memoryMap.clear();

  return { success: count <= memoryLimit, limit: memoryLimit, remaining: memoryLimit - count };
}

export async function middleware(request: NextRequest) {
  // 1. Rate Limiting
  // Apply to API routes and sensitive pages
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api") || path.startsWith("/login") || path.startsWith("/admin")) {
    const { success, limit, remaining } = await checkRateLimit(request);

    if (!success) {
      return NextResponse.json(
        { error: "Too Many Requests" },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit?.toString() || "0",
            "X-RateLimit-Remaining": remaining?.toString() || "0",
          } 
        }
      );
    }
  }

  // 2. Supabase Auth Session
  const response = await updateSession(request);

  // 3. Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Remove identifying headers
  response.headers.delete("X-Powered-By");

  return response;
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
