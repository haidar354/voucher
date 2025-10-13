import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';

/**
 * GET /api/voucher/user/:userId
 * Get user's vouchers grouped by status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    const now = new Date();
    
    // Get active vouchers (not expired)
    const aktif = await prisma.voucher.findMany({
      where: {
        userId: params.userId,
        status: 'AKTIF',
        tanggalKadaluarsa: {
          gte: now,
        },
      },
      include: {
        rule: {
          select: {
            namaRule: true,
          },
        },
      },
      orderBy: { tanggalKadaluarsa: 'asc' },
    });
    
    // Get used vouchers
    const terpakai = await prisma.voucher.findMany({
      where: {
        userId: params.userId,
        status: 'TERPAKAI',
      },
      include: {
        rule: {
          select: {
            namaRule: true,
          },
        },
        transaksiPemakaian: {
          select: {
            kodeStruk: true,
            tanggalTransaksi: true,
          },
        },
      },
      orderBy: { tanggalDigunakan: 'desc' },
      take: 20,
    });
    
    // Get expired vouchers
    const kadaluarsa = await prisma.voucher.findMany({
      where: {
        userId: params.userId,
        OR: [
          { status: 'KADALUARSA' },
          {
            status: 'AKTIF',
            tanggalKadaluarsa: {
              lt: now,
            },
          },
        ],
      },
      include: {
        rule: {
          select: {
            namaRule: true,
          },
        },
      },
      orderBy: { tanggalKadaluarsa: 'desc' },
      take: 20,
    });
    
    return successResponse(
      {
        aktif,
        terpakai,
        kadaluarsa,
        summary: {
          totalAktif: aktif.length,
          totalTerpakai: terpakai.length,
          totalKadaluarsa: kadaluarsa.length,
        },
      },
      'Data voucher user berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
