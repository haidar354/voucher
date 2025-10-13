import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { UserLeaderboard } from '@/types';

/**
 * GET /api/reports/user-leaderboard?limit=10
 * Get top users by total spending and vouchers
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Get users with their transaction and voucher counts
    const users = await prisma.user.findMany({
      include: {
        transaksi: {
          select: {
            totalBelanja: true,
          },
        },
        _count: {
          select: {
            transaksi: true,
            voucher: true,
          },
        },
      },
    });
    
    // Calculate totals and create leaderboard
    const leaderboard: UserLeaderboard[] = users
      .map((user) => {
        const totalBelanja = user.transaksi.reduce(
          (sum, t) => sum + Number(t.totalBelanja),
          0
        );
        
        return {
          userId: user.id,
          nama: user.nama,
          noHp: user.noHp,
          totalBelanja,
          totalTransaksi: user._count.transaksi,
          totalVoucher: user._count.voucher,
        };
      })
      .filter((user) => user.totalTransaksi > 0) // Only users with transactions
      .sort((a, b) => b.totalBelanja - a.totalBelanja) // Sort by total spending
      .slice(0, limit);
    
    return successResponse(
      { leaderboard },
      'Leaderboard user berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
