import { z } from 'zod';
import { AdminRole, TipeRule } from '@prisma/client';

// Auth Schemas
export const loginSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const registerAdminSchema = z.object({
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  namaLengkap: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  role: z.nativeEnum(AdminRole),
});

// User Schemas
export const createUserSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  noHp: z.string().min(10, 'Nomor HP minimal 10 digit').max(15, 'Nomor HP maksimal 15 digit'),
  alamat: z.string().optional(),
  memberTier: z.string().optional(), // VIP, GOLD, SILVER, BRONZE
});

export const updateUserSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  noHp: z.string().min(10, 'Nomor HP minimal 10 digit').max(15, 'Nomor HP maksimal 15 digit').optional(),
  alamat: z.string().optional(),
  memberTier: z.string().optional(),
});

// Event Schemas
export const createEventSchema = z.object({
  namaEvent: z.string().min(3, 'Nama event minimal 3 karakter'),
  deskripsi: z.string().optional(),
  tanggalMulai: z.coerce.date(),
  tanggalSelesai: z.coerce.date(),
  bonusVoucherKhusus: z.number().int().min(0, 'Bonus voucher tidak boleh negatif'),
  aktif: z.boolean().default(true),
}).refine(
  (data) => data.tanggalSelesai >= data.tanggalMulai,
  {
    message: 'Tanggal selesai harus setelah atau sama dengan tanggal mulai',
    path: ['tanggalSelesai'],
  }
);

export const updateEventSchema = z.object({
  namaEvent: z.string().min(3, 'Nama event minimal 3 karakter').optional(),
  deskripsi: z.string().optional(),
  tanggalMulai: z.coerce.date().optional(),
  tanggalSelesai: z.coerce.date().optional(),
  bonusVoucherKhusus: z.number().int().min(0, 'Bonus voucher tidak boleh negatif').optional(),
  aktif: z.boolean().optional(),
});

// Rule Voucher Schemas
export const createRuleSchema = z.object({
  namaRule: z.string().min(3, 'Nama rule minimal 3 karakter'),
  tipeRule: z.nativeEnum(TipeRule),
  nilaiMinimal: z.number().positive('Nilai minimal harus positif'),
  jumlahVoucher: z.number().int().positive('Jumlah voucher harus positif'),
  kelipatanDari: z.number().positive('Kelipatan dari harus positif').optional(),
  masaBerlakuHari: z.number().int().positive('Masa berlaku harus positif').default(30),
  prioritas: z.number().int().positive('Prioritas harus positif').default(1),
  akumulasiRule: z.boolean().default(false),
  eventId: z.string().cuid().optional(),
  aktif: z.boolean().default(true),
  tanggalMulai: z.coerce.date(),
  tanggalSelesai: z.coerce.date().optional(),
}).refine(
  (data) => {
    // Jika tipe KELIPATAN, kelipatanDari wajib diisi
    if (data.tipeRule === 'KELIPATAN' && !data.kelipatanDari) {
      return false;
    }
    return true;
  },
  {
    message: 'Kelipatan dari wajib diisi untuk tipe KELIPATAN',
    path: ['kelipatanDari'],
  }
).refine(
  (data) => {
    // Jika tipe EVENT_KHUSUS, eventId wajib diisi
    if (data.tipeRule === 'EVENT_KHUSUS' && !data.eventId) {
      return false;
    }
    return true;
  },
  {
    message: 'Event ID wajib diisi untuk tipe EVENT_KHUSUS',
    path: ['eventId'],
  }
).refine(
  (data) => {
    // Jika ada tanggalSelesai, harus setelah tanggalMulai
    if (data.tanggalSelesai && data.tanggalSelesai < data.tanggalMulai) {
      return false;
    }
    return true;
  },
  {
    message: 'Tanggal selesai harus setelah tanggal mulai',
    path: ['tanggalSelesai'],
  }
);

export const updateRuleSchema = z.object({
  namaRule: z.string().min(3, 'Nama rule minimal 3 karakter').optional(),
  tipeRule: z.nativeEnum(TipeRule).optional(),
  nilaiMinimal: z.number().positive('Nilai minimal harus positif').optional(),
  jumlahVoucher: z.number().int().positive('Jumlah voucher harus positif').optional(),
  kelipatanDari: z.number().positive('Kelipatan dari harus positif').optional(),
  masaBerlakuHari: z.number().int().positive('Masa berlaku harus positif').optional(),
  prioritas: z.number().int().positive('Prioritas harus positif').optional(),
  akumulasiRule: z.boolean().optional(),
  eventId: z.string().cuid().optional(),
  aktif: z.boolean().optional(),
  tanggalMulai: z.coerce.date().optional(),
  tanggalSelesai: z.coerce.date().optional(),
});

// Transaksi Schemas
export const createTransaksiSchema = z.object({
  userId: z.number().int().positive('User ID tidak valid'),
  kodeStruk: z.string().min(3, 'Kode struk minimal 3 karakter'),
  totalBelanja: z.number().positive('Total belanja harus positif'),
  tanggalTransaksi: z.coerce.date().optional(),
  catatan: z.string().optional(),
  // Field tambahan untuk rule baru
  brandName: z.string().optional(), // Seiko, Casio, dll
  collectionName: z.string().optional(), // "2025 Spring Collection"
  collectionYear: z.number().int().optional(), // 2025
  items: z.string().optional(), // JSON: ["jam", "tali_kulit"]
});

// Voucher Schemas
export const validateVoucherSchema = z.object({
  kodeVoucher: z.string().min(1, 'Kode voucher tidak boleh kosong'),
});

export const useVoucherSchema = z.object({
  kodeVoucher: z.string().min(1, 'Kode voucher tidak boleh kosong'),
  transaksiBelanjaId: z.number().int().positive('Transaksi ID tidak valid'),
});

export const cancelVoucherSchema = z.object({
  keterangan: z.string().optional(),
});

// Query Schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      return false;
    }
    return true;
  },
  {
    message: 'End date harus setelah start date',
    path: ['endDate'],
  }
);
