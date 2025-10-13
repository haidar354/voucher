import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { registerAdminSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/auth';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';

/**
 * POST /api/auth/register
 * Register new admin (SUPER_ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    // Authorize - only SUPER_ADMIN can create new admin
    const authzResult = authorize(authResult.admin, [AdminRole.SUPER_ADMIN]);
    if (!authzResult.authorized) {
      return authzResult.response;
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = registerAdminSchema.parse(body);
    
    // Check if username already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: validatedData.username },
    });
    
    if (existingAdmin) {
      return errorResponse('Username sudah digunakan', 409);
    }
    
    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);
    
    // Create admin
    const newAdmin = await prisma.admin.create({
      data: {
        username: validatedData.username,
        password: hashedPassword,
        namaLengkap: validatedData.namaLengkap,
        role: validatedData.role,
      },
      select: {
        id: true,
        username: true,
        namaLengkap: true,
        role: true,
        aktif: true,
        createdAt: true,
      },
    });
    
    return successResponse(
      { admin: newAdmin },
      'Admin berhasil didaftarkan',
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
