import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { headers } from 'next/headers';

// Check for Upstash configuration
const useUpstash = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

// Initialize Limiters (Lazy if possible)
let limiters: Record<string, Ratelimit> | null = null;

if (useUpstash) {
  const redis = Redis.fromEnv();
  limiters = {
    signup: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "60 s"),
      analytics: true,
      prefix: "ratelimit:signup",
    }),
    login: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
      prefix: "ratelimit:login",
    }),
    admin: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "60 s"),
      analytics: true,
      prefix: "ratelimit:admin",
    }),
    chat: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      analytics: true,
      prefix: "ratelimit:chat",
    }),
    message: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      analytics: true,
      prefix: "ratelimit:message",
    }),
    follow: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "60 s"),
      analytics: true,
      prefix: "ratelimit:follow",
    }),
    invite: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "ratelimit:invite",
    }),
    general_anon: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      analytics: true,
      prefix: "ratelimit:general:anon",
    }),
    general_auth: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "60 s"),
      analytics: true,
      prefix: "ratelimit:general:auth",
    }),
  };
}

const memoryMap = new Map<string, number>();
const memoryWindow = 60 * 1000;
const memoryLimit = 100;

export type LimiterType = 'signup' | 'login' | 'admin' | 'chat' | 'message' | 'follow' | 'invite' | 'general_anon' | 'general_auth';

export async function checkRateLimit(
  identifier: string | null = null,
  type: LimiterType = 'general_anon'
): Promise<{ success: boolean; limit?: number; remaining?: number }> {
  let ip = '127.0.0.1';
  try {
    const headersList = await headers();
    ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         headersList.get('x-real-ip') || 
         '127.0.0.1';
  } catch (e) {
    // headers() might fail if not in a server component/route handler context, though unlikely
  }

  // Use userId if provided, otherwise fallback to IP
  const key = identifier ? `${identifier}:${ip}` : `anon:${ip}`;

  if (limiters && limiters[type]) {
    return await limiters[type].limit(key);
  }

  // Fallback: In-Memory
  const now = Date.now();
  const memKey = `${type}:${key}:${Math.floor(now / memoryWindow)}`;
  const count = (memoryMap.get(memKey) || 0) + 1;
  memoryMap.set(memKey, count);

  if (memoryMap.size > 1000) memoryMap.clear();

  return { 
    success: count <= memoryLimit, 
    limit: memoryLimit, 
    remaining: Math.max(0, memoryLimit - count) 
  };
}
