import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { createRuleSchema } from '@/lib/validations';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole, TipeRule } from '@prisma/client';

/**
 * POST /api/rules
 * Create new voucher rule (SUPER_ADMIN or ADMIN only)
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
    const validatedData = createRuleSchema.parse(body);
    
    // VALIDASI: Jika rule baru akan aktif, nonaktifkan rule lain dulu
    if (validatedData.aktif) {
      await prisma.ruleVoucher.updateMany({
        where: { aktif: true },
        data: { aktif: false },
      });
    }
    
    // Create rule
    const rule = await prisma.ruleVoucher.create({
      data: {
        namaRule: validatedData.namaRule,
        tipeRule: validatedData.tipeRule,
        nilaiMinimal: validatedData.nilaiMinimal,
        jumlahVoucher: validatedData.jumlahVoucher,
        kelipatanDari: validatedData.kelipatanDari,
        masaBerlakuHari: validatedData.masaBerlakuHari,
        prioritas: validatedData.prioritas,
        akumulasiRule: validatedData.akumulasiRule,
        eventId: validatedData.eventId,
        aktif: validatedData.aktif,
        tanggalMulai: validatedData.tanggalMulai,
        tanggalSelesai: validatedData.tanggalSelesai,
      },
      include: {
        event: true,
      },
    });
    
    return successResponse(
      { rule },
      'Rule voucher berhasil dibuat',
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/rules?aktif=true/false&tipeRule=MINIMAL_BELANJA
 * Get all rules with optional filters
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
    const tipeRuleParam = searchParams.get('tipeRule');
    
    const where: any = {};
    
    if (aktifParam !== null) {
      where.aktif = aktifParam === 'true';
    }
    
    if (tipeRuleParam && Object.values(TipeRule).includes(tipeRuleParam as TipeRule)) {
      where.tipeRule = tipeRuleParam as TipeRule;
    }
    
    const rules = await prisma.ruleVoucher.findMany({
      where,
      include: {
        event: true,
        _count: {
          select: {
            voucher: true,
          },
        },
      },
      orderBy: { prioritas: 'asc' },
    });
    
    return successResponse(
      { rules },
      'Data rule voucher berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
