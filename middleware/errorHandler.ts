import { Prisma } from '@prisma/client';
import { errorResponse } from '@/lib/response';
import { ZodError } from 'zod';

/**
 * Handle Prisma errors and return appropriate response
 */
export function handlePrismaError(error: unknown): Response {
  console.error('Prisma Error:', error);

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = (error.meta?.target as string[]) || [];
        return errorResponse(
          `Data dengan ${target.join(', ')} sudah ada`,
          409,
          'DUPLICATE_ENTRY'
        );
      
      case 'P2025':
        // Record not found
        return errorResponse('Data tidak ditemukan', 404, 'NOT_FOUND');
      
      case 'P2003':
        // Foreign key constraint violation
        return errorResponse(
          'Tidak dapat menghapus data karena masih terkait dengan data lain',
          400,
          'FOREIGN_KEY_CONSTRAINT'
        );
      
      default:
        return errorResponse(
          'Terjadi kesalahan pada database',
          500,
          error.code
        );
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return errorResponse('Data tidak valid', 400, 'VALIDATION_ERROR');
  }

  return errorResponse('Terjadi kesalahan internal', 500, 'INTERNAL_ERROR');
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): Response {
  const errors = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return errorResponse(
    'Validasi gagal',
    400,
    JSON.stringify(errors)
  );
}

/**
 * Generic error handler
 */
export function handleError(error: unknown): Response {
  console.error('Error:', error);

  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientValidationError) {
    return handlePrismaError(error);
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500, 'ERROR');
  }

  return errorResponse('Terjadi kesalahan yang tidak diketahui', 500, 'UNKNOWN_ERROR');
}
