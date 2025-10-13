import { TipeRule } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Calculate how many vouchers should be generated based on rule
 */
export function calculateVoucherByRule(
  totalBelanja: number,
  rule: {
    tipeRule: TipeRule;
    nilaiMinimal: Decimal;
    jumlahVoucher: number;
    kelipatanDari: Decimal | null;
  }
): number {
  const nilaiMinimal = Number(rule.nilaiMinimal);
  
  switch (rule.tipeRule) {
    case 'MINIMAL_BELANJA':
      // Jika belanja >= minimal, dapat voucher sejumlah jumlahVoucher
      return totalBelanja >= nilaiMinimal ? rule.jumlahVoucher : 0;
    
    case 'KELIPATAN':
      // Hitung berapa kali kelipatan, kalikan dengan jumlahVoucher
      if (totalBelanja < nilaiMinimal) return 0;
      if (!rule.kelipatanDari) return 0;
      
      const kelipatanDari = Number(rule.kelipatanDari);
      const kelipatan = Math.floor(totalBelanja / kelipatanDari);
      return kelipatan * rule.jumlahVoucher;
    
    case 'EVENT_KHUSUS':
      // Untuk event khusus, cek di logic transaksi apakah ada event aktif
      // Di sini hanya return jumlah base
      return totalBelanja >= nilaiMinimal ? rule.jumlahVoucher : 0;
    
    default:
      return 0;
  }
}

/**
 * Calculate discount amount (placeholder for future use)
 */
export function calculateDiscount(
  totalBelanja: number,
  discountPercent: number
): number {
  return totalBelanja * (discountPercent / 100);
}

/**
 * Format currency to IDR
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}
