# 🎁 Logic Hadiah yang Benar - Pemenang Memilih Hadiah

## ❌ **LOGIC SEBELUMNYA (SALAH)**

```
1. Undi pemenang
2. Sistem otomatis assign hadiah A ke pemenang 1
3. Sistem otomatis assign hadiah B ke pemenang 2
4. Pemenang tidak bisa memilih hadiah
```

## ✅ **LOGIC YANG BENAR**

```
1. Undi pemenang (hanya menentukan siapa yang menang)
2. Pemenang datang ke toko
3. Pemenang melihat daftar hadiah yang tersedia
4. Pemenang memilih hadiah yang diinginkan
5. Admin update status pemenang dengan hadiah yang dipilih
6. Pemenang mengambil hadiah
```

---

## 🔄 **ALUR LENGKAP YANG BENAR**

### **1. Setup Hadiah**
```json
POST /api/hadiah
{
  "namaHadiah": "Jam Tangan Seiko Presage",
  "kategoriId": 1,
  "nilaiHadiah": 8000000,
  "stok": 5
}
```

### **2. Buat Undian**
```json
POST /api/undian
{
  "namaUndian": "Undian Bulanan Januari 2025",
  "tanggalMulai": "2025-01-01T00:00:00Z",
  "tanggalSelesai": "2025-01-31T23:59:59Z",
  "totalHadiah": 20
}
```

### **3. Customer Belanja & Dapat Voucher**
```json
POST /api/transaksi
{
  "userId": 1,
  "kodeStruk": "STR-20250115-001",
  "totalBelanja": 500000
}

// Response: Voucher dengan nomor undian
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

### **4. Undi Pemenang (HANYA menentukan siapa yang menang)**
```json
POST /api/pemenang-hadiah/undi
{
  "undianId": 1,
  "jumlahPemenang": 10
}

// Response: Pemenang TANPA hadiah yang diassign
{
  "pemenangHadiah": [
    {
      "id": 1,
      "undianId": 1,
      "hadiahId": null, // NULL - belum memilih hadiah
      "userId": 1,
      "voucherId": 5,
      "nomorUndian": "12345-67890-ABCDE",
      "status": "BELUM_MEMILIH", // Status baru
      "tanggalPilih": null,
      "tanggalAmbil": null
    }
  ]
}
```

### **5. Pemenang Melihat Hadiah Tersedia**
```json
GET /api/hadiah/tersedia

// Response: Daftar hadiah yang bisa dipilih
{
  "hadiah": [
    {
      "id": 1,
      "namaHadiah": "Jam Tangan Seiko Presage",
      "nilaiHadiah": 8000000,
      "stokTersisa": 3,
      "kategori": {
        "namaKategori": "Jam Tangan Premium"
      }
    },
    {
      "id": 2,
      "namaHadiah": "Jam Tangan Casio G-Shock",
      "nilaiHadiah": 3000000,
      "stokTersisa": 8,
      "kategori": {
        "namaKategori": "Jam Tangan Premium"
      }
    }
  ]
}
```

### **6. Pemenang Memilih Hadiah**
```json
POST /api/pemenang-hadiah/pilih-hadiah
{
  "pemenangId": 1,
  "hadiahId": 2  // Pemenang memilih Casio G-Shock
}

// Response: Status berubah menjadi SUDAH_MEMILIH
{
  "pemenang": {
    "id": 1,
    "hadiahId": 2,
    "status": "SUDAH_MEMILIH",
    "tanggalPilih": "2025-02-01T10:00:00Z",
    "hadiah": {
      "namaHadiah": "Jam Tangan Casio G-Shock",
      "nilaiHadiah": 3000000
    }
  }
}
```

### **7. Pemenang Mengambil Hadiah**
```json
PUT /api/pemenang-hadiah/ambil
{
  "pemenangId": 1,
  "catatan": "Hadiah sudah diambil oleh customer"
}

// Response: Status berubah menjadi SUDAH_DIAMBIL
{
  "pemenang": {
    "id": 1,
    "status": "SUDAH_DIAMBIL",
    "tanggalAmbil": "2025-02-01T14:00:00Z",
    "adminAmbil": 1,
    "catatan": "Hadiah sudah diambil oleh customer"
  }
}
```

---

## 🗄️ **PERUBAHAN DATABASE SCHEMA**

### **Status Pemenang Baru**
```prisma
enum StatusPemenang {
  BELUM_MEMILIH    // Pemenang belum memilih hadiah
  SUDAH_MEMILIH    // Pemenang sudah memilih hadiah tapi belum diambil
  SUDAH_DIAMBIL    // Hadiah sudah diambil
  DIBATALKAN       // Pemenang dibatalkan
}
```

### **Model PemenangHadiah Updated**
```prisma
model PemenangHadiah {
  id              Int            @id @default(autoincrement())
  undianId        Int
  hadiahId        Int?           // NULL sampai pemenang memilih hadiah
  userId          Int
  voucherId       Int?           // Optional: jika menang dari voucher
  nomorUndian     String?        // Nomor undian yang menang
  tanggalMenang   DateTime       @default(now())
  status          StatusPemenang @default(BELUM_MEMILIH) // Status baru
  tanggalPilih    DateTime?      // Kapan pemenang memilih hadiah
  tanggalAmbil    DateTime?      // Kapan hadiah diambil
  adminAmbil      Int?           // Admin yang menyerahkan hadiah
  catatan         String?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  // Relations
  undian          Undian         @relation(fields: [undianId], references: [id])
  hadiah          Hadiah?        @relation(fields: [hadiahId], references: [id]) // Optional
  user            User           @relation(fields: [userId], references: [id])
  voucher         Voucher?       @relation(fields: [voucherId], references: [id])
  admin           Admin?         @relation(fields: [adminAmbil], references: [id])
}
```

---

## 🔌 **API ENDPOINTS BARU**

### **1. Pilih Hadiah**
```typescript
POST /api/pemenang-hadiah/pilih-hadiah
{
  "pemenangId": 1,
  "hadiahId": 2
}
```

### **2. Get Hadiah Tersedia**
```typescript
GET /api/hadiah/tersedia?kategoriId=1

// Response: Hadiah yang masih ada stok dan bisa dipilih
{
  "hadiah": [
    {
      "id": 1,
      "namaHadiah": "Jam Tangan Seiko Presage",
      "nilaiHadiah": 8000000,
      "stokTersisa": 3,
      "kategori": {
        "namaKategori": "Jam Tangan Premium"
      }
    }
  ]
}
```

---

## 🎯 **KEUNTUNGAN LOGIC YANG BENAR**

### **1. Fleksibilitas untuk Pemenang**
- Pemenang bisa memilih hadiah sesuai keinginan
- Tidak terpaksa menerima hadiah yang tidak diinginkan
- Bisa memilih hadiah dengan nilai yang sesuai preferensi

### **2. Manajemen Stok yang Lebih Baik**
- Stok hadiah hanya berkurang saat pemenang memilih
- Bisa melihat hadiah mana yang paling diminati
- Bisa mengatur stok berdasarkan permintaan

### **3. Customer Experience yang Lebih Baik**
- Pemenang merasa lebih puas karena bisa memilih
- Proses pengambilan hadiah lebih transparan
- Customer service lebih mudah membantu

### **4. Analytics yang Lebih Akurat**
- Bisa track hadiah mana yang paling populer
- Bisa analisis preferensi customer
- Bisa optimasi inventory hadiah

---

## 📊 **CONTOH USE CASE LENGKAP**

### **Skenario: Undian Bulanan Toko Jam Tangan**

1. **Setup Hadiah**:
   - Jam Tangan Seiko Presage (8 juta) - stok 5
   - Jam Tangan Casio G-Shock (3 juta) - stok 10
   - Tali Kulit Premium (500rb) - stok 20

2. **Undi 10 Pemenang**:
   - Sistem random select 10 pemenang
   - Semua pemenang status "BELUM_MEMILIH"
   - Belum ada hadiah yang diassign

3. **Pemenang Datang ke Toko**:
   - Pemenang 1: Memilih Seiko Presage → status "SUDAH_MEMILIH"
   - Pemenang 2: Memilih Casio G-Shock → status "SUDAH_MEMILIH"
   - Pemenang 3: Memilih Tali Kulit → status "SUDAH_MEMILIH"

4. **Pengambilan Hadiah**:
   - Pemenang 1: Ambil Seiko Presage → status "SUDAH_DIAMBIL"
   - Pemenang 2: Ambil Casio G-Shock → status "SUDAH_DIAMBIL"

5. **Hasil**:
   - Seiko Presage: stok tersisa 4
   - Casio G-Shock: stok tersisa 9
   - Tali Kulit: stok tersisa 19

---

## ✅ **CHECKLIST IMPLEMENTASI**

- [x] **Database Schema** - Update model PemenangHadiah
- [x] **Status Enum** - Tambah status BELUM_MEMILIH dan SUDAH_MEMILIH
- [x] **Undian Service** - Update logic undian (tidak assign hadiah)
- [x] **API Pilih Hadiah** - POST /api/pemenang-hadiah/pilih-hadiah
- [x] **API Hadiah Tersedia** - GET /api/hadiah/tersedia
- [x] **Update Ambil Hadiah** - Validasi status SUDAH_MEMILIH
- [x] **Documentation** - Update dokumentasi dengan logic yang benar

---

## 🎉 **KESIMPULAN**

Logic yang benar adalah:
- **Sistem hanya menentukan siapa yang menang** (random selection)
- **Pemenang yang memilih hadiah** yang mereka inginkan
- **Bukan sistem yang assign hadiah** ke pemenang

Ini memberikan fleksibilitas dan customer experience yang lebih baik, serta manajemen stok yang lebih akurat.

**Terima kasih atas koreksi yang sangat tepat! 🎁**
