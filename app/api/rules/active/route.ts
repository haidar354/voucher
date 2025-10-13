import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';

/**
 * GET /api/rules/active
 * Get all active rules (within date range and aktif=true)
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    const today = new Date();
    
    const rules = await prisma.ruleVoucher.findMany({
      where: {
        aktif: true,
        tanggalMulai: {
          lte: today,
        },
        OR: [
          { tanggalSelesai: null },
          { tanggalSelesai: { gte: today } },
        ],
      },
      include: {
        event: true,
      },
      orderBy: { prioritas: 'asc' },
    });
    
    return successResponse(
      { rules },
      'Data rule aktif berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
