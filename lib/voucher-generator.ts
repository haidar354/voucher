import { formatDateCompact } from './date-utils';

/**
 * Generate unique voucher code
 * Format: VCH-YYYYMMDD-XXXXX
 * Example: VCH-20240930-A3F2K
 */
export function generateVoucherCode(): string {
  const date = formatDateCompact(new Date());
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `VCH-${date}-${random}`;
}

/**
 * Generate lottery number for voucher
 * Format: XXXX-XXXX-XXXX
 * Example: 1234-5678-9012
 */
export function generateNomorUndian(): string {
  const part1 = Math.floor(1000 + Math.random() * 9000);
  const part2 = Math.floor(1000 + Math.random() * 9000);
  const part3 = Math.floor(1000 + Math.random() * 9000);
  return `${part1}-${part2}-${part3}`;
}

/**
 * Validate voucher code format
 */
export function isValidVoucherCodeFormat(code: string): boolean {
  const pattern = /^VCH-\d{8}-[A-Z0-9]{5}$/;
  return pattern.test(code);
}
