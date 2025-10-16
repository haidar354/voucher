import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS middleware untuk Next.js API routes
 */
export function corsHeaders(response: NextResponse, origin?: string) {
  // Allow specific origins
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
  ];

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback to localhost:8080 for development
    response.headers.set('Access-Control-Allow-Origin', 'http://localhost:8080');
  }

  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
}

/**
 * Handle preflight OPTIONS request
 */
export function handleCorsOptions(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    return corsHeaders(response, origin || undefined);
  }
  
  return null;
}

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin');
  return corsHeaders(response, origin || undefined);
}
