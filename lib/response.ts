import { NextResponse } from 'next/server';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '@/types';

/**
 * Apply CORS headers to response
 */
function applyCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', 'http://localhost:8080');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  return response;
}

export function successResponse<T>(
  data: T,
  message: string = 'Success',
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response = NextResponse.json(
    {
      success: true,
      message,
      data,
    },
    { status }
  );
  return applyCorsHeaders(response);
}

export function errorResponse(
  message: string,
  status: number = 400,
  error?: string
): NextResponse<ApiResponse> {
  const response = NextResponse.json(
    {
      success: false,
      message,
      error,
    },
    { status }
  );
  return applyCorsHeaders(response);
}

export function paginationResponse<T>(
  data: T,
  pagination: PaginationMeta,
  message: string = 'Success',
  status: number = 200
): NextResponse<PaginatedResponse<T>> {
  const response = NextResponse.json(
    {
      success: true,
      message,
      data,
      pagination,
    },
    { status }
  );
  return applyCorsHeaders(response);
}

export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

export function notFoundResponse(
  message: string = 'Not Found'
): NextResponse<ApiResponse> {
  return errorResponse(message, 404);
}
