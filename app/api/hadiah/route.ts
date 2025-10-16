import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const createHadiahSchema = z.object({
  namaHadiah: z.string().min(3, 'Nama hadiah minimal 3 karakter'),
  deskripsi: z.string().optional(),
  kategoriId: z.number().int().positive('Kategori ID tidak valid'),
  nilaiHadiah: z.number().positive('Nilai hadiah harus positif'),
  stok: z.number().int().min(0, 'Stok tidak boleh negatif').default(0),
  gambar: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
  tanggalMulai: z.coerce.date().optional(),
  tanggalSelesai: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.tanggalSelesai && data.tanggalMulai && data.tanggalSelesai < data.tanggalMulai) {
      return false;
    }
    return true;
  },
  {
    message: 'Tanggal selesai harus setelah tanggal mulai',
    path: ['tanggalSelesai'],
  }
);

const updateHadiahSchema = z.object({
  namaHadiah: z.string().min(3, 'Nama hadiah minimal 3 karakter').optional(),
  deskripsi: z.string().optional(),
  kategoriId: z.number().int().positive('Kategori ID tidak valid').optional(),
  nilaiHadiah: z.number().positive('Nilai hadiah harus positif').optional(),
  stok: z.number().int().min(0, 'Stok tidak boleh negatif').optional(),
  gambar: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
  aktif: z.boolean().optional(),
  tanggalMulai: z.coerce.date().optional(),
  tanggalSelesai: z.coerce.date().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * GET /api/hadiah
 * Get list hadiah dengan filter dan pagination
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
    const kategoriId = searchParams.get('kategoriId');
    const aktif = searchParams.get('aktif');
    const search = searchParams.get('search');
    
    const paginationParams = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
    });
    
    // Build where clause
    const where: any = {};
    
    if (kategoriId) {
      where.kategoriId = parseInt(kategoriId);
    }
    
    if (aktif !== null) {
      where.aktif = aktif === 'true';
    }
    
    if (search) {
      where.OR = [
        { namaHadiah: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Get total count
    const total = await prisma.hadiah.count({ where });
    
    // Get paginated data
    const hadiah = await prisma.hadiah.findMany({
      where,
      include: {
        kategori: {
          select: {
            id: true,
            namaKategori: true,
          },
        },
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
        hadiah,
        pagination: {
          page: paginationParams.page,
          limit: paginationParams.limit,
          total,
          totalPages: Math.ceil(total / paginationParams.limit),
        },
      },
      'Data hadiah berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/hadiah
 * Create hadiah baru (SUPER_ADMIN or ADMIN only)
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
    const validatedData = createHadiahSchema.parse(body);
    
    // Check kategori exists
    const kategori = await prisma.kategoriHadiah.findUnique({
      where: { id: validatedData.kategoriId },
    });
    
    if (!kategori) {
      return errorResponse('Kategori hadiah tidak ditemukan', 404);
    }
    
    // Create hadiah
    const hadiah = await prisma.hadiah.create({
      data: {
        namaHadiah: validatedData.namaHadiah,
        deskripsi: validatedData.deskripsi,
        kategoriId: validatedData.kategoriId,
        nilaiHadiah: validatedData.nilaiHadiah,
        stok: validatedData.stok,
        gambar: validatedData.gambar,
        tanggalMulai: validatedData.tanggalMulai,
        tanggalSelesai: validatedData.tanggalSelesai,
        aktif: true,
      },
      include: {
        kategori: {
          select: {
            id: true,
            namaKategori: true,
          },
        },
      },
    });
    
    return successResponse(
      { hadiah },
      'Hadiah berhasil dibuat',
      201
    );
  } catch (error) {
    return handleError(error);
  }
}
