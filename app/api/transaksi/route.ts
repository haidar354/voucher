import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { createTransaksiSchema, paginationSchema } from '@/lib/validations';
import { authenticate } from '@/middleware/auth';
import { processTransaksi } from '@/lib/voucher-service';
import { TransaksiResponse } from '@/types';

/**
 * POST /api/transaksi
 * Create transaction and auto-generate vouchers
 * THIS IS THE MOST IMPORTANT ENDPOINT
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
    const validatedData = createTransaksiSchema.parse(body);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId },
    });
    
    if (!user) {
      return errorResponse('User tidak ditemukan', 404);
    }
    
    // Check if kodeStruk is unique
    const existingTransaksi = await prisma.transaksiBelanja.findUnique({
      where: { kodeStruk: validatedData.kodeStruk },
    });
    
    if (existingTransaksi) {
      return errorResponse('Kode struk sudah digunakan', 409);
    }
    
    // Process transaction with voucher generation
    const result = await processTransaksi(
      validatedData.userId,
      validatedData.kodeStruk,
      validatedData.totalBelanja,
      authResult.admin.adminId,
      validatedData.tanggalTransaksi || new Date(),
      validatedData.catatan,
      {
        brandName: validatedData.brandName,
        collectionName: validatedData.collectionName,
        collectionYear: validatedData.collectionYear,
        items: validatedData.items,
      }
    );
    
    // Format response
    const response: TransaksiResponse = {
      transaksi: {
        id: result.transaksi.id,
        kodeStruk: result.transaksi.kodeStruk,
        totalBelanja: Number(result.transaksi.totalBelanja),
        tanggalTransaksi: result.transaksi.tanggalTransaksi,
        user: {
          nama: result.transaksi.user.nama,
          noHp: result.transaksi.user.noHp,
        },
      },
      vouchersGenerated: result.vouchers.map((v) => ({
        kodeVoucher: v.kodeVoucher,
        tanggalKadaluarsa: v.tanggalKadaluarsa,
        status: v.status,
        nomorUndian: v.nomorUndian || undefined,
      })),
      summary: {
        totalVoucher: result.vouchers.length,
        rules: result.vouchersToGenerate.map((v) => v.namaRule),
      },
    };
    
    return successResponse(
      response,
      `Transaksi berhasil dibuat. ${result.vouchers.length} voucher telah digenerate.`,
      201
    );
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/transaksi?userId=&startDate=&endDate=&page=1&limit=10
 * Get transactions with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate
    const authResult = await authenticate(request);
    if (!authResult.authenticated) {
      return authResult.response;
    }
    
    const { searchParams } = new URL(request.url);
    
    // Parse query params
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const paginationParams = paginationSchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 10,
    });
    
    // Build where clause
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (startDate || endDate) {
      where.tanggalTransaksi = {};
      if (startDate) {
        where.tanggalTransaksi.gte = new Date(startDate);
      }
      if (endDate) {
        where.tanggalTransaksi.lte = new Date(endDate);
      }
    }
    
    // Get total count
    const total = await prisma.transaksiBelanja.count({ where });
    
    // Get paginated data
    const transaksi = await prisma.transaksiBelanja.findMany({
      where,
      include: {
        user: {
          select: {
            nama: true,
            noHp: true,
          },
        },
        admin: {
          select: {
            namaLengkap: true,
          },
        },
        _count: {
          select: {
            voucher: true,
          },
        },
      },
      orderBy: { tanggalTransaksi: 'desc' },
      skip: (paginationParams.page - 1) * paginationParams.limit,
      take: paginationParams.limit,
    });
    
    return successResponse(
      {
        transaksi,
        pagination: {
          page: paginationParams.page,
          limit: paginationParams.limit,
          total,
          totalPages: Math.ceil(total / paginationParams.limit),
        },
      },
      'Data transaksi berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
