import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';

/**
 * GET /api/events/active-today
 * Get active event for today
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    const today = new Date();
    
    const event = await prisma.event.findFirst({
      where: {
        aktif: true,
        tanggalMulai: {
          lte: today,
        },
        tanggalSelesai: {
          gte: today,
        },
      },
      include: {
        ruleVoucher: {
          where: {
            aktif: true,
          },
        },
      },
    });
    
    return successResponse(
      { event },
      event ? 'Event aktif ditemukan' : 'Tidak ada event aktif hari ini'
    );
  } catch (error) {
    return handleError(error);
  }
}
