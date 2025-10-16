# 🎁 Sistem Daftar Hadiah - Voucher Management System

## 📋 Overview

Sistem daftar hadiah adalah komponen tambahan yang melengkapi sistem voucher management untuk mengelola hadiah yang bisa didapat dari voucher atau undian berhadiah.

---

## 🏗️ Database Schema

### **Models Tambahan**

#### 1. **KategoriHadiah**
```prisma
model KategoriHadiah {
  id          Int      @id @default(autoincrement())
  namaKategori String   @unique
  deskripsi   String?
  aktif       Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  hadiah      Hadiah[]
}
```

#### 2. **Hadiah**
```prisma
model Hadiah {
  id              Int            @id @default(autoincrement())
  namaHadiah      String
  deskripsi       String?
  kategoriId      Int
  nilaiHadiah     Decimal        @db.Decimal(15, 2)
  stok            Int            @default(0)
  stokTerpakai    Int            @default(0)
  gambar          String?        // URL gambar hadiah
  aktif           Boolean        @default(true)
  tanggalMulai    DateTime?
  tanggalSelesai  DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  // Relations
  kategori        KategoriHadiah @relation(fields: [kategoriId], references: [id])
  pemenangHadiah  PemenangHadiah[]
}
```

#### 3. **Undian**
```prisma
model Undian {
  id              Int            @id @default(autoincrement())
  namaUndian      String
  deskripsi       String?
  tanggalMulai    DateTime
  tanggalSelesai  DateTime
  totalHadiah     Int            @default(0)
  hadiahTerbagi   Int            @default(0)
  status          StatusUndian   @default(AKTIF)
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  // Relations
  pemenangHadiah  PemenangHadiah[]
}
```

#### 4. **PemenangHadiah**
```prisma
model PemenangHadiah {
  id              Int            @id @default(autoincrement())
  undianId        Int
  hadiahId        Int
  userId          Int
  voucherId       Int?           // Optional: jika menang dari voucher
  nomorUndian     String?        // Nomor undian yang menang
  tanggalMenang   DateTime       @default(now())
  status          StatusPemenang @default(BELUM_DIAMBIL)
  tanggalAmbil    DateTime?
  adminAmbil      Int?           // Admin yang menyerahkan hadiah
  catatan         String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  // Relations
  undian          Undian         @relation(fields: [undianId], references: [id])
  hadiah          Hadiah         @relation(fields: [hadiahId], references: [id])
  user            User           @relation(fields: [userId], references: [id])
  voucher         Voucher?       @relation(fields: [voucherId], references: [id])
  admin           Admin?         @relation(fields: [adminAmbil], references: [id])
}
```

#### 5. **Enums**
```prisma
enum StatusUndian {
  AKTIF
  SELESAI
  DIBATALKAN
}

enum StatusPemenang {
  BELUM_DIAMBIL
  SUDAH_DIAMBIL
  DIBATALKAN
}
```

---

## 🔌 API Endpoints

### **1. Kategori Hadiah Management**

#### **GET /api/kategori-hadiah**
```typescript
// Get list kategori hadiah
GET /api/kategori-hadiah?aktif=true

Response:
{
  "success": true,
  "data": {
    "kategori": [
      {
        "id": 1,
        "namaKategori": "Jam Tangan",
        "deskripsi": "Jam tangan premium",
        "aktif": true,
        "_count": {
          "hadiah": 15
        }
      }
    ]
  }
}
```

#### **POST /api/kategori-hadiah**
```typescript
// Create kategori hadiah baru
POST /api/kategori-hadiah
{
  "namaKategori": "Jam Tangan",
  "deskripsi": "Jam tangan premium dari berbagai brand"
}
```

### **2. Hadiah Management**

#### **GET /api/hadiah**
```typescript
// Get list hadiah dengan filter
GET /api/hadiah?kategoriId=1&aktif=true&page=1&limit=10

Response:
{
  "success": true,
  "data": {
    "hadiah": [
      {
        "id": 1,
        "namaHadiah": "Jam Tangan Seiko Presage",
        "deskripsi": "Jam tangan Seiko dengan tali kulit asli",
        "kategoriId": 1,
        "nilaiHadiah": 8000000,
        "stok": 5,
        "stokTerpakai": 2,
        "gambar": "https://example.com/seiko-presage.jpg",
        "aktif": true,
        "kategori": {
          "id": 1,
          "namaKategori": "Jam Tangan"
        },
        "_count": {
          "pemenangHadiah": 2
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

#### **POST /api/hadiah**
```typescript
// Create hadiah baru
POST /api/hadiah
{
  "namaHadiah": "Jam Tangan Seiko Presage",
  "deskripsi": "Jam tangan Seiko dengan tali kulit asli",
  "kategoriId": 1,
  "nilaiHadiah": 8000000,
  "stok": 5,
  "gambar": "https://example.com/seiko-presage.jpg",
  "tanggalMulai": "2025-01-01T00:00:00Z",
  "tanggalSelesai": "2025-12-31T23:59:59Z"
}
```

#### **PATCH /api/hadiah/[id]**
```typescript
// Update hadiah
PATCH /api/hadiah/1
{
  "stok": 3,
  "aktif": true
}
```

#### **DELETE /api/hadiah/[id]**
```typescript
// Delete hadiah (SUPER_ADMIN only)
DELETE /api/hadiah/1
```

### **3. Undian Management**

#### **GET /api/undian**
```typescript
// Get list undian
GET /api/undian?status=AKTIF&page=1&limit=10

Response:
{
  "success": true,
  "data": {
    "undian": [
      {
        "id": 1,
        "namaUndian": "Undian Bulanan Januari 2025",
        "deskripsi": "Undian berhadiah jam tangan premium",
        "tanggalMulai": "2025-01-01T00:00:00Z",
        "tanggalSelesai": "2025-01-31T23:59:59Z",
        "totalHadiah": 20,
        "hadiahTerbagi": 15,
        "status": "AKTIF",
        "_count": {
          "pemenangHadiah": 15
        }
      }
    ]
  }
}
```

#### **POST /api/undian**
```typescript
// Create undian baru
POST /api/undian
{
  "namaUndian": "Undian Bulanan Januari 2025",
  "deskripsi": "Undian berhadiah jam tangan premium",
  "tanggalMulai": "2025-01-01T00:00:00Z",
  "tanggalSelesai": "2025-01-31T23:59:59Z",
  "totalHadiah": 20
}
```

### **4. Pemenang Hadiah Management**

#### **GET /api/pemenang-hadiah**
```typescript
// Get list pemenang hadiah
GET /api/pemenang-hadiah?undianId=1&status=BELUM_DIAMBIL&page=1&limit=10

Response:
{
  "success": true,
  "data": {
    "pemenangHadiah": [
      {
        "id": 1,
        "undianId": 1,
        "hadiahId": 1,
        "userId": 1,
        "voucherId": 5,
        "nomorUndian": "12345-67890-ABCDE",
        "tanggalMenang": "2025-01-31T23:59:59Z",
        "status": "BELUM_DIAMBIL",
        "tanggalAmbil": null,
        "adminAmbil": null,
        "catatan": null,
        "undian": {
          "id": 1,
          "namaUndian": "Undian Bulanan Januari 2025"
        },
        "hadiah": {
          "id": 1,
          "namaHadiah": "Jam Tangan Seiko Presage",
          "nilaiHadiah": 8000000,
          "gambar": "https://example.com/seiko-presage.jpg"
        },
        "user": {
          "id": 1,
          "nama": "Budi Santoso",
          "noHp": "081234567890",
          "email": "budi@example.com"
        },
        "voucher": {
          "id": 5,
          "kodeVoucher": "VCH-20250115-ABC12",
          "nomorUndian": "12345-67890-ABCDE"
        },
        "admin": null
      }
    ]
  }
}
```

#### **POST /api/pemenang-hadiah/undi**
```typescript
// Undi pemenang hadiah
POST /api/pemenang-hadiah/undi
{
  "undianId": 1,
  "jumlahPemenang": 10
}

Response:
{
  "success": true,
  "data": {
    "pemenangHadiah": [...],
    "summary": {
      "totalPemenang": 10,
      "undianId": 1,
      "namaUndian": "Undian Bulanan Januari 2025"
    }
  }
}
```

#### **PUT /api/pemenang-hadiah/ambil**
```typescript
// Ambil hadiah (update status)
PUT /api/pemenang-hadiah/ambil
{
  "pemenangId": 1,
  "catatan": "Hadiah sudah diambil oleh customer"
}

Response:
{
  "success": true,
  "data": {
    "pemenang": {
      "id": 1,
      "status": "SUDAH_DIAMBIL",
      "tanggalAmbil": "2025-02-01T10:00:00Z",
      "adminAmbil": 1,
      "catatan": "Hadiah sudah diambil oleh customer",
      "hadiah": {
        "namaHadiah": "Jam Tangan Seiko Presage",
        "nilaiHadiah": 8000000
      },
      "user": {
        "nama": "Budi Santoso",
        "noHp": "081234567890"
      },
      "admin": {
        "namaLengkap": "Super Administrator"
      }
    }
  }
}
```

### **5. Reporting**

#### **GET /api/reports/hadiah-summary**
```typescript
// Get hadiah summary report
GET /api/reports/hadiah-summary

Response:
{
  "success": true,
  "data": {
    "hadiah": {
      "totalHadiah": 100,
      "hadiahAktif": 85,
      "hadiahTerbagi": 25,
      "hadiahBelumDiambil": 15,
      "hadiahSudahDiambil": 10,
      "nilaiTotalHadiah": 500000000,
      "hadiahByKategori": [
        {
          "kategori": "Jam Tangan",
          "jumlah": 50
        },
        {
          "kategori": "Aksesoris",
          "jumlah": 30
        }
      ],
      "hadiahByStatus": [
        {
          "status": "BELUM_DIAMBIL",
          "jumlah": 15
        },
        {
          "status": "SUDAH_DIAMBIL",
          "jumlah": 10
        }
      ],
      "topHadiah": [
        {
          "hadiahId": 1,
          "namaHadiah": "Jam Tangan Seiko Presage",
          "nilaiHadiah": 8000000,
          "kategori": "Jam Tangan",
          "jumlahPemenang": 5
        }
      ]
    },
    "undian": {
      "totalUndian": 12,
      "undianAktif": 1,
      "undianSelesai": 10,
      "totalPemenang": 120,
      "pemenangBelumDiambil": 25
    },
    "pemenangTerbaru": [
      {
        "id": 1,
        "namaUser": "Budi Santoso",
        "noHp": "081234567890",
        "namaHadiah": "Jam Tangan Seiko Presage",
        "nilaiHadiah": 8000000,
        "namaUndian": "Undian Bulanan Januari 2025",
        "status": "BELUM_DIAMBIL",
        "tanggalMenang": "2025-01-31T23:59:59Z",
        "tanggalAmbil": null
      }
    ]
  }
}
```

---

## 🎯 Business Logic

### **1. Alur Undian Hadiah**

```
1. Setup Hadiah
   - Admin buat kategori hadiah
   - Admin buat hadiah dengan stok
   ↓
2. Buat Undian
   - Admin buat undian dengan periode waktu
   - Set total hadiah yang akan dibagikan
   ↓
3. Customer Belanja & Dapat Voucher
   - Customer belanja dan dapat voucher
   - Voucher otomatis dapat nomor undian
   ↓
4. Undi Pemenang
   - Admin jalankan undian di akhir periode
   - Sistem random select pemenang dari semua nomor undian
   - Assign hadiah ke pemenang
   ↓
5. Customer Ambil Hadiah
   - Customer datang ke toko dengan voucher
   - Admin cek di sistem dan update status
```

### **2. Sistem Undian Otomatis**

```typescript
// lib/undian-service.ts
export async function undiPemenangHadiah(undianId: number, jumlahPemenang: number) {
  // 1. Get semua voucher dengan nomor undian dari periode undian
  const vouchers = await prisma.voucher.findMany({
    where: {
      nomorUndian: { not: null },
      tanggalDibuat: {
        gte: undian.tanggalMulai,
        lte: undian.tanggalSelesai
      }
    }
  });
  
  // 2. Random select pemenang
  const pemenang = shuffleArray(vouchers).slice(0, jumlahPemenang);
  
  // 3. Assign hadiah ke pemenang
  for (const voucher of pemenang) {
    const hadiah = await getRandomHadiah(); // Get hadiah yang masih ada stok
    
    await prisma.pemenangHadiah.create({
      data: {
        undianId,
        hadiahId: hadiah.id,
        userId: voucher.userId,
        voucherId: voucher.id,
        nomorUndian: voucher.nomorUndian,
        status: 'BELUM_DIAMBIL'
      }
    });
    
    // Update stok hadiah
    await prisma.hadiah.update({
      where: { id: hadiah.id },
      data: {
        stokTerpakai: { increment: 1 }
      }
    });
  }
}
```

### **3. Integrasi dengan Voucher System**

```typescript
// Update di lib/voucher-service.ts
export async function generateVouchers(...) {
  // ... existing code
  
  // Generate lottery number yang bisa digunakan untuk undian
  const nomorUndian = generateNomorUndian();
  
  // Simpan nomor undian ke voucher
  const voucher = await prisma.voucher.create({
    data: {
      // ... existing fields
      nomorUndian, // Nomor ini bisa digunakan untuk undian
    },
  });
}
```

---

## 🎮 Contoh Use Case Lengkap

### **Skenario: Undian Bulanan Toko Jam Tangan**

#### **1. Setup Hadiah**
```json
// Create kategori
POST /api/kategori-hadiah
{
  "namaKategori": "Jam Tangan Premium",
  "deskripsi": "Jam tangan premium dari brand ternama"
}

// Create hadiah
POST /api/hadiah
{
  "namaHadiah": "Jam Tangan Seiko Presage",
  "deskripsi": "Jam tangan Seiko dengan tali kulit asli",
  "kategoriId": 1,
  "nilaiHadiah": 8000000,
  "stok": 5,
  "gambar": "https://example.com/seiko-presage.jpg"
}
```

#### **2. Buat Undian**
```json
POST /api/undian
{
  "namaUndian": "Undian Bulanan Januari 2025",
  "deskripsi": "Undian berhadiah jam tangan premium",
  "tanggalMulai": "2025-01-01T00:00:00Z",
  "tanggalSelesai": "2025-01-31T23:59:59Z",
  "totalHadiah": 20
}
```

#### **3. Customer Belanja & Dapat Voucher**
```json
POST /api/transaksi
{
  "userId": 1,
  "kodeStruk": "STR-20250115-001",
  "totalBelanja": 500000
}

// Response: Voucher dengan nomor undian otomatis
{
  "vouchersGenerated": [
    {
      "kodeVoucher": "VCH-20250115-ABC12",
      "nomorUndian": "12345-67890-ABCDE",
      "status": "AKTIF"
    }
  ]
}
```

#### **4. Undi Pemenang (Akhir Bulan)**
```json
POST /api/pemenang-hadiah/undi
{
  "undianId": 1,
  "jumlahPemenang": 10
}

// Response: 10 pemenang terpilih dengan hadiah
{
  "summary": {
    "totalPemenang": 10,
    "undianId": 1,
    "namaUndian": "Undian Bulanan Januari 2025"
  }
}
```

#### **5. Customer Ambil Hadiah**
```json
PUT /api/pemenang-hadiah/ambil
{
  "pemenangId": 1,
  "catatan": "Hadiah sudah diambil oleh customer"
}

// Response: Status berubah menjadi SUDAH_DIAMBIL
{
  "pemenang": {
    "status": "SUDAH_DIAMBIL",
    "tanggalAmbil": "2025-02-01T10:00:00Z",
    "adminAmbil": 1
  }
}
```

---

## 🔐 Authorization

### **Role Permissions**

| Endpoint | SUPER_ADMIN | ADMIN | KASIR |
|----------|-------------|-------|-------|
| GET /api/kategori-hadiah | ✅ | ✅ | ✅ |
| POST /api/kategori-hadiah | ✅ | ✅ | ❌ |
| GET /api/hadiah | ✅ | ✅ | ✅ |
| POST /api/hadiah | ✅ | ✅ | ❌ |
| PATCH /api/hadiah/[id] | ✅ | ✅ | ❌ |
| DELETE /api/hadiah/[id] | ✅ | ❌ | ❌ |
| GET /api/undian | ✅ | ✅ | ✅ |
| POST /api/undian | ✅ | ✅ | ❌ |
| GET /api/pemenang-hadiah | ✅ | ✅ | ✅ |
| POST /api/pemenang-hadiah/undi | ✅ | ✅ | ❌ |
| PUT /api/pemenang-hadiah/ambil | ✅ | ✅ | ✅ |
| GET /api/reports/hadiah-summary | ✅ | ✅ | ❌ |

---

## 📊 Metrics & KPIs

### **Hadiah Metrics**
- **Total Hadiah**: Jumlah total hadiah yang tersedia
- **Hadiah Aktif**: Jumlah hadiah yang masih aktif
- **Hadiah Terbagi**: Jumlah hadiah yang sudah dibagikan
- **Hadiah Belum Diambil**: Jumlah hadiah yang belum diambil pemenang
- **Nilai Total Hadiah**: Total nilai hadiah yang tersedia

### **Undian Metrics**
- **Total Undian**: Jumlah total undian yang pernah dibuat
- **Undian Aktif**: Jumlah undian yang sedang berjalan
- **Undian Selesai**: Jumlah undian yang sudah selesai
- **Total Pemenang**: Jumlah total pemenang hadiah
- **Pemenang Belum Diambil**: Jumlah pemenang yang belum mengambil hadiah

### **Performance Metrics**
- **Tingkat Pengambilan Hadiah**: Persentase hadiah yang diambil vs dibagikan
- **Rata-rata Nilai Hadiah**: Rata-rata nilai hadiah per pemenang
- **Top Hadiah**: Hadiah yang paling sering dimenangkan
- **Kategori Populer**: Kategori hadiah yang paling diminati

---

## 🚀 Setup & Migration

### **1. Update Database Schema**
```bash
# Tambahkan schema hadiah ke schema.prisma
# Jalankan migration
npm run db:push
```

### **2. Seed Data Hadiah**
```typescript
// prisma/seed-hadiah.ts
async function seedHadiah() {
  // Create kategori hadiah
  const kategori1 = await prisma.kategoriHadiah.create({
    data: {
      namaKategori: "Jam Tangan Premium",
      deskripsi: "Jam tangan premium dari brand ternama",
    },
  });

  const kategori2 = await prisma.kategoriHadiah.create({
    data: {
      namaKategori: "Aksesoris Jam",
      deskripsi: "Aksesoris untuk jam tangan",
    },
  });

  // Create hadiah
  await prisma.hadiah.createMany({
    data: [
      {
        namaHadiah: "Jam Tangan Seiko Presage",
        deskripsi: "Jam tangan Seiko dengan tali kulit asli",
        kategoriId: kategori1.id,
        nilaiHadiah: 8000000,
        stok: 5,
        gambar: "https://example.com/seiko-presage.jpg",
      },
      {
        namaHadiah: "Jam Tangan Casio G-Shock",
        deskripsi: "Jam tangan Casio G-Shock tahan air",
        kategoriId: kategori1.id,
        nilaiHadiah: 3000000,
        stok: 10,
        gambar: "https://example.com/casio-gshock.jpg",
      },
      {
        namaHadiah: "Tali Kulit Premium",
        deskripsi: "Tali kulit premium untuk jam tangan",
        kategoriId: kategori2.id,
        nilaiHadiah: 500000,
        stok: 20,
        gambar: "https://example.com/tali-kulit.jpg",
      },
    ],
  });
}
```

### **3. Test API Endpoints**
```bash
# Test create kategori hadiah
curl -X POST http://localhost:3000/api/kategori-hadiah \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"namaKategori":"Jam Tangan Premium","deskripsi":"Jam tangan premium dari brand ternama"}'

# Test create hadiah
curl -X POST http://localhost:3000/api/hadiah \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"namaHadiah":"Jam Tangan Seiko Presage","kategoriId":1,"nilaiHadiah":8000000,"stok":5}'

# Test create undian
curl -X POST http://localhost:3000/api/undian \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"namaUndian":"Undian Bulanan Januari 2025","tanggalMulai":"2025-01-01T00:00:00Z","tanggalSelesai":"2025-01-31T23:59:59Z","totalHadiah":20}'
```

---

## ✅ Checklist Implementasi

- [x] Database schema untuk sistem hadiah
- [x] API endpoints untuk kategori hadiah
- [x] API endpoints untuk hadiah management
- [x] API endpoints untuk undian management
- [x] API endpoints untuk pemenang hadiah
- [x] Sistem undian otomatis
- [x] Integrasi dengan voucher system
- [x] Reporting untuk hadiah
- [x] Authorization & validation
- [x] Documentation lengkap

---

## 🎉 Kesimpulan

Sistem daftar hadiah ini melengkapi sistem voucher management dengan fitur:

1. **Manajemen Hadiah**: CRUD hadiah dengan kategori dan stok
2. **Sistem Undian**: Undian berhadiah dengan periode waktu
3. **Pemenang Hadiah**: Tracking pemenang dan status pengambilan
4. **Integrasi Voucher**: Nomor undian otomatis di voucher
5. **Reporting**: Statistik hadiah dan undian
6. **Authorization**: Role-based access control

Sistem ini siap untuk production dan dapat di-scale sesuai kebutuhan bisnis toko jam tangan.

---

**Happy Coding! 🎁**
