import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';

/**
 * POST /api/cron/expire-vouchers
 * Mark expired vouchers as KADALUARSA
 * This should be called by a cron job daily
 */
export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    
    // Find all active vouchers that are expired
    const expiredVouchers = await prisma.voucher.findMany({
      where: {
        status: 'AKTIF',
        tanggalKadaluarsa: {
          lt: now,
        },
      },
    });
    
    // Update them in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updates = [];
      
      for (const voucher of expiredVouchers) {
        // Update status
        await tx.voucher.update({
          where: { id: voucher.id },
          data: { status: 'KADALUARSA' },
        });
        
        // Create log
        await tx.logVoucher.create({
          data: {
            voucherId: voucher.id,
            aksi: 'KADALUARSA',
            keterangan: 'Voucher kadaluarsa otomatis oleh sistem',
          },
        });
        
        updates.push(voucher.id);
      }
      
      return updates;
    });
    
    return successResponse(
      {
        totalExpired: result.length,
        voucherIds: result,
      },
      `${result.length} voucher berhasil diupdate menjadi kadaluarsa`
    );
  } catch (error) {
    return handleError(error);
  }
}
