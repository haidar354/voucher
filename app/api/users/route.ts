import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { createUserSchema } from '@/lib/validations';
import { authenticate } from '@/middleware/auth';

/**
 * POST /api/users
 * Create new user or get existing user by noHp
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = createUserSchema.parse(body);
    
    // Check if user with noHp already exists
    const existingUser = await prisma.user.findUnique({
      where: { noHp: validatedData.noHp },
    });
    
    if (existingUser) {
      return successResponse(
        { user: existingUser },
        'User dengan nomor HP ini sudah terdaftar',
        200
      );
    }
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        nama: validatedData.nama,
        email: validatedData.email || null,
        noHp: validatedData.noHp,
        alamat: validatedData.alamat || null,
      },
    });
    
    return successResponse(
      { user: newUser },
      'User berhasil dibuat',
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/users?query=
 * Search users by nama, noHp, or email
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    
    const users = await prisma.user.findMany({
      where: query ? {
        OR: [
          { nama: { contains: query, mode: 'insensitive' } },
          { noHp: { contains: query } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      } : {},
      select: {
        id: true,
        nama: true,
        email: true,
        noHp: true,
        alamat: true,
        tanggalDaftar: true,
        _count: {
          select: {
            transaksi: true,
            voucher: true,
          },
        },
      },
      orderBy: { tanggalDaftar: 'desc' },
      take: 50, // Limit results
    });
    
    return successResponse(
      { users },
      'Data user berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
