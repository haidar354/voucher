import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { dateRangeSchema } from '@/lib/validations';
import { VoucherSummaryReport } from '@/types';

/**
 * GET /api/reports/voucher-summary?startDate=&endDate=
 * Get voucher summary report
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    const { searchParams } = new URL(request.url);
    
    const dateRange = dateRangeSchema.parse({
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
    });
    
    const where: any = {};
    
    if (dateRange.startDate || dateRange.endDate) {
      where.tanggalDibuat = {};
      if (dateRange.startDate) {
        where.tanggalDibuat.gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        where.tanggalDibuat.lte = dateRange.endDate;
      }
    }
    
    // Get total vouchers created
    const totalDibuat = await prisma.voucher.count({ where });
    
    // Get total vouchers used
    const totalDigunakan = await prisma.voucher.count({
      where: {
        ...where,
        status: 'TERPAKAI',
      },
    });
    
    // Get total vouchers expired
    const totalKadaluarsa = await prisma.voucher.count({
      where: {
        ...where,
        status: 'KADALUARSA',
      },
    });
    
    // Calculate usage rate
    const tingkatPenggunaan = totalDibuat > 0 
      ? Math.round((totalDigunakan / totalDibuat) * 100) 
      : 0;
    
    // Get vouchers by rule
    const vouchersByRule = await prisma.voucher.groupBy({
      by: ['ruleId'],
      where,
      _count: {
        id: true,
      },
    });
    
    const voucherByRule = await Promise.all(
      vouchersByRule.map(async (item) => {
        const rule = await prisma.ruleVoucher.findUnique({
          where: { id: item.ruleId },
          select: { namaRule: true },
        });
        return {
          namaRule: rule?.namaRule || 'Unknown',
          jumlah: item._count.id,
        };
      })
    );
    
    // Get vouchers by status
    const vouchersByStatus = await prisma.voucher.groupBy({
      by: ['status'],
      where,
      _count: {
        id: true,
      },
    });
    
    const voucherByStatus = vouchersByStatus.map((item) => ({
      status: item.status,
      jumlah: item._count.id,
    }));
    
    const report: VoucherSummaryReport = {
      totalDibuat,
      totalDigunakan,
      totalKadaluarsa,
      tingkatPenggunaan,
      voucherByRule,
      voucherByStatus,
    };
    
    return successResponse(
      report,
      'Laporan voucher berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
