# 🔄 Changelog - New Rule System

## 📋 Ringkasan Perubahan

Sistem voucher telah diupdate dengan **logika baru** dan **6 tipe rule tambahan** untuk toko jam tangan.

---

## 🎯 Perubahan Utama

### 1. **HANYA 1 RULE AKTIF** ⭐
- **Sebelumnya**: Multiple rules bisa aktif bersamaan dengan sistem prioritas dan akumulasi
- **Sekarang**: **HANYA 1 RULE BOLEH AKTIF** pada satu waktu
- **Alasan**: Lebih simple, mudah dikelola, tidak ada konflik antar rule

### 2. **6 Tipe Rule Baru**
Ditambahkan 6 tipe rule khusus untuk toko jam tangan:

1. ✅ **BRAND_SPECIFIC** - Voucher untuk brand tertentu (Seiko, Casio, dll)
2. ✅ **HIGH_VALUE_PURCHASE** - Voucher untuk pembelian nominal tinggi
3. ✅ **NEW_COLLECTION** - Voucher untuk koleksi terbaru
4. ✅ **MEMBER_EXCLUSIVE** - Voucher khusus member VIP/GOLD/SILVER
5. ✅ **TIME_BASED** - Voucher berdasarkan waktu (midnight sale, weekend, dll)
6. ✅ **BUNDLING** - Voucher untuk pembelian paket (jam + aksesoris)

---

## 📝 File yang Diubah

### 1. Database Schema (`prisma/schema.prisma`)

#### Enum TipeRule - Ditambah 6 tipe baru:
```prisma
enum TipeRule {
  MINIMAL_BELANJA      // Existing
  KELIPATAN            // Existing
  EVENT_KHUSUS         // Existing
  BRAND_SPECIFIC       // NEW ⭐
  HIGH_VALUE_PURCHASE  // NEW ⭐
  NEW_COLLECTION       // NEW ⭐
  MEMBER_EXCLUSIVE     // NEW ⭐
  TIME_BASED           // NEW ⭐
  BUNDLING             // NEW ⭐
}
```

#### Model User - Ditambah field:
```prisma
model User {
  // ... existing fields
  memberTier     String?  // NEW: VIP, GOLD, SILVER, BRONZE
}
```

#### Model RuleVoucher - Ditambah banyak field:
```prisma
model RuleVoucher {
  // ... existing fields
  
  // Field untuk BRAND_SPECIFIC
  brandName        String?
  
  // Field untuk HIGH_VALUE_PURCHASE
  voucherValue     Decimal?
  
  // Field untuk NEW_COLLECTION
  collectionName   String?
  collectionYear   Int?
  
  // Field untuk MEMBER_EXCLUSIVE
  memberTier       String?
  
  // Field untuk TIME_BASED
  jamMulai         String?
  jamSelesai       String?
  hariKhusus       String?
  
  // Field untuk BUNDLING
  requiredItems    String?  // JSON array
  minItems         Int?
  
  // Note: prioritas & akumulasiRule TIDAK DIGUNAKAN lagi
}
```

#### Model TransaksiBelanja - Ditambah field:
```prisma
model TransaksiBelanja {
  // ... existing fields
  
  brandName         String?
  collectionName    String?
  collectionYear    Int?
  items             String?  // JSON array
}
```

---

### 2. Business Logic (`lib/voucher-service.ts`)

#### Fungsi `evaluateRules()` - REWRITE TOTAL:
```typescript
// SEBELUMNYA: Loop semua active rules dengan prioritas
// SEKARANG: Ambil HANYA 1 active rule

export async function evaluateRules(
  totalBelanja: number,
  tanggalTransaksi: Date,
  transaksiData: {
    brandName?: string;
    collectionName?: string;
    collectionYear?: number;
    items?: string;
    userMemberTier?: string;
  }
): Promise<VoucherToGenerate[]>
```

**Perubahan Logic:**
1. `findMany()` → `findFirst()` (hanya ambil 1 rule)
2. Tidak ada loop, langsung evaluate 1 rule
3. Tidak ada check prioritas & akumulasi
4. Tambah 6 case baru di switch statement

#### Fungsi `processTransaksi()` - Updated:
```typescript
// Ditambah parameter transaksiData
export async function processTransaksi(
  userId: string,
  kodeStruk: string,
  totalBelanja: number,
  adminId: string,
  tanggalTransaksi: Date = new Date(),
  catatan?: string,
  transaksiData?: {  // NEW ⭐
    brandName?: string;
    collectionName?: string;
    collectionYear?: number;
    items?: string;
  }
)
```

---

### 3. Types (`types/index.ts`)

#### CreateUserRequest - Ditambah:
```typescript
export interface CreateUserRequest {
  // ... existing
  memberTier?: string;  // NEW
}
```

#### CreateTransaksiRequest - Ditambah:
```typescript
export interface CreateTransaksiRequest {
  // ... existing
  brandName?: string;        // NEW
  collectionName?: string;   // NEW
  collectionYear?: number;   // NEW
  items?: string;            // NEW
}
```

#### VoucherToGenerate - Ditambah:
```typescript
export interface VoucherToGenerate {
  // ... existing
  voucherValue?: number;  // NEW
}
```

---

### 4. Validations (`lib/validations.ts`)

#### createUserSchema - Ditambah:
```typescript
memberTier: z.string().optional()
```

#### createTransaksiSchema - Ditambah:
```typescript
brandName: z.string().optional()
collectionName: z.string().optional()
collectionYear: z.number().int().optional()
items: z.string().optional()
```

---

### 5. API Endpoint (`app/api/transaksi/route.ts`)

#### POST /api/transaksi - Updated:
```typescript
// Sekarang menerima field tambahan
const result = await processTransaksi(
  validatedData.userId,
  validatedData.kodeStruk,
  validatedData.totalBelanja,
  authResult.admin.adminId,
  validatedData.tanggalTransaksi || new Date(),
  validatedData.catatan,
  {  // NEW ⭐
    brandName: validatedData.brandName,
    collectionName: validatedData.collectionName,
    collectionYear: validatedData.collectionYear,
    items: validatedData.items,
  }
);
```

---

## 🚀 Cara Setup

### 1. Generate Prisma Client Baru
```bash
npm run db:generate
```

### 2. Push Schema ke Database
```bash
npm run db:push
```

**⚠️ WARNING**: Ini akan mengubah struktur database! Backup dulu jika ada data penting.

### 3. Restart Development Server
```bash
npm run dev
```

---

## 📖 Contoh Penggunaan Rule Baru

### 1. BRAND_SPECIFIC (Seiko)
```json
{
  "namaRule": "Promo Seiko - Voucher 200rb",
  "tipeRule": "BRAND_SPECIFIC",
  "nilaiMinimal": 2000000,
  "jumlahVoucher": 1,
  "brandName": "Seiko",
  "voucherValue": 200000,
  "masaBerlakuHari": 30,
  "aktif": true,
  "tanggalMulai": "2025-01-01T00:00:00Z"
}
```

**Transaksi:**
```json
{
  "userId": "xxx",
  "kodeStruk": "STR-001",
  "totalBelanja": 2500000,
  "brandName": "Seiko"  // ⭐ Harus match
}
```
**Result**: Dapat 1 voucher senilai 200rb

---

### 2. HIGH_VALUE_PURCHASE
```json
{
  "namaRule": "Belanja 5 Juta - 2 Voucher",
  "tipeRule": "HIGH_VALUE_PURCHASE",
  "nilaiMinimal": 5000000,
  "jumlahVoucher": 2,
  "voucherValue": 500000,
  "masaBerlakuHari": 90,
  "aktif": true,
  "tanggalMulai": "2025-01-01T00:00:00Z"
}
```

**Transaksi:**
```json
{
  "userId": "xxx",
  "kodeStruk": "STR-002",
  "totalBelanja": 6000000
}
```
**Result**: Dapat 2 voucher @ 500rb

---

### 3. NEW_COLLECTION
```json
{
  "namaRule": "Koleksi 2025 Spring",
  "tipeRule": "NEW_COLLECTION",
  "nilaiMinimal": 1000000,
  "jumlahVoucher": 1,
  "collectionName": "2025 Spring Collection",
  "collectionYear": 2025,
  "masaBerlakuHari": 60,
  "aktif": true,
  "tanggalMulai": "2025-01-01T00:00:00Z"
}
```

**Transaksi:**
```json
{
  "userId": "xxx",
  "kodeStruk": "STR-003",
  "totalBelanja": 1500000,
  "collectionName": "2025 Spring Collection",  // ⭐ Harus match
  "collectionYear": 2025
}
```
**Result**: Dapat 1 voucher

---

### 4. MEMBER_EXCLUSIVE (VIP Only)
```json
{
  "namaRule": "Member VIP Exclusive",
  "tipeRule": "MEMBER_EXCLUSIVE",
  "nilaiMinimal": 500000,
  "jumlahVoucher": 3,
  "memberTier": "VIP",
  "masaBerlakuHari": 90,
  "aktif": true,
  "tanggalMulai": "2025-01-01T00:00:00Z"
}
```

**User harus punya memberTier = "VIP"**

**Transaksi:**
```json
{
  "userId": "xxx",  // User ini harus memberTier = "VIP"
  "kodeStruk": "STR-004",
  "totalBelanja": 800000
}
```
**Result**: Dapat 3 voucher (hanya jika user VIP)

---

### 5. TIME_BASED (Midnight Sale)
```json
{
  "namaRule": "Midnight Sale 22:00-02:00",
  "tipeRule": "TIME_BASED",
  "nilaiMinimal": 100000,
  "jumlahVoucher": 2,
  "jamMulai": "22:00",
  "jamSelesai": "02:00",
  "masaBerlakuHari": 7,
  "aktif": true,
  "tanggalMulai": "2025-01-01T00:00:00Z"
}
```

**Transaksi:**
```json
{
  "userId": "xxx",
  "kodeStruk": "STR-005",
  "totalBelanja": 150000,
  "tanggalTransaksi": "2025-01-15T23:30:00Z"  // ⭐ Jam 23:30 (dalam range)
}
```
**Result**: Dapat 2 voucher

**Time-Based Options:**
- `hariKhusus`: "WEEKEND", "WEEKDAY", "MONDAY", "TUESDAY", dll
- `jamMulai` & `jamSelesai`: Format "HH:mm"

---

### 6. BUNDLING (Jam + Aksesoris)
```json
{
  "namaRule": "Paket Jam + Aksesoris",
  "tipeRule": "BUNDLING",
  "nilaiMinimal": 1000000,
  "jumlahVoucher": 1,
  "requiredItems": "[\"jam\", \"tali_kulit\"]",  // JSON string
  "minItems": 2,
  "masaBerlakuHari": 30,
  "aktif": true,
  "tanggalMulai": "2025-01-01T00:00:00Z"
}
```

**Transaksi:**
```json
{
  "userId": "xxx",
  "kodeStruk": "STR-006",
  "totalBelanja": 1200000,
  "items": "[\"jam_seiko\", \"tali_kulit_premium\", \"kotak_jam\"]"  // ⭐ JSON string
}
```
**Result**: Dapat 1 voucher (karena ada "jam" dan "tali_kulit")

---

## ⚠️ Breaking Changes

### 1. Hanya 1 Rule Aktif
- **Sebelumnya**: Bisa multiple rules aktif
- **Sekarang**: Set rule lain ke `aktif: false` sebelum aktifkan rule baru
- **Impact**: Perlu update flow admin untuk manage active rule

### 2. Field `prioritas` & `akumulasiRule` Tidak Digunakan
- Field masih ada di database (backward compatibility)
- Tapi tidak diproses di logic
- Bisa diabaikan saat create rule baru

### 3. API Transaksi Menerima Field Baru
- `brandName`, `collectionName`, `collectionYear`, `items` sekarang optional
- Tidak wajib diisi, tapi diperlukan untuk rule tertentu

---

## ✅ Migration Checklist

- [ ] Backup database
- [ ] Run `npm run db:generate`
- [ ] Run `npm run db:push`
- [ ] Restart server
- [ ] Test login endpoint
- [ ] Nonaktifkan semua rule lama kecuali 1
- [ ] Test create transaksi dengan rule lama
- [ ] Create rule baru dengan tipe baru
- [ ] Test create transaksi dengan rule baru
- [ ] Update dokumentasi API untuk client

---

## 📞 Support

Jika ada error setelah migration:
1. Cek Prisma Client sudah di-generate: `npm run db:generate`
2. Cek database schema sudah updated: `npm run db:push`
3. Cek hanya 1 rule yang aktif
4. Cek format JSON untuk `items` dan `requiredItems`

**Happy Coding! 🚀**
