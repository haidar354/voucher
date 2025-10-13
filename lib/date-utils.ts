import { addDays as fnsAddDays, isAfter, isBefore, isWithinInterval, format } from 'date-fns';

/**
 * Check if a date is within a range
 */
export function isDateInRange(
  date: Date,
  startDate: Date,
  endDate: Date | null
): boolean {
  if (!endDate) {
    return isAfter(date, startDate) || date.getTime() === startDate.getTime();
  }
  
  return isWithinInterval(date, { start: startDate, end: endDate });
}

/**
 * Add days to a date
 */
export function addDays(date: Date, days: number): Date {
  return fnsAddDays(date, days);
}

/**
 * Check if a date is expired (past current date)
 */
export function isExpired(date: Date): boolean {
  return isBefore(date, new Date());
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format date to YYYYMMDD (for voucher code)
 */
export function formatDateCompact(date: Date): string {
  return format(date, 'yyyyMMdd');
}

/**
 * Parse date string to Date object
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}
