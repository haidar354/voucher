import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';

/**
 * GET /api/transaksi/:id
 * Get transaction detail with vouchers
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
    
    const transaksi = await prisma.transaksiBelanja.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            noHp: true,
            email: true,
          },
        },
        admin: {
          select: {
            namaLengkap: true,
            username: true,
          },
        },
        voucher: {
          include: {
            rule: {
              select: {
                namaRule: true,
                tipeRule: true,
              },
            },
          },
          orderBy: { tanggalDibuat: 'asc' },
        },
      },
    });
    
    if (!transaksi) {
      return notFoundResponse('Transaksi tidak ditemukan');
    }
    
    return successResponse(
      { transaksi },
      'Detail transaksi berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
