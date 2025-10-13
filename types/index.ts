import { AdminRole, TipeRule, StatusVoucher, AksiLog } from '@prisma/client';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta;
}

// Auth Types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: {
    id: string;
    username: string;
    namaLengkap: string;
    role: AdminRole;
  };
}

export interface JWTPayload {
  adminId: string;
  username: string;
  role: AdminRole;
  iat?: number;
  exp?: number;
}

// User Types
export interface CreateUserRequest {
  nama: string;
  email?: string;
  noHp: string;
  alamat?: string;
  memberTier?: string; // VIP, GOLD, SILVER, BRONZE
}

// Event Types
export interface CreateEventRequest {
  namaEvent: string;
  deskripsi?: string;
  tanggalMulai: Date | string;
  tanggalSelesai: Date | string;
  bonusVoucherKhusus: number;
  aktif: boolean;
}

// Rule Voucher Types
export interface CreateRuleRequest {
  namaRule: string;
  tipeRule: TipeRule;
  nilaiMinimal: number;
  jumlahVoucher: number;
  kelipatanDari?: number;
  masaBerlakuHari: number;
  prioritas: number;
  akumulasiRule: boolean;
  eventId?: string;
  aktif: boolean;
  tanggalMulai: Date | string;
  tanggalSelesai?: Date | string;
}

// Transaksi Types
export interface CreateTransaksiRequest {
  userId: string;
  kodeStruk: string;
  totalBelanja: number;
  tanggalTransaksi?: Date | string;
  catatan?: string;
  // Field tambahan untuk rule baru
  brandName?: string;
  collectionName?: string;
  collectionYear?: number;
  items?: string; // JSON array: ["jam", "tali_kulit"]
}

export interface VoucherGenerated {
  kodeVoucher: string;
  tanggalKadaluarsa: Date;
  status: StatusVoucher;
  nomorUndian?: string;
}

export interface TransaksiResponse {
  transaksi: {
    id: string;
    kodeStruk: string;
    totalBelanja: number;
    tanggalTransaksi: Date;
    user: {
      nama: string;
      noHp: string;
    };
  };
  vouchersGenerated: VoucherGenerated[];
  summary: {
    totalVoucher: number;
    rules: string[];
  };
}

// Voucher Types
export interface ValidateVoucherRequest {
  kodeVoucher: string;
}

export interface UseVoucherRequest {
  kodeVoucher: string;
  transaksiBelanjaId: string;
}

export interface VoucherValidationResponse {
  valid: boolean;
  voucher?: {
    id: string;
    kodeVoucher: string;
    status: StatusVoucher;
    tanggalKadaluarsa: Date;
    user: {
      nama: string;
      noHp: string;
    };
  };
  message: string;
}

// Internal Types for Voucher Generation
export interface VoucherToGenerate {
  ruleId: string;
  jumlah: number;
  masaBerlakuHari: number;
  namaRule: string;
  voucherValue?: number; // Nilai voucher (untuk HIGH_VALUE_PURCHASE, BRAND_SPECIFIC)
}

// Report Types
export interface VoucherSummaryReport {
  totalDibuat: number;
  totalDigunakan: number;
  totalKadaluarsa: number;
  tingkatPenggunaan: number;
  voucherByRule: Array<{
    namaRule: string;
    jumlah: number;
  }>;
  voucherByStatus: Array<{
    status: StatusVoucher;
    jumlah: number;
  }>;
}

export interface TransaksiSummaryReport {
  totalTransaksi: number;
  totalBelanja: number;
  avgBelanja: number;
  transaksiPerHari: Array<{
    tanggal: string;
    jumlah: number;
    total: number;
  }>;
}

export interface UserLeaderboard {
  userId: string;
  nama: string;
  noHp: string;
  totalBelanja: number;
  totalTransaksi: number;
  totalVoucher: number;
}

// Admin Types
export interface CreateAdminRequest {
  username: string;
  password: string;
  namaLengkap: string;
  role: AdminRole;
}
