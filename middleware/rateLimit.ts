import { NextRequest } from 'next/server';
import { errorResponse } from '@/lib/response';

// Simple in-memory rate limiter
// For production, use Redis or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT = parseInt(process.env.API_RATE_LIMIT || '100');
const WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Rate limiting middleware
 * Limits requests per IP address
 */
export function rateLimit(
  request: NextRequest
): { limited: false } | { limited: true; response: Response } {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // Create new record or reset
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return { limited: false };
  }

  if (record.count >= RATE_LIMIT) {
    return {
      limited: true,
      response: errorResponse(
        'Terlalu banyak request. Silakan coba lagi nanti.',
        429,
        'RATE_LIMIT_EXCEEDED'
      ),
    };
  }

  record.count++;
  return { limited: false };
}

/**
 * Clean up old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, WINDOW_MS);
