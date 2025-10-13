import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';

/**
 * GET /api/admin/profile
 * Get current admin profile
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    // Get admin details
    const admin = await prisma.admin.findUnique({
      where: { id: authResult.admin.adminId },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        aktif: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!admin) {
      return successResponse(null, 'Admin tidak ditemukan', 404);
    }
    
    return successResponse({ admin }, 'Profil admin berhasil diambil');
  } catch (error) {
    return handleError(error);
  }
}
