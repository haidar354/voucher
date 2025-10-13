import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { updateRuleSchema } from '@/lib/validations';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';

/**
 * PATCH /api/rules/:id
 * Update rule (SUPER_ADMIN or ADMIN only)
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
    const validatedData = updateRuleSchema.parse(body);
    
    // Check if rule exists
    const existingRule = await prisma.ruleVoucher.findUnique({
      where: { id: params.id },
    });
    
    if (!existingRule) {
      return notFoundResponse('Rule tidak ditemukan');
    }
    
    // VALIDASI: Jika rule ini akan diaktifkan, nonaktifkan rule lain dulu
    if (validatedData.aktif === true) {
      await prisma.ruleVoucher.updateMany({
        where: { 
          aktif: true,
          id: { not: params.id } // Kecuali rule ini sendiri
        },
        data: { aktif: false },
      });
    }
    
    // Update rule
    const rule = await prisma.ruleVoucher.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        event: true,
      },
    });
    
    return successResponse(
      { rule },
      'Rule berhasil diupdate'
    );
  } catch (error) {
    return handleError(error);
  }
}
