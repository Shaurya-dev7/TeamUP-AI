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
    // Auth endpoints - strict limits for login/signup brute force prevention
    signup: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "60 s"), // 3 signups per minute per IP
      analytics: true,
      prefix: "ratelimit:signup",
    }),
    login: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 login attempts per minute
      analytics: true,
      prefix: "ratelimit:login",
    }),
    // Admin endpoints - moderate limits
    admin: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "60 s"), // 20 admin actions per minute
      analytics: true,
      prefix: "ratelimit:admin",
    }),
    // Chat creation - prevent spam
    chat: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 chat creations per minute
      analytics: true,
      prefix: "ratelimit:chat",
    }),
    // Message sending - moderate limit
    message: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"), // 30 messages per minute
      analytics: true,
      prefix: "ratelimit:message",
    }),
    // Follow/unfollow - prevent spam following
    follow: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "60 s"), // 20 follow actions per minute
      analytics: true,
      prefix: "ratelimit:follow",
    }),
    // Team invites - prevent invite spam
    invite: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 invites per minute
      analytics: true,
      prefix: "ratelimit:invite",
    }),
    // General API - for all other endpoints
    general_anon: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"), // 30 requests per minute for anonymous
      analytics: true,
      prefix: "ratelimit:general:anon",
    }),
    general_auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "60 s"), // 120 requests per minute for authenticated
      analytics: true,
      prefix: "ratelimit:general:auth",
    }),
  };
}

// Simple in-memory fallback for development without Redis
const memoryMap = new Map<string, number>();
const memoryWindow = 60 * 1000; // 1 minute
const memoryLimit = 100; // Generous limit for dev

/**
 * Get composite rate limit key
 * 
 * Strategy:
 * - Anonymous users: IP address only
 * - Authenticated users: userId:IP (composite)
 * 
 * This prevents:
 * - Single IP from abusing limits across accounts
 * - Single user from bypassing limits by switching IPs (VPN)
 */
function getRateLimitKey(req: NextRequest, userId?: string | null): string {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
    ?? req.headers.get("x-real-ip") 
    ?? "127.0.0.1";
  
  if (userId) {
    // Composite key: user can't bypass by switching IP
    return `${userId}:${ip}`;
  }
  
  // Anonymous users - IP only
  return `anon:${ip}`;
}

/**
 * Extract user ID from auth header if present
 * Note: This is a quick check without full token validation
 * Full validation happens later in updateSession()
 */
function extractUserIdFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  // JWT structure: header.payload.signature
  // We just need to peek at the payload for rate limiting
  const token = authHeader.substring(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null; // Supabase uses 'sub' for user ID
  } catch {
    return null;
  }
}

/**
 * Select appropriate rate limiter based on path and auth status
 */
function selectLimiter(path: string, isAuthenticated: boolean): Ratelimit | null {
  if (!limiters) return null;
  
  // Signup - strictest (prevent account spam)
  if (path.includes("/signup") || path.includes("/register")) {
    return limiters.signup;
  }
  
  // Login - strict (prevent brute force)
  if (path.includes("/login") || path.includes("/api/auth")) {
    return limiters.login;
  }
  
  // Admin endpoints
  if (path.startsWith("/api/admin") || path.startsWith("/admin")) {
    return limiters.admin;
  }
  
  // Chat creation
  if (path.startsWith("/api/create-chat") || path.startsWith("/api/create-group-chat")) {
    return limiters.chat;
  }
  
  // Message sending
  if (path.startsWith("/api/send-message") || path.startsWith("/api/message")) {
    return limiters.message;
  }
  
  // Follow/unfollow actions
  if (path.startsWith("/api/follow")) {
    return limiters.follow;
  }
  
  // Team invites
  if (path.includes("/invites") || path.includes("/join-request")) {
    return limiters.invite;
  }
  
  // General API - different limits for auth vs anon
  return isAuthenticated ? limiters.general_auth : limiters.general_anon;
}

async function checkRateLimit(
  req: NextRequest, 
  userId: string | null
): Promise<{ success: boolean; limit?: number; remaining?: number }> {
  const path = req.nextUrl.pathname;
  const key = getRateLimitKey(req, userId);
  const isAuthenticated = !!userId;

  // If Upstash is configured, use it
  if (limiters) {
    const limiter = selectLimiter(path, isAuthenticated);
    if (!limiter) return { success: true };
    
    return await limiter.limit(key);
  }

  // Fallback: In-Memory (Per-Isolate, not distributed)
  // Just to prevent spam in dev
  const now = Date.now();
  const memKey = `${key}:${Math.floor(now / memoryWindow)}`;
  const count = (memoryMap.get(memKey) || 0) + 1;
  memoryMap.set(memKey, count);

  // cleanup old keys roughly
  if (memoryMap.size > 1000) memoryMap.clear();

  return { success: count <= memoryLimit, limit: memoryLimit, remaining: memoryLimit - count };
}

export async function middleware(request: NextRequest) {
  // 1. Extract user ID for composite rate limiting key
  const userId = extractUserIdFromRequest(request);
  
  // 2. Rate Limiting
  // Apply to API routes and sensitive pages
  const path = request.nextUrl.pathname;
  if (path.startsWith("/api") || path.startsWith("/login") || path.startsWith("/admin")) {
    const { success, limit, remaining } = await checkRateLimit(request, userId);

    if (!success) {
      return NextResponse.json(
        { error: "Too Many Requests" },
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit?.toString() || "0",
            "X-RateLimit-Remaining": remaining?.toString() || "0",
            "Retry-After": "60",
          } 
        }
      );
    }
  }

  // 3. Supabase Auth Session
  const response = await updateSession(request);

  // 4. Security Headers
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

