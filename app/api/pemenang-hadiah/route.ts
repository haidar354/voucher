import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const undiPemenangSchema = z.object({
  undianId: z.number().int().positive('Undian ID tidak valid'),
  jumlahPemenang: z.number().int().positive('Jumlah pemenang harus positif'),
});

const ambilHadiahSchema = z.object({
  pemenangId: z.number().int().positive('Pemenang ID tidak valid'),
  catatan: z.string().optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * GET /api/pemenang-hadiah
 * Get list pemenang hadiah dengan filter dan pagination
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
    const undianId = searchParams.get('undianId');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');
    
    const paginationParams = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
    });
    
    // Build where clause
    const where: any = {};
    
    if (undianId) {
      where.undianId = parseInt(undianId);
    }
    
    if (status) {
      where.status = status;
    }
    
    if (userId) {
      where.userId = parseInt(userId);
    }
    
    // Get total count
    const total = await prisma.pemenangHadiah.count({ where });
    
    // Get paginated data
    const pemenangHadiah = await prisma.pemenangHadiah.findMany({
      where,
      include: {
        undian: {
          select: {
            id: true,
            namaUndian: true,
          },
        },
        hadiah: {
          select: {
            id: true,
            namaHadiah: true,
            nilaiHadiah: true,
            gambar: true,
          },
        },
        user: {
          select: {
            id: true,
            nama: true,
            noHp: true,
            email: true,
          },
        },
        voucher: {
          select: {
            id: true,
            kodeVoucher: true,
            nomorUndian: true,
          },
        },
        admin: {
          select: {
            id: true,
            namaLengkap: true,
          },
        },
      },
      orderBy: { tanggalMenang: 'desc' },
      skip: (paginationParams.page - 1) * paginationParams.limit,
      take: paginationParams.limit,
    });
    
    return successResponse(
      {
        pemenangHadiah,
        pagination: {
          page: paginationParams.page,
          limit: paginationParams.limit,
          total,
          totalPages: Math.ceil(total / paginationParams.limit),
        },
      },
      'Data pemenang hadiah berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/pemenang-hadiah/undi
 * Undi pemenang hadiah (SUPER_ADMIN or ADMIN only)
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
    const validatedData = undiPemenangSchema.parse(body);
    
    // Check undian exists
    const undian = await prisma.undian.findUnique({
      where: { id: validatedData.undianId },
    });
    
    if (!undian) {
      return errorResponse('Undian tidak ditemukan', 404);
    }
    
    if (undian.status !== 'AKTIF') {
      return errorResponse('Undian tidak aktif', 400);
    }
    
    // Get semua voucher dengan nomor undian dari periode undian
    const vouchers = await prisma.voucher.findMany({
      where: {
        nomorUndian: { not: null },
        tanggalDibuat: {
          gte: undian.tanggalMulai,
          lte: undian.tanggalSelesai,
        },
        status: 'AKTIF',
      },
      include: {
        user: true,
      },
    });
    
    if (vouchers.length === 0) {
      return errorResponse('Tidak ada voucher dengan nomor undian pada periode ini', 400);
    }
    
    if (vouchers.length < validatedData.jumlahPemenang) {
      return errorResponse(
        `Jumlah voucher (${vouchers.length}) kurang dari jumlah pemenang yang diminta (${validatedData.jumlahPemenang})`,
        400
      );
    }
    
    // Get hadiah yang masih ada stok
    const hadiahTersedia = await prisma.hadiah.findMany({
      where: {
        aktif: true,
        stok: { gt: 0 },
        OR: [
          { tanggalMulai: null },
          { tanggalMulai: { lte: new Date() } },
        ],
        AND: [
          {
            OR: [
              { tanggalSelesai: null },
              { tanggalSelesai: { gte: new Date() } },
            ],
          },
        ],
      },
    });
    
    if (hadiahTersedia.length === 0) {
      return errorResponse('Tidak ada hadiah yang tersedia', 400);
    }
    
    // Random select pemenang
    const shuffledVouchers = shuffleArray(vouchers);
    const pemenang = shuffledVouchers.slice(0, validatedData.jumlahPemenang);
    
    // Assign hadiah ke pemenang
    const pemenangHadiah = [];
    
    for (let i = 0; i < pemenang.length; i++) {
      const voucher = pemenang[i];
      const hadiah = hadiahTersedia[i % hadiahTersedia.length]; // Cycle through available prizes
      
      // Create pemenang hadiah
      const pemenangData = await prisma.pemenangHadiah.create({
        data: {
          undianId: undian.id,
          hadiahId: hadiah.id,
          userId: voucher.userId,
          voucherId: voucher.id,
          nomorUndian: voucher.nomorUndian,
          status: 'BELUM_DIAMBIL',
        },
        include: {
          hadiah: true,
          user: true,
        },
      });
      
      pemenangHadiah.push(pemenangData);
      
      // Update stok hadiah
      await prisma.hadiah.update({
        where: { id: hadiah.id },
        data: {
          stokTerpakai: { increment: 1 },
        },
      });
    }
    
    // Update undian
    await prisma.undian.update({
      where: { id: undian.id },
      data: {
        hadiahTerbagi: { increment: pemenang.length },
      },
    });
    
    return successResponse(
      {
        pemenangHadiah,
        summary: {
          totalPemenang: pemenang.length,
          undianId: undian.id,
          namaUndian: undian.namaUndian,
        },
      },
      `Berhasil mengundi ${pemenang.length} pemenang hadiah`,
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/pemenang-hadiah/ambil
 * Ambil hadiah (update status menjadi SUDAH_DIAMBIL)
 */
export async function PUT(request: NextRequest) {
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
    
    const body = await request.json();
    
    // Validate input
    const validatedData = ambilHadiahSchema.parse(body);
    
    // Check pemenang exists
    const pemenang = await prisma.pemenangHadiah.findUnique({
      where: { id: validatedData.pemenangId },
      include: {
        hadiah: true,
        user: true,
      },
    });
    
    if (!pemenang) {
      return errorResponse('Pemenang hadiah tidak ditemukan', 404);
    }
    
    if (pemenang.status !== 'SUDAH_MEMILIH') {
      return errorResponse('Pemenang belum memilih hadiah atau hadiah sudah diambil', 400);
    }
    
    // Update status
    const updatedPemenang = await prisma.pemenangHadiah.update({
      where: { id: validatedData.pemenangId },
      data: {
        status: 'SUDAH_DIAMBIL',
        tanggalAmbil: new Date(),
        adminAmbil: authResult.admin.adminId,
        catatan: validatedData.catatan,
      },
      include: {
        hadiah: true,
        user: true,
        admin: {
          select: {
            namaLengkap: true,
          },
        },
      },
    });
    
    return successResponse(
      { pemenang: updatedPemenang },
      'Hadiah berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}

// Helper function to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
