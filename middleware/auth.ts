import { NextRequest } from 'next/server';
import { extractToken, verifyToken } from '@/lib/auth';
import { JWTPayload } from '@/types';
import { unauthorizedResponse } from '@/lib/response';

/**
 * Authentication middleware
 * Verifies JWT token and attaches admin data to request
 */
export async function authenticate(
  request: NextRequest
): Promise<{ authenticated: true; admin: JWTPayload } | { authenticated: false; response: Response }> {
  const authHeader = request.headers.get('Authorization');
  const token = extractToken(authHeader);

  if (!token) {
    return {
      authenticated: false,
      response: unauthorizedResponse('Token tidak ditemukan'),
    };
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return {
      authenticated: false,
      response: unauthorizedResponse('Token tidak valid atau expired'),
    };
  }

  return {
    authenticated: true,
    admin: decoded,
  };
}

/**
 * Get admin from request (after authentication)
 * This is a helper to extract admin data from authenticated request
 */
export function getAdminFromRequest(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('Authorization');
  const token = extractToken(authHeader);
  
  if (!token) return null;
  
  return verifyToken(token);
}
