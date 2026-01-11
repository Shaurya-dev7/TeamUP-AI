
interface RateLimitContext {
  count: number;
  resetTime: number;
}

const tracker = new Map<string, RateLimitContext>();

/**
 * Basic In-Memory Rate Limiter
 * 
 * Rules:
 * - 10 requests / 10 seconds per IP
 * - Fails open (if memory resets, traffic flows)
 * - Returns { success: boolean, reset: number }
 */
export async function rateLimit(identifier: string) {
  const now = Date.now();
  const windowSize = 10 * 1000; // 10 seconds
  const limit = 10; // 10 requests per window

  const record = tracker.get(identifier);

  if (!record || now > record.resetTime) {
    tracker.set(identifier, { count: 1, resetTime: now + windowSize });
    return { success: true, reset: now + windowSize };
  }

  if (record.count >= limit) {
    return { success: false, reset: record.resetTime };
  }

  record.count += 1;
  tracker.set(identifier, record);
  return { success: true, reset: record.resetTime };
}
