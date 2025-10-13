import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { addDays } from '@/lib/date-utils';

/**
 * POST /api/cron/notify-expiring
 * Get vouchers expiring in 7 days for notification
 * This should be called by a cron job daily
 */
export async function POST(request: NextRequest) {
  try {
    const now = new Date();
    const sevenDaysFromNow = addDays(now, 7);
    
    // Find active vouchers expiring in the next 7 days
    const expiringVouchers = await prisma.voucher.findMany({
      where: {
        status: 'AKTIF',
        tanggalKadaluarsa: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            noHp: true,
            email: true,
          },
        },
        rule: {
          select: {
            namaRule: true,
          },
        },
      },
      orderBy: {
        tanggalKadaluarsa: 'asc',
      },
    });
    
    // Group by user for easier notification
    const notificationsByUser = expiringVouchers.reduce((acc, voucher) => {
      const userId = voucher.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: voucher.user,
          vouchers: [],
        };
      }
      acc[userId].vouchers.push({
        kodeVoucher: voucher.kodeVoucher,
        tanggalKadaluarsa: voucher.tanggalKadaluarsa,
        namaRule: voucher.rule.namaRule,
      });
      return acc;
    }, {} as any);
    
    const totalUsers = Object.keys(notificationsByUser).length;
    
    // Here you would integrate with your notification service
    // (SMS, Email, WhatsApp, etc.)
    // For now, we just return the data
    
    return successResponse(
      {
        totalNotified: totalUsers,
        totalVouchers: expiringVouchers.length,
        notifications: notificationsByUser,
      },
      `${totalUsers} user memiliki ${expiringVouchers.length} voucher yang akan kadaluarsa dalam 7 hari`
    );
  } catch (error) {
    return handleError(error);
  }
}
