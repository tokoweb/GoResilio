import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  timestamps: number[];
}

/**
 * In-Memory Sliding Window Rate Limiter for Next.js Route Handlers
 */
export class RateLimiter {
  private static store = new Map<string, RateLimitRecord>();
  private static lastCleanup = Date.now();

  static clear(): void {
    this.store.clear();
  }

  /**
   * Check if a request exceeds rate limit for a given key
   * @param key Unique identifier (e.g. IP + endpoint)
   * @param maxRequests Maximum allowed requests within windowMs
   * @param windowMs Window duration in milliseconds (default 60000ms = 1 minute)
   */
  static check(
    key: string,
    maxRequests: number = 20,
    windowMs: number = 60000
  ): { allowed: boolean; remaining: number; resetInMs: number } {
    const now = Date.now();

    // Periodic cleanup of stale keys every 5 minutes
    if (now - this.lastCleanup > 300000) {
      this.cleanup(windowMs);
      this.lastCleanup = now;
    }

    const record = this.store.get(key) || { timestamps: [] };
    const cutoff = now - windowMs;

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const resetInMs = Math.max(0, oldest + windowMs - now);
      return { allowed: false, remaining: 0, resetInMs };
    }

    // Add current request timestamp
    record.timestamps.push(now);
    this.store.set(key, record);

    const remaining = maxRequests - record.timestamps.length;
    return { allowed: true, remaining, resetInMs: windowMs };
  }

  /**
   * Helper to extract client IP address from request headers
   */
  static getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    const realIp = req.headers.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
    return '127.0.0.1';
  }

  /**
   * Middleware-style rate limit check that returns a 429 response if exceeded
   */
  static enforce(
    req: NextRequest,
    actionKey: string,
    maxRequests: number = 20,
    windowMs: number = 60000
  ): NextResponse | null {
    const clientIp = this.getClientIp(req);
    const key = `${actionKey}:${clientIp}`;
    const result = this.check(key, maxRequests, windowMs);

    if (!result.allowed) {
      const retryAfterSec = Math.ceil(result.resetInMs / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Batas frekuensi permintaan terlampaui. Silakan coba kembali dalam ${retryAfterSec} detik.`
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSec),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil((Date.now() + result.resetInMs) / 1000))
          }
        }
      );
    }

    return null;
  }

  private static cleanup(windowMs: number) {
    const cutoff = Date.now() - windowMs;
    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }
}
