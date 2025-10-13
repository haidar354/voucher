import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, notFoundResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { updateEventSchema } from '@/lib/validations';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';

/**
 * PATCH /api/events/:id
 * Update event (SUPER_ADMIN or ADMIN only)
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
    const validatedData = updateEventSchema.parse(body);
    
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: params.id },
    });
    
    if (!existingEvent) {
      return notFoundResponse('Event tidak ditemukan');
    }
    
    // Update event
    const event = await prisma.event.update({
      where: { id: params.id },
      data: validatedData,
    });
    
    return successResponse(
      { event },
      'Event berhasil diupdate'
    );
  } catch (error) {
    return handleError(error);
  }
}
