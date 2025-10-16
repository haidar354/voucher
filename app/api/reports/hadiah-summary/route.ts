import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse } from '@/lib/response';
import { handleError } from '@/middleware/errorHandler';
import { authenticate } from '@/middleware/auth';
import { authorize } from '@/middleware/authorize';
import { AdminRole } from '@prisma/client';
import { getHadiahStats, getUndianStats } from '@/lib/undian-service';

/**
 * GET /api/reports/hadiah-summary
 * Get hadiah summary report
 */
export async function GET(request: NextRequest) {
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
    
    // Get hadiah statistics
    const hadiahStats = await getHadiahStats();
    const undianStats = await getUndianStats();
    
    // Get hadiah by status
    const hadiahByStatus = await prisma.pemenangHadiah.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });
    
    // Get top hadiah yang paling sering dimenangkan
    const topHadiah = await prisma.pemenangHadiah.groupBy({
      by: ['hadiahId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 10,
    });
    
    // Get detail hadiah untuk top hadiah
    const topHadiahDetails = await Promise.all(
      topHadiah.map(async (item) => {
        const hadiah = await prisma.hadiah.findUnique({
          where: { id: item.hadiahId },
          select: {
            namaHadiah: true,
            nilaiHadiah: true,
            kategori: {
              select: {
                namaKategori: true,
              },
            },
          },
        });
        
        return {
          hadiahId: item.hadiahId,
          namaHadiah: hadiah?.namaHadiah || 'Unknown',
          nilaiHadiah: hadiah?.nilaiHadiah || 0,
          kategori: hadiah?.kategori?.namaKategori || 'Unknown',
          jumlahPemenang: item._count.id,
        };
      })
    );
    
    // Get pemenang hadiah terbaru
    const pemenangTerbaru = await prisma.pemenangHadiah.findMany({
      take: 10,
      orderBy: { tanggalMenang: 'desc' },
      include: {
        hadiah: {
          select: {
            namaHadiah: true,
            nilaiHadiah: true,
          },
        },
        user: {
          select: {
            nama: true,
            noHp: true,
          },
        },
        undian: {
          select: {
            namaUndian: true,
          },
        },
      },
    });
    
    const report = {
      // Hadiah Statistics
      hadiah: {
        totalHadiah: hadiahStats.totalHadiah,
        hadiahAktif: hadiahStats.hadiahAktif,
        hadiahTerbagi: hadiahStats.hadiahTerbagi,
        hadiahBelumDiambil: hadiahStats.hadiahBelumDiambil,
        hadiahSudahDiambil: hadiahStats.hadiahSudahDiambil,
        nilaiTotalHadiah: Number(hadiahStats.nilaiTotalHadiah),
        hadiahByKategori: hadiahStats.hadiahByKategori,
        hadiahByStatus: hadiahByStatus.map((item) => ({
          status: item.status,
          jumlah: item._count.id,
        })),
        topHadiah: topHadiahDetails,
      },
      
      // Undian Statistics
      undian: {
        totalUndian: undianStats.totalUndian,
        undianAktif: undianStats.undianAktif,
        undianSelesai: undianStats.undianSelesai,
        totalPemenang: undianStats.totalPemenang,
        pemenangBelumDiambil: undianStats.pemenangBelumDiambil,
      },
      
      // Recent Winners
      pemenangTerbaru: pemenangTerbaru.map((p) => ({
        id: p.id,
        namaUser: p.user.nama,
        noHp: p.user.noHp,
        namaHadiah: p.hadiah.namaHadiah,
        nilaiHadiah: Number(p.hadiah.nilaiHadiah),
        namaUndian: p.undian.namaUndian,
        status: p.status,
        tanggalMenang: p.tanggalMenang,
        tanggalAmbil: p.tanggalAmbil,
      })),
    };
    
    return successResponse(
      report,
      'Laporan hadiah berhasil diambil'
    );
  } catch (error) {
    return handleError(error);
  }
}
