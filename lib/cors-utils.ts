import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS utility functions untuk API routes
 */

// Allowed origins untuk development
const ALLOWED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:3000',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:3000',
];

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Get allowed origin from request
 */
export function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin');
  if (origin && isOriginAllowed(origin)) {
    return origin;
  }
  return 'http://localhost:8080'; // Default fallback
}

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const allowedOrigin = getAllowedOrigin(request);
  
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
}

/**
 * Handle preflight OPTIONS request
 */
export function handlePreflightRequest(request: NextRequest): NextResponse | null {
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return applyCorsHeaders(response, request);
  }
  return null;
}

/**
 * CORS wrapper untuk API route handlers
 */
export function withCors<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest;
    
    // Handle preflight request
    const preflightResponse = handlePreflightRequest(request);
    if (preflightResponse) {
      return preflightResponse;
    }
    
    // Execute original handler
    const response = await handler(...args);
    
    // Apply CORS headers to response
    return applyCorsHeaders(response, request);
  };
}
