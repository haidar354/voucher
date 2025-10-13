import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';

/**
 * GET /api/users/:id
 * Get user detail with transactions and vouchers
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
    
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        transaksi: {
          select: {
            id: true,
            kodeStruk: true,
            totalBelanja: true,
            tanggalTransaksi: true,
            _count: {
              select: {
                voucher: true,
              },
            },
          },
          orderBy: { tanggalTransaksi: 'desc' },
          take: 10, // Last 10 transactions
        },
        voucher: {
          where: {
            status: 'AKTIF',
            tanggalKadaluarsa: {
              gte: new Date(),
            },
          },
          select: {
            id: true,
            kodeVoucher: true,
            tanggalDibuat: true,
            tanggalKadaluarsa: true,
            status: true,
            rule: {
              select: {
                namaRule: true,
              },
            },
          },
          orderBy: { tanggalKadaluarsa: 'asc' },
        },
      },
    });
    
    if (!user) {
      return notFoundResponse('User tidak ditemukan');
    }
    
    return successResponse(
      { user },
      'Detail user berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
