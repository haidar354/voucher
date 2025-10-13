import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { useVoucherSchema } from '@/lib/validations';
import { authenticate } from '@/middleware/auth';
import { isExpired } from '@/lib/date-utils';

/**
 * POST /api/voucher/use
 * Use/redeem a voucher
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    const body = await request.json();
    
    // Validate input
    const validatedData = useVoucherSchema.parse(body);
    
    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Find voucher
      const voucher = await tx.voucher.findUnique({
        where: { kodeVoucher: validatedData.kodeVoucher },
        include: {
          user: {
            select: {
              nama: true,
              noHp: true,
            },
          },
        },
      });
      
      if (!voucher) {
        throw new Error('Kode voucher tidak ditemukan');
      }
      
      // Check status
      if (voucher.status !== 'AKTIF') {
        throw new Error(`Voucher tidak dapat digunakan. Status: ${voucher.status}`);
      }
      
      // Check expiry
      if (isExpired(voucher.tanggalKadaluarsa)) {
        throw new Error('Voucher sudah kadaluarsa');
      }
      
      // Check if transaction exists
      const transaksi = await tx.transaksiBelanja.findUnique({
        where: { id: validatedData.transaksiBelanjaId },
      });
      
      if (!transaksi) {
        throw new Error('Transaksi tidak ditemukan');
      }
      
      // Update voucher status
      const updatedVoucher = await tx.voucher.update({
        where: { id: voucher.id },
        data: {
          status: 'TERPAKAI',
          tanggalDigunakan: new Date(),
          transaksiPemakaianId: validatedData.transaksiBelanjaId,
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
          voucherId: voucher.id,
          aksi: 'DIGUNAKAN',
          adminId: authResult.admin.adminId,
          keterangan: `Voucher digunakan untuk transaksi ${transaksi.kodeStruk}`,
        },
      });
      
      return updatedVoucher;
    });
    
    return successResponse(
      { voucher: result },
      'Voucher berhasil digunakan'
    );
  } catch (error) {
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    return handleError(error);
  }
}
