import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { validateVoucherSchema } from '@/lib/validations';
import { authenticate } from '@/middleware/auth';
import { VoucherValidationResponse } from '@/types';
import { isExpired } from '@/lib/date-utils';

/**
 * POST /api/voucher/validate
 * Validate voucher code
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
    const validatedData = validateVoucherSchema.parse(body);
    
    // Find voucher
    const voucher = await prisma.voucher.findUnique({
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
      const response: VoucherValidationResponse = {
        valid: false,
        message: 'Kode voucher tidak ditemukan',
      };
      return successResponse(response, 'Validasi voucher');
    }
    
    // Check status
    if (voucher.status !== 'AKTIF') {
      const response: VoucherValidationResponse = {
        valid: false,
        voucher: {
          id: voucher.id,
          kodeVoucher: voucher.kodeVoucher,
          status: voucher.status,
          tanggalKadaluarsa: voucher.tanggalKadaluarsa,
          user: voucher.user,
        },
        message: `Voucher tidak dapat digunakan. Status: ${voucher.status}`,
      };
      return successResponse(response, 'Validasi voucher');
    }
    
    // Check expiry
    if (isExpired(voucher.tanggalKadaluarsa)) {
      const response: VoucherValidationResponse = {
        valid: false,
        voucher: {
          id: voucher.id,
          kodeVoucher: voucher.kodeVoucher,
          status: voucher.status,
          tanggalKadaluarsa: voucher.tanggalKadaluarsa,
          user: voucher.user,
        },
        message: 'Voucher sudah kadaluarsa',
      };
      return successResponse(response, 'Validasi voucher');
    }
    
    // Voucher is valid
    const response: VoucherValidationResponse = {
      valid: true,
      voucher: {
        id: voucher.id,
        kodeVoucher: voucher.kodeVoucher,
        status: voucher.status,
        tanggalKadaluarsa: voucher.tanggalKadaluarsa,
        user: voucher.user,
      },
      message: 'Voucher valid dan dapat digunakan',
    };
    
    return successResponse(response, 'Validasi voucher');
  } catch (error) {
    return handleError(error);
  }
}
