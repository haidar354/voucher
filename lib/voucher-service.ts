import { prisma } from './prisma';
import { generateVoucherCode, generateNomorUndian } from './voucher-generator';
import { addDays } from './date-utils';
import { VoucherToGenerate } from '@/types';
import { TipeRule } from '@prisma/client';
import { format } from 'date-fns';

/**
 * Evaluate active rule and determine how many vouchers to generate
 * LOGIKA BARU: HANYA 1 RULE AKTIF PADA SATU WAKTU
 */
export async function evaluateRules(
  totalBelanja: number,
  tanggalTransaksi: Date,
  transaksiData: {
    brandName?: string;
    collectionName?: string;
    collectionYear?: number;
    items?: string; // JSON string
    userMemberTier?: string;
  }
): Promise<VoucherToGenerate[]> {
  // Step 1: Get THE ONLY active rule (hanya 1 rule boleh aktif)
  const activeRule = await prisma.ruleVoucher.findFirst({
    where: {
      aktif: true,
      tanggalMulai: { lte: tanggalTransaksi },
      OR: [
        { tanggalSelesai: null },
        { tanggalSelesai: { gte: tanggalTransaksi } },
      ],
    },
    include: { event: true },
  });

  // Jika tidak ada rule aktif, return empty
  if (!activeRule) {
    return [];
  }

  const vouchersToGenerate: VoucherToGenerate[] = [];
  let jumlahVoucher = 0;
  let voucherValue = 0;

  // Step 2: Evaluate based on rule type
  switch (activeRule.tipeRule) {
    case TipeRule.MINIMAL_BELANJA:
      // Minimal belanja dapat voucher
      if (totalBelanja >= Number(activeRule.nilaiMinimal)) {
        jumlahVoucher = activeRule.jumlahVoucher;
      }
      break;

    case TipeRule.KELIPATAN:
      // Kelipatan nilai belanja
      // Contoh: totalBelanja 250rb, kelipatanDari 100rb, jumlahVoucher 1
      // Hasil: floor(250000/100000) * 1 = 2 * 1 = 2 voucher
      if (totalBelanja >= Number(activeRule.nilaiMinimal) && activeRule.kelipatanDari) {
        const kelipatanDari = Number(activeRule.kelipatanDari);
        const kelipatan = Math.floor(totalBelanja / kelipatanDari);
        jumlahVoucher = kelipatan * activeRule.jumlahVoucher;
        
        console.log('🔢 KELIPATAN DEBUG:', {
          totalBelanja,
          kelipatanDari,
          kelipatan,
          jumlahVoucherPerKelipatan: activeRule.jumlahVoucher,
          totalVoucher: jumlahVoucher
        });
      }
      break;

    case TipeRule.EVENT_KHUSUS:
      // Event khusus dengan bonus
      if (activeRule.eventId && activeRule.event && activeRule.event.aktif) {
        if (totalBelanja >= Number(activeRule.nilaiMinimal)) {
          jumlahVoucher = activeRule.jumlahVoucher + activeRule.event.bonusVoucherKhusus;
        }
      }
      break;

    case TipeRule.BRAND_SPECIFIC:
      // Brand tertentu (Seiko, Casio, dll)
      if (
        transaksiData.brandName &&
        activeRule.brandName &&
        transaksiData.brandName.toLowerCase() === activeRule.brandName.toLowerCase() &&
        totalBelanja >= Number(activeRule.nilaiMinimal)
      ) {
        jumlahVoucher = activeRule.jumlahVoucher;
        voucherValue = Number(activeRule.voucherValue || 0);
      }
      break;

    case TipeRule.HIGH_VALUE_PURCHASE:
      // Pembelian nominal tinggi
      if (totalBelanja >= Number(activeRule.nilaiMinimal)) {
        jumlahVoucher = activeRule.jumlahVoucher;
        voucherValue = Number(activeRule.voucherValue || 0);
      }
      break;

    case TipeRule.NEW_COLLECTION:
      // Koleksi baru
      if (
        transaksiData.collectionName &&
        activeRule.collectionName &&
        transaksiData.collectionName.toLowerCase() === activeRule.collectionName.toLowerCase() &&
        totalBelanja >= Number(activeRule.nilaiMinimal)
      ) {
        // Optional: check collection year
        if (activeRule.collectionYear) {
          if (transaksiData.collectionYear === activeRule.collectionYear) {
            jumlahVoucher = activeRule.jumlahVoucher;
          }
        } else {
          jumlahVoucher = activeRule.jumlahVoucher;
        }
      }
      break;

    case TipeRule.MEMBER_EXCLUSIVE:
      // Member VIP only
      if (
        transaksiData.userMemberTier &&
        activeRule.memberTier &&
        transaksiData.userMemberTier.toLowerCase() === activeRule.memberTier.toLowerCase() &&
        totalBelanja >= Number(activeRule.nilaiMinimal)
      ) {
        jumlahVoucher = activeRule.jumlahVoucher;
      }
      break;

    case TipeRule.TIME_BASED:
      // Waktu tertentu (midnight sale, weekend, dll)
      if (totalBelanja >= Number(activeRule.nilaiMinimal)) {
        let isTimeMatch = false;

        // Check hari khusus
        if (activeRule.hariKhusus) {
          const dayOfWeek = format(tanggalTransaksi, 'EEEE').toUpperCase();
          const hariKhususUpper = activeRule.hariKhusus.toUpperCase();

          if (hariKhususUpper === 'WEEKEND') {
            isTimeMatch = dayOfWeek === 'SATURDAY' || dayOfWeek === 'SUNDAY';
          } else if (hariKhususUpper === 'WEEKDAY') {
            isTimeMatch = !['SATURDAY', 'SUNDAY'].includes(dayOfWeek);
          } else {
            // Specific day: MONDAY, TUESDAY, etc
            isTimeMatch = dayOfWeek === hariKhususUpper;
          }
        }

        // Check jam khusus (midnight sale, dll)
        if (activeRule.jamMulai && activeRule.jamSelesai) {
          const currentTime = format(tanggalTransaksi, 'HH:mm');
          const jamMulai = activeRule.jamMulai;
          const jamSelesai = activeRule.jamSelesai;

          // Handle midnight crossing (e.g., 22:00 - 02:00)
          if (jamSelesai < jamMulai) {
            isTimeMatch = currentTime >= jamMulai || currentTime <= jamSelesai;
          } else {
            isTimeMatch = currentTime >= jamMulai && currentTime <= jamSelesai;
          }
        } else if (!activeRule.hariKhusus) {
          // Jika tidak ada hari khusus dan jam khusus, always match
          isTimeMatch = true;
        }

        if (isTimeMatch) {
          jumlahVoucher = activeRule.jumlahVoucher;
        }
      }
      break;

    case TipeRule.BUNDLING:
      // Beli jam + aksesoris
      if (totalBelanja >= Number(activeRule.nilaiMinimal) && transaksiData.items) {
        try {
          const purchasedItems = JSON.parse(transaksiData.items);
          const requiredItems = activeRule.requiredItems 
            ? JSON.parse(activeRule.requiredItems) 
            : [];

          // Check if all required items are purchased
          const hasAllItems = requiredItems.every((reqItem: string) =>
            purchasedItems.some((item: string) => 
              item.toLowerCase().includes(reqItem.toLowerCase())
            )
          );

          // Check minimum items
          const minItems = activeRule.minItems || requiredItems.length;
          const hasMinItems = purchasedItems.length >= minItems;

          if (hasAllItems && hasMinItems) {
            jumlahVoucher = activeRule.jumlahVoucher;
          }
        } catch (error) {
          console.error('Error parsing items JSON:', error);
        }
      }
      break;
  }

  // If vouchers should be generated, add to list
  if (jumlahVoucher > 0) {
    vouchersToGenerate.push({
      ruleId: activeRule.id,
      jumlah: jumlahVoucher,
      masaBerlakuHari: activeRule.masaBerlakuHari,
      namaRule: activeRule.namaRule,
      voucherValue: voucherValue,
    });
  }

  return vouchersToGenerate;
}

/**
 * Generate vouchers based on evaluation results
 */
export async function generateVouchers(
  transaksiId: string,
  userId: string,
  adminId: string,
  kodeStruk: string,
  vouchersToGenerate: VoucherToGenerate[]
) {
  const vouchers = [];

  for (const voucherRule of vouchersToGenerate) {
    for (let i = 0; i < voucherRule.jumlah; i++) {
      // Generate unique voucher code
      let kodeVoucher = generateVoucherCode();
      
      // Ensure uniqueness (very rare collision, but handle it)
      let attempts = 0;
      while (attempts < 5) {
        const existing = await prisma.voucher.findUnique({
          where: { kodeVoucher },
        });
        
        if (!existing) break;
        
        kodeVoucher = generateVoucherCode();
        attempts++;
      }

      // Calculate expiry date
      const tanggalKadaluarsa = addDays(new Date(), voucherRule.masaBerlakuHari);

      // Generate lottery number (optional feature)
      const nomorUndian = generateNomorUndian();

      // Create voucher
      const voucher = await prisma.voucher.create({
        data: {
          userId,
          transaksiId,
          ruleId: voucherRule.ruleId,
          kodeVoucher,
          nomorUndian,
          tanggalKadaluarsa,
          status: 'AKTIF',
        },
      });

      // Create audit log
      await prisma.logVoucher.create({
        data: {
          voucherId: voucher.id,
          aksi: 'DIBUAT',
          adminId: adminId,
          keterangan: `Voucher dibuat dari transaksi ${kodeStruk}`,
        },
      });

      vouchers.push(voucher);
    }
  }

  return vouchers;
}

/**
 * Complete transaction processing with voucher generation
 * This is the main entry point for creating a transaction
 */
export async function processTransaksi(
  userId: string,
  kodeStruk: string,
  totalBelanja: number,
  adminId: string,
  tanggalTransaksi: Date = new Date(),
  catatan?: string,
  transaksiData?: {
    brandName?: string;
    collectionName?: string;
    collectionYear?: number;
    items?: string;
  }
) {
  // Use transaction to ensure atomicity
  return await prisma.$transaction(async (tx) => {
    // Step 1: Get user data for member tier
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        nama: true,
        noHp: true,
        memberTier: true,
      },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    // Step 2: Create transaction record
    const transaksi = await tx.transaksiBelanja.create({
      data: {
        userId,
        kodeStruk,
        totalBelanja,
        tanggalTransaksi,
        adminId,
        catatan,
        brandName: transaksiData?.brandName,
        collectionName: transaksiData?.collectionName,
        collectionYear: transaksiData?.collectionYear,
        items: transaksiData?.items,
      },
      include: {
        user: {
          select: {
            nama: true,
            noHp: true,
            memberTier: true,
          },
        },
      },
    });

    // Step 3: Evaluate rules to determine vouchers
    const vouchersToGenerate = await evaluateRules(
      totalBelanja,
      tanggalTransaksi,
      {
        brandName: transaksiData?.brandName,
        collectionName: transaksiData?.collectionName,
        collectionYear: transaksiData?.collectionYear,
        items: transaksiData?.items,
        userMemberTier: user.memberTier || undefined,
      }
    );

    // Step 3: Generate vouchers
    const vouchers = [];
    for (const voucherRule of vouchersToGenerate) {
      for (let i = 0; i < voucherRule.jumlah; i++) {
        let kodeVoucher = generateVoucherCode();
        
        // Ensure uniqueness
        let attempts = 0;
        while (attempts < 5) {
          const existing = await tx.voucher.findUnique({
            where: { kodeVoucher },
          });
          
          if (!existing) break;
          
          kodeVoucher = generateVoucherCode();
          attempts++;
        }

        const tanggalKadaluarsa = addDays(new Date(), voucherRule.masaBerlakuHari);
        const nomorUndian = generateNomorUndian();

        const voucher = await tx.voucher.create({
          data: {
            userId,
            transaksiId: transaksi.id,
            ruleId: voucherRule.ruleId,
            kodeVoucher,
            nomorUndian,
            tanggalKadaluarsa,
            status: 'AKTIF',
          },
        });

        await tx.logVoucher.create({
          data: {
            voucherId: voucher.id,
            aksi: 'DIBUAT',
            adminId: adminId,
            keterangan: `Voucher dibuat dari transaksi ${kodeStruk}`,
          },
        });

        vouchers.push(voucher);
      }
    }

    // Step 4: Return complete result
    return {
      transaksi,
      vouchers,
      vouchersToGenerate,
    };
  });
}
