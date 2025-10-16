import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';

/**
 * GET /api/hadiah/tersedia
 * Get hadiah yang masih tersedia untuk dipilih pemenang
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
    const kategoriId = searchParams.get('kategoriId');
    
    // Build where clause
    const where: any = {
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
    };
    
    // Filter by kategori if provided
    if (kategoriId) {
      where.kategoriId = parseInt(kategoriId);
    }
    
    // Get hadiah yang tersedia
    const hadiahTersedia = await prisma.hadiah.findMany({
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
      orderBy: { nilaiHadiah: 'desc' },
    });
    
    // Calculate stok tersisa untuk setiap hadiah
    const hadiahDenganStok = hadiahTersedia.map((hadiah) => ({
      ...hadiah,
      stokTersisa: hadiah.stok - hadiah.stokTerpakai,
      nilaiHadiah: Number(hadiah.nilaiHadiah),
    }));
    
    // Filter hanya hadiah yang masih ada stok
    const hadiahTersediaFiltered = hadiahDenganStok.filter(
      (hadiah) => hadiah.stokTersisa > 0
    );
    
    return successResponse(
      {
        hadiah: hadiahTersediaFiltered,
        total: hadiahTersediaFiltered.length,
        summary: {
          totalKategori: [...new Set(hadiahTersediaFiltered.map(h => h.kategori.namaKategori))].length,
          nilaiTerendah: hadiahTersediaFiltered.length > 0 ? Math.min(...hadiahTersediaFiltered.map(h => h.nilaiHadiah)) : 0,
          nilaiTertinggi: hadiahTersediaFiltered.length > 0 ? Math.max(...hadiahTersediaFiltered.map(h => h.nilaiHadiah)) : 0,
        },
      },
      'Hadiah tersedia berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
