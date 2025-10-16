import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';
import { z } from 'zod';

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

/**
 * GET /api/hadiah/[id]
 * Get detail hadiah by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const hadiahId = parseInt(params.id);
    
    if (isNaN(hadiahId)) {
      return errorResponse('ID hadiah tidak valid', 400);
    }
    
    // Get hadiah by ID
    const hadiah = await prisma.hadiah.findUnique({
      where: { id: hadiahId },
      include: {
        kategori: {
          select: {
            id: true,
            namaKategori: true,
            deskripsi: true,
          },
        },
        pemenangHadiah: {
          include: {
            user: {
              select: {
                id: true,
                nama: true,
                noHp: true,
              },
            },
            undian: {
              select: {
                id: true,
                namaUndian: true,
              },
            },
          },
          orderBy: { tanggalMenang: 'desc' },
        },
        _count: {
          select: {
            pemenangHadiah: true,
          },
        },
      },
    });
    
    if (!hadiah) {
      return errorResponse('Hadiah tidak ditemukan', 404);
    }
    
    return successResponse(
      { hadiah },
      'Detail hadiah berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/hadiah/[id]
 * Update hadiah (SUPER_ADMIN or ADMIN only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const hadiahId = parseInt(params.id);
    
    if (isNaN(hadiahId)) {
      return errorResponse('ID hadiah tidak valid', 400);
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = updateHadiahSchema.parse(body);
    
    // Check hadiah exists
    const existingHadiah = await prisma.hadiah.findUnique({
      where: { id: hadiahId },
    });
    
    if (!existingHadiah) {
      return errorResponse('Hadiah tidak ditemukan', 404);
    }
    
    // Check kategori exists if kategoriId is being updated
    if (validatedData.kategoriId) {
      const kategori = await prisma.kategoriHadiah.findUnique({
        where: { id: validatedData.kategoriId },
      });
      
      if (!kategori) {
        return errorResponse('Kategori hadiah tidak ditemukan', 404);
      }
    }
    
    // Update hadiah
    const hadiah = await prisma.hadiah.update({
      where: { id: hadiahId },
      data: validatedData,
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
      'Hadiah berhasil diupdate'
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/hadiah/[id]
 * Delete hadiah (SUPER_ADMIN only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    // Authorize
    const authzResult = authorize(authResult.admin, [
      AdminRole.SUPER_ADMIN,
    ]);
    if (!authzResult.authorized) {
      return authzResult.response;
    }
    
    const hadiahId = parseInt(params.id);
    
    if (isNaN(hadiahId)) {
      return errorResponse('ID hadiah tidak valid', 400);
    }
    
    // Check hadiah exists
    const existingHadiah = await prisma.hadiah.findUnique({
      where: { id: hadiahId },
    });
    
    if (!existingHadiah) {
      return errorResponse('Hadiah tidak ditemukan', 404);
    }
    
    // Check if hadiah has pemenang
    const pemenangCount = await prisma.pemenangHadiah.count({
      where: { hadiahId },
    });
    
    if (pemenangCount > 0) {
      return errorResponse(
        'Tidak dapat menghapus hadiah yang sudah ada pemenangnya',
        400
      );
    }
    
    // Delete hadiah
    await prisma.hadiah.delete({
      where: { id: hadiahId },
    });
    
    return successResponse(
      null,
      'Hadiah berhasil dihapus'
    );
  } catch (error) {
    return handleError(error);
  }
}
