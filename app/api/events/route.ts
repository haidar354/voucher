import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { createEventSchema } from '@/lib/validations';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';

/**
 * POST /api/events
 * Create new event (SUPER_ADMIN or ADMIN only)
 */
export async function POST(request: NextRequest) {
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
    
    const body = await request.json();
    
    // Validate input
    const validatedData = createEventSchema.parse(body);
    
    // Create event
    const event = await prisma.event.create({
      data: {
        namaEvent: validatedData.namaEvent,
        deskripsi: validatedData.deskripsi,
        tanggalMulai: validatedData.tanggalMulai,
        tanggalSelesai: validatedData.tanggalSelesai,
        bonusVoucherKhusus: validatedData.bonusVoucherKhusus,
        aktif: validatedData.aktif,
      },
    });
    
    return successResponse(
      { event },
      'Event berhasil dibuat',
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/events?aktif=true/false
 * Get all events with optional filter
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    const { searchParams } = new URL(request.url);
    const aktifParam = searchParams.get('aktif');
    
    const where = aktifParam !== null ? {
      aktif: aktifParam === 'true',
    } : {};
    
    const events = await prisma.event.findMany({
      where,
      include: {
        _count: {
          select: {
            ruleVoucher: true,
          },
        },
      },
      orderBy: { tanggalMulai: 'desc' },
    });
    
    return successResponse(
      { events },
      'Data event berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
