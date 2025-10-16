import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const createUndianSchema = z.object({
  namaUndian: z.string().min(3, 'Nama undian minimal 3 karakter'),
  deskripsi: z.string().optional(),
  tanggalMulai: z.coerce.date(),
  tanggalSelesai: z.coerce.date(),
  totalHadiah: z.number().int().positive('Total hadiah harus positif').default(0),
}).refine(
  (data) => data.tanggalSelesai >= data.tanggalMulai,
  {
    message: 'Tanggal selesai harus setelah tanggal mulai',
    path: ['tanggalSelesai'],
  }
);

const updateUndianSchema = z.object({
  namaUndian: z.string().min(3, 'Nama undian minimal 3 karakter').optional(),
  deskripsi: z.string().optional(),
  tanggalMulai: z.coerce.date().optional(),
  tanggalSelesai: z.coerce.date().optional(),
  totalHadiah: z.number().int().positive('Total hadiah harus positif').optional(),
  status: z.enum(['AKTIF', 'SELESAI', 'DIBATALKAN']).optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * GET /api/undian
 * Get list undian dengan filter dan pagination
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
    
    // Parse query params
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const paginationParams = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
    });
    
    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { namaUndian: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get total count
    const total = await prisma.undian.count({ where });
    
    // Get paginated data
    const undian = await prisma.undian.findMany({
      where,
      include: {
        _count: {
          select: {
            pemenangHadiah: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (paginationParams.page - 1) * paginationParams.limit,
      take: paginationParams.limit,
    });
    
    return successResponse(
      {
        undian,
        pagination: {
          page: paginationParams.page,
          limit: paginationParams.limit,
          total,
          totalPages: Math.ceil(total / paginationParams.limit),
        },
      },
      'Data undian berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/undian
 * Create undian baru (SUPER_ADMIN or ADMIN only)
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
    const validatedData = createUndianSchema.parse(body);
    
    // Create undian
    const undian = await prisma.undian.create({
      data: {
        namaUndian: validatedData.namaUndian,
        deskripsi: validatedData.deskripsi,
        tanggalMulai: validatedData.tanggalMulai,
        tanggalSelesai: validatedData.tanggalSelesai,
        totalHadiah: validatedData.totalHadiah,
        status: 'AKTIF',
      },
    });
    
    return successResponse(
      { undian },
      'Undian berhasil dibuat',
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
