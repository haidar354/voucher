import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { loginSchema } from '@/lib/validations';
import { verifyPassword, generateToken } from '@/lib/auth';
import { LoginResponse } from '@/types';

/**
 * POST /api/auth/login
 * Login admin and generate JWT token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = loginSchema.parse(body);
    
    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: { username: validatedData.username },
    });
    
    if (!admin) {
      return errorResponse('Username atau password salah', 401);
    }
    
    // Check if admin is active
    if (!admin.aktif) {
      return errorResponse('Akun Anda tidak aktif. Hubungi administrator.', 403);
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(
      validatedData.password,
      admin.password
    );
    
    if (!isPasswordValid) {
      return errorResponse('Username atau password salah', 401);
    }
    
    // Generate JWT token
    const token = generateToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    });
    
    const response: LoginResponse = {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        namaLengkap: admin.namaLengkap,
        role: admin.role,
      },
    };
    
    return successResponse(response, 'Login berhasil');
  } catch (error) {
    return handleError(error);
  }
}
