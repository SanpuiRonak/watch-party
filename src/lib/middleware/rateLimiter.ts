import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

// Rate limiter for Socket.io connections
// 10 events per second per connection
export const socketRateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 1,
  blockDuration: 10, // Block for 10 seconds if limit exceeded
});

// Rate limiter for room creation
// 5 room creations per hour per IP
export const createRoomRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 3600, // 1 hour
  blockDuration: 3600, // Block for 1 hour if limit exceeded
});

// Rate limiter for API requests
// 100 requests per 15 minutes per IP
export const apiRateLimiter = new RateLimiterMemory({
  points: 100,
  duration: 900, // 15 minutes
  blockDuration: 900, // Block for 15 minutes if limit exceeded
});

// Rate limiter for authentication attempts
// 10 auth attempts per hour per IP
export const authRateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 3600, // 1 hour
  blockDuration: 3600, // Block for 1 hour if limit exceeded
});

/**
 * Check rate limit and consume a point
 * @param limiter - The rate limiter to use
 * @param key - Unique identifier (IP address, user ID, etc.)
 * @returns Promise that resolves if allowed, rejects if rate limited
 */
export async function checkRateLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<RateLimiterRes> {
  try {
    return await limiter.consume(key);
  } catch (error) {
    // If error is RateLimiterRes, it means rate limit exceeded
    if (error instanceof Error) {
      throw error;
    }
    // Rate limit exceeded
    throw new Error('Rate limit exceeded');
  }
}

/**
 * Get rate limit info without consuming points
 */
export async function getRateLimitInfo(
  limiter: RateLimiterMemory,
  key: string
): Promise<RateLimiterRes | null> {
  try {
    return await limiter.get(key);
  } catch (error) {
    return null;
  }
}

/**
 * Reset rate limit for a key
 */
export async function resetRateLimit(
  limiter: RateLimiterMemory,
  key: string
): Promise<void> {
  try {
    await limiter.delete(key);
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
}

/**
 * Middleware-style wrapper for rate limiting
 */
export async function rateLimitMiddleware(
  limiter: RateLimiterMemory,
  key: string,
  onSuccess: () => void | Promise<void>,
  onRateLimit: (retryAfter: number) => void
): Promise<void> {
  try {
    await checkRateLimit(limiter, key);
    await onSuccess();
  } catch (error) {
    if (error instanceof Error && error.message === 'Rate limit exceeded') {
      const info = await getRateLimitInfo(limiter, key);
      const retryAfter = info ? Math.ceil(info.msBeforeNext / 1000) : limiter.blockDuration || 60;
      onRateLimit(retryAfter);
    } else {
      throw error;
    }
  }
}
