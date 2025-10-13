import { AdminRole } from '@prisma/client';
import { JWTPayload } from '@/types';
import { hasRole } from '@/lib/auth';
import { forbiddenResponse } from '@/lib/response';

/**
 * Authorization middleware
 * Checks if admin has required role
 */
export function authorize(
  admin: JWTPayload,
  requiredRoles: AdminRole[]
): { authorized: true } | { authorized: false; response: Response } {
  if (!hasRole(admin.role, requiredRoles)) {
    return {
      authorized: false,
      response: forbiddenResponse('Anda tidak memiliki akses untuk melakukan aksi ini'),
    };
  }

  return { authorized: true };
}
