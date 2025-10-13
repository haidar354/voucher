import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { dateRangeSchema } from '@/lib/validations';
import { TransaksiSummaryReport } from '@/types';
import { formatDate } from '@/lib/date-utils';

/**
 * GET /api/reports/transaksi-summary?startDate=&endDate=
 * Get transaction summary report
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
      where.tanggalTransaksi = {};
      if (dateRange.startDate) {
        where.tanggalTransaksi.gte = dateRange.startDate;
      }
      if (dateRange.endDate) {
        where.tanggalTransaksi.lte = dateRange.endDate;
      }
    }
    
    // Get total transactions
    const totalTransaksi = await prisma.transaksiBelanja.count({ where });
    
    // Get total sales
    const aggregation = await prisma.transaksiBelanja.aggregate({
      where,
      _sum: {
        totalBelanja: true,
      },
      _avg: {
        totalBelanja: true,
      },
    });
    
    const totalBelanja = Number(aggregation._sum.totalBelanja || 0);
    const avgBelanja = Number(aggregation._avg.totalBelanja || 0);
    
    // Get transactions per day
    const transaksiList = await prisma.transaksiBelanja.findMany({
      where,
      select: {
        tanggalTransaksi: true,
        totalBelanja: true,
      },
      orderBy: {
        tanggalTransaksi: 'asc',
      },
    });
    
    // Group by date
    const transaksiPerHariMap = transaksiList.reduce((acc, t) => {
      const date = formatDate(t.tanggalTransaksi);
      if (!acc[date]) {
        acc[date] = {
          tanggal: date,
          jumlah: 0,
          total: 0,
        };
      }
      acc[date].jumlah++;
      acc[date].total += Number(t.totalBelanja);
      return acc;
    }, {} as any);
    
    const transaksiPerHari = Object.values(transaksiPerHariMap);
    
    const report: TransaksiSummaryReport = {
      totalTransaksi,
      totalBelanja,
      avgBelanja,
      transaksiPerHari,
    };
    
    return successResponse(
      report,
      'Laporan transaksi berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
