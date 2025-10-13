import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundResponse, errorResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';
import { cancelVoucherSchema } from '@/lib/validations';

/**
 * PATCH /api/voucher/:id/cancel
 * Cancel a voucher (SUPER_ADMIN only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    // Authorize - only SUPER_ADMIN can cancel vouchers
    const authzResult = authorize(authResult.admin, [AdminRole.SUPER_ADMIN]);
    if (!authzResult.authorized) {
      return authzResult.response;
    }
    
    const body = await request.json();
    const validatedData = cancelVoucherSchema.parse(body);
    
    // Check if voucher exists
    const voucher = await prisma.voucher.findUnique({
      where: { id: params.id },
    });
    
    if (!voucher) {
      return notFoundResponse('Voucher tidak ditemukan');
    }
    
    // Check if voucher can be cancelled
    if (voucher.status === 'TERPAKAI') {
      return errorResponse('Voucher yang sudah digunakan tidak dapat dibatalkan', 400);
    }
    
    if (voucher.status === 'DIBATALKAN') {
      return errorResponse('Voucher sudah dibatalkan sebelumnya', 400);
    }
    
    // Cancel voucher
    const updatedVoucher = await prisma.$transaction(async (tx) => {
      const updated = await tx.voucher.update({
        where: { id: params.id },
        data: {
          status: 'DIBATALKAN',
        },
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
            },
          },
        },
      });
      
      // Create log
      await tx.logVoucher.create({
        data: {
          voucherId: params.id,
          aksi: 'DIBATALKAN',
          adminId: authResult.admin.adminId,
          keterangan: validatedData.keterangan || 'Voucher dibatalkan oleh admin',
        },
      });
      
      return updated;
    });
    
    return successResponse(
      { voucher: updatedVoucher },
      'Voucher berhasil dibatalkan'
    );
  } catch (error) {
    return handleError(error);
  }
}
