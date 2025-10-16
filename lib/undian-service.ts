import { prisma } from './prisma';

/**
 * Service untuk mengelola sistem undian dan hadiah
 */

export interface UndiPemenangResult {
  pemenangHadiah: any[];
  summary: {
    totalPemenang: number;
    undianId: number;
    namaUndian: string;
  };
}

/**
 * Undi pemenang hadiah dari voucher dengan nomor undian
 * LOGIC BARU: Hanya menentukan siapa yang menang, TIDAK assign hadiah
 */
export async function undiPemenangHadiah(
  undianId: number,
  jumlahPemenang: number
): Promise<UndiPemenangResult> {
  // 1. Get undian info
  const undian = await prisma.undian.findUnique({
    where: { id: undianId },
  });

  if (!undian) {
    throw new Error('Undian tidak ditemukan');
  }

  if (undian.status !== 'AKTIF') {
    throw new Error('Undian tidak aktif');
  }

  // 2. Get semua voucher dengan nomor undian dari periode undian
  const vouchers = await prisma.voucher.findMany({
    where: {
      nomorUndian: { not: null },
      tanggalDibuat: {
        gte: undian.tanggalMulai,
        lte: undian.tanggalSelesai,
      },
      status: 'AKTIF',
    },
    include: {
      user: true,
    },
  });

  if (vouchers.length === 0) {
    throw new Error('Tidak ada voucher dengan nomor undian pada periode ini');
  }

  if (vouchers.length < jumlahPemenang) {
    throw new Error(
      `Jumlah voucher (${vouchers.length}) kurang dari jumlah pemenang yang diminta (${jumlahPemenang})`
    );
  }

  // 3. Random select pemenang (TIDAK assign hadiah)
  const shuffledVouchers = shuffleArray(vouchers);
  const pemenang = shuffledVouchers.slice(0, jumlahPemenang);

  // 4. Create pemenang hadiah TANPA assign hadiah
  const result = await prisma.$transaction(async (tx) => {
    const pemenangHadiah = [];

    for (const voucher of pemenang) {
      // Create pemenang hadiah dengan hadiahId = NULL
      const pemenangData = await tx.pemenangHadiah.create({
        data: {
          undianId: undian.id,
          hadiahId: null, // NULL sampai pemenang memilih hadiah
          userId: voucher.userId,
          voucherId: voucher.id,
          nomorUndian: voucher.nomorUndian,
          status: 'BELUM_MEMILIH', // Status baru
        },
        include: {
          user: true,
        },
      });

      pemenangHadiah.push(pemenangData);
    }

    // Update undian
    await tx.undian.update({
      where: { id: undian.id },
      data: {
        hadiahTerbagi: { increment: pemenang.length },
      },
    });

    return pemenangHadiah;
  });

  return {
    pemenangHadiah: result,
    summary: {
      totalPemenang: pemenang.length,
      undianId: undian.id,
      namaUndian: undian.namaUndian,
    },
  };
}

/**
 * Pilih hadiah untuk pemenang
 */
export async function pilihHadiah(
  pemenangId: number,
  hadiahId: number
) {
  // Check pemenang exists
  const pemenang = await prisma.pemenangHadiah.findUnique({
    where: { id: pemenangId },
  });

  if (!pemenang) {
    throw new Error('Pemenang hadiah tidak ditemukan');
  }

  if (pemenang.status !== 'BELUM_MEMILIH') {
    throw new Error('Pemenang sudah memilih hadiah atau status tidak valid');
  }

  // Check hadiah exists dan masih tersedia
  const hadiah = await prisma.hadiah.findUnique({
    where: { id: hadiahId },
  });

  if (!hadiah) {
    throw new Error('Hadiah tidak ditemukan');
  }

  if (!hadiah.aktif) {
    throw new Error('Hadiah tidak aktif');
  }

  // Check stok hadiah
  const stokTersisa = hadiah.stok - hadiah.stokTerpakai;
  if (stokTersisa <= 0) {
    throw new Error('Hadiah sudah habis stoknya');
  }

  // Update pemenang dengan hadiah yang dipilih
  const updatedPemenang = await prisma.pemenangHadiah.update({
    where: { id: pemenangId },
    data: {
      hadiahId: hadiahId,
      status: 'SUDAH_MEMILIH',
      tanggalPilih: new Date(),
    },
    include: {
      hadiah: true,
      user: true,
    },
  });

  // Update stok hadiah
  await prisma.hadiah.update({
    where: { id: hadiahId },
    data: {
      stokTerpakai: { increment: 1 },
    },
  });

  return updatedPemenang;
}

/**
 * Ambil hadiah (update status menjadi SUDAH_DIAMBIL)
 */
export async function ambilHadiah(
  pemenangId: number,
  adminId: number,
  catatan?: string
) {
  const pemenang = await prisma.pemenangHadiah.findUnique({
    where: { id: pemenangId },
    include: {
      hadiah: true,
      user: true,
    },
  });

  if (!pemenang) {
    throw new Error('Pemenang hadiah tidak ditemukan');
  }

  if (pemenang.status !== 'SUDAH_MEMILIH') {
    throw new Error('Pemenang belum memilih hadiah atau hadiah sudah diambil');
  }

  // Update status
  const updatedPemenang = await prisma.pemenangHadiah.update({
    where: { id: pemenangId },
    data: {
      status: 'SUDAH_DIAMBIL',
      tanggalAmbil: new Date(),
      adminAmbil: adminId,
      catatan: catatan,
    },
    include: {
      hadiah: true,
      user: true,
      admin: {
        select: {
          namaLengkap: true,
        },
      },
    },
  });

  return updatedPemenang;
}

/**
 * Get statistik hadiah
 */
export async function getHadiahStats() {
  const [
    totalHadiah,
    hadiahAktif,
    hadiahTerbagi,
    hadiahBelumDiambil,
    hadiahSudahDiambil,
    nilaiTotalHadiah,
  ] = await Promise.all([
    prisma.hadiah.count(),
    prisma.hadiah.count({ where: { aktif: true } }),
    prisma.pemenangHadiah.count(),
    prisma.pemenangHadiah.count({ where: { status: 'BELUM_DIAMBIL' } }),
    prisma.pemenangHadiah.count({ where: { status: 'SUDAH_DIAMBIL' } }),
    prisma.hadiah.aggregate({
      where: { aktif: true },
      _sum: { nilaiHadiah: true },
    }),
  ]);

  const hadiahByKategori = await prisma.kategoriHadiah.findMany({
    include: {
      _count: {
        select: {
          hadiah: true,
        },
      },
    },
  });

  return {
    totalHadiah,
    hadiahAktif,
    hadiahTerbagi,
    hadiahBelumDiambil,
    hadiahSudahDiambil,
    nilaiTotalHadiah: nilaiTotalHadiah._sum.nilaiHadiah || 0,
    hadiahByKategori: hadiahByKategori.map((k) => ({
      kategori: k.namaKategori,
      jumlah: k._count.hadiah,
    })),
  };
}

/**
 * Get statistik undian
 */
export async function getUndianStats() {
  const [
    totalUndian,
    undianAktif,
    undianSelesai,
    totalPemenang,
    pemenangBelumDiambil,
  ] = await Promise.all([
    prisma.undian.count(),
    prisma.undian.count({ where: { status: 'AKTIF' } }),
    prisma.undian.count({ where: { status: 'SELESAI' } }),
    prisma.pemenangHadiah.count(),
    prisma.pemenangHadiah.count({ where: { status: 'BELUM_DIAMBIL' } }),
  ]);

  return {
    totalUndian,
    undianAktif,
    undianSelesai,
    totalPemenang,
    pemenangBelumDiambil,
  };
}

/**
 * Helper function to shuffle array
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get hadiah yang tersedia untuk undian
 */
export async function getHadiahTersedia() {
  return await prisma.hadiah.findMany({
    where: {
      aktif: true,
      stok: { gt: 0 },
      OR: [
        { tanggalMulai: null },
        { tanggalMulai: { lte: new Date() } },
      ],
      AND: [
        {
          OR: [
            { tanggalSelesai: null },
            { tanggalSelesai: { gte: new Date() } },
          ],
        },
      ],
    },
    include: {
      kategori: {
        select: {
          namaKategori: true,
        },
      },
    },
    orderBy: { nilaiHadiah: 'desc' },
  });
}

/**
 * Get voucher dengan nomor undian untuk periode tertentu
 */
export async function getVoucherUndian(
  tanggalMulai: Date,
  tanggalSelesai: Date
) {
  return await prisma.voucher.findMany({
    where: {
      nomorUndian: { not: null },
      tanggalDibuat: {
        gte: tanggalMulai,
        lte: tanggalSelesai,
      },
      status: 'AKTIF',
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
    },
    orderBy: { tanggalDibuat: 'asc' },
  });
}
