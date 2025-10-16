import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';
import { z } from 'zod';

// Validation schemas
const pilihHadiahSchema = z.object({
  pemenangId: z.number().int().positive('Pemenang ID tidak valid'),
  hadiahId: z.number().int().positive('Hadiah ID tidak valid'),
});

/**
 * POST /api/pemenang-hadiah/pilih-hadiah
 * Pemenang memilih hadiah yang diinginkan
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
      AdminRole.KASIR,
    ]);
    if (!authzResult.authorized) {
      return authzResult.response;
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = pilihHadiahSchema.parse(body);
    
    // Check pemenang exists
    const pemenang = await prisma.pemenangHadiah.findUnique({
      where: { id: validatedData.pemenangId },
      include: {
        user: true,
        undian: true,
      },
    });
    
    if (!pemenang) {
      return errorResponse('Pemenang hadiah tidak ditemukan', 404);
    }
    
    if (pemenang.status !== 'BELUM_MEMILIH') {
      return errorResponse('Pemenang sudah memilih hadiah atau status tidak valid', 400);
    }
    
    // Check hadiah exists dan masih tersedia
    const hadiah = await prisma.hadiah.findUnique({
      where: { id: validatedData.hadiahId },
    });
    
    if (!hadiah) {
      return errorResponse('Hadiah tidak ditemukan', 404);
    }
    
    if (!hadiah.aktif) {
      return errorResponse('Hadiah tidak aktif', 400);
    }
    
    // Check stok hadiah
    const stokTersisa = hadiah.stok - hadiah.stokTerpakai;
    if (stokTersisa <= 0) {
      return errorResponse('Hadiah sudah habis stoknya', 400);
    }
    
    // Check tanggal hadiah masih valid
    const now = new Date();
    if (hadiah.tanggalMulai && hadiah.tanggalMulai > now) {
      return errorResponse('Hadiah belum tersedia', 400);
    }
    
    if (hadiah.tanggalSelesai && hadiah.tanggalSelesai < now) {
      return errorResponse('Hadiah sudah tidak tersedia', 400);
    }
    
    // Update pemenang dengan hadiah yang dipilih
    const updatedPemenang = await prisma.pemenangHadiah.update({
      where: { id: validatedData.pemenangId },
      data: {
        hadiahId: validatedData.hadiahId,
        status: 'SUDAH_MEMILIH',
        tanggalPilih: new Date(),
      },
      include: {
        hadiah: {
          select: {
            id: true,
            namaHadiah: true,
            deskripsi: true,
            nilaiHadiah: true,
            gambar: true,
            kategori: {
              select: {
                namaKategori: true,
              },
            },
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
        undian: {
          select: {
            id: true,
            namaUndian: true,
          },
        },
        voucher: {
          select: {
            id: true,
            kodeVoucher: true,
            nomorUndian: true,
          },
        },
      },
    });
    
    // Update stok hadiah
    await prisma.hadiah.update({
      where: { id: validatedData.hadiahId },
      data: {
        stokTerpakai: { increment: 1 },
      },
    });
    
    return successResponse(
      { pemenang: updatedPemenang },
      'Hadiah berhasil dipilih'
    );
  } catch (error) {
    return handleError(error);
  }
}
