import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const createKategoriSchema = z.object({
  namaKategori: z.string().min(3, 'Nama kategori minimal 3 karakter'),
  deskripsi: z.string().optional(),
});

const updateKategoriSchema = z.object({
  namaKategori: z.string().min(3, 'Nama kategori minimal 3 karakter').optional(),
  deskripsi: z.string().optional(),
  aktif: z.boolean().optional(),
});

/**
 * GET /api/kategori-hadiah
 * Get list kategori hadiah
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    // Authorize
    const authzResult = authorize(authResult.admin, [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
      AdminRole.KASIR,
    ]);
    if (!authzResult.authorized) {
      return authzResult.response;
    }
    
    const { searchParams } = new URL(request.url);
    const aktif = searchParams.get('aktif');
    
    // Build where clause
    const where: any = {};
    
    if (aktif !== null) {
      where.aktif = aktif === 'true';
    }
    
    // Get kategori hadiah
    const kategori = await prisma.kategoriHadiah.findMany({
      where,
      include: {
        _count: {
          select: {
            hadiah: true,
          },
        },
      },
      orderBy: { namaKategori: 'asc' },
    });
    
    return successResponse(
      { kategori },
      'Data kategori hadiah berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/kategori-hadiah
 * Create kategori hadiah baru (SUPER_ADMIN or ADMIN only)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    // Authorize
    const authzResult = authorize(authResult.admin, [
      AdminRole.SUPER_ADMIN,
      AdminRole.ADMIN,
    ]);
    if (!authzResult.authorized) {
      return authzResult.response;
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = createKategoriSchema.parse(body);
    
    // Check nama kategori unique
    const existingKategori = await prisma.kategoriHadiah.findUnique({
      where: { namaKategori: validatedData.namaKategori },
    });
    
    if (existingKategori) {
      return errorResponse('Nama kategori sudah digunakan', 409);
    }
    
    // Create kategori
    const kategori = await prisma.kategoriHadiah.create({
      data: {
        namaKategori: validatedData.namaKategori,
        deskripsi: validatedData.deskripsi,
        aktif: true,
      },
    });
    
    return successResponse(
      { kategori },
      'Kategori hadiah berhasil dibuat',
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
