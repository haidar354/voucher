import { NextRequest, NextResponse } from 'next/server';

/**
 * Global CORS handler untuk OPTIONS requests
 * Handle preflight requests dari frontend
 */
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Allow specific origins
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:3000',
  ];

  // Check if origin is allowed
  let allowedOrigin = 'http://localhost:8080'; // Default
  if (origin && allowedOrigins.includes(origin)) {
    allowedOrigin = origin;
  }

  const response = new NextResponse(null, { status: 200 });
  
  response.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
}
