import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { StatusVoucher } from '@prisma/client';

/**
 * GET /api/voucher?userId=&status=&expired=true/false
 * Get vouchers with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const expiredParam = searchParams.get('expired');
    
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (status && Object.values(StatusVoucher).includes(status as StatusVoucher)) {
      where.status = status as StatusVoucher;
    }
    
    if (expiredParam === 'true') {
      where.tanggalKadaluarsa = {
        lt: new Date(),
      };
    } else if (expiredParam === 'false') {
      where.tanggalKadaluarsa = {
        gte: new Date(),
      };
    }
    
    const vouchers = await prisma.voucher.findMany({
      where,
      include: {
        user: {
          select: {
            nama: true,
            noHp: true,
          },
        },
        rule: {
          select: {
            namaRule: true,
            tipeRule: true,
          },
        },
        transaksi: {
          select: {
            kodeStruk: true,
            tanggalTransaksi: true,
          },
        },
      },
      orderBy: { tanggalDibuat: 'desc' },
      take: 100, // Limit results
    });
    
    return successResponse(
      { vouchers },
      'Data voucher berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
