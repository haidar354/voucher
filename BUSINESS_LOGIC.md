# Business Logic Documentation - Voucher Management System

## 📖 Overview

Sistem ini dirancang untuk mengotomatisasi pemberian voucher kepada pelanggan berdasarkan transaksi pembelian mereka. Voucher digenerate secara otomatis mengikuti rule yang telah dikonfigurasi oleh admin.

---

## 🎯 Core Concepts

### 1. Rule Voucher (Aturan Pemberian Voucher)

Rule voucher adalah aturan yang menentukan kapan dan berapa banyak voucher yang akan diberikan kepada pelanggan.

#### Tipe Rule:

#### A. MINIMAL_BELANJA
Pelanggan mendapat voucher jika total belanja mencapai nilai minimal tertentu.

**Contoh:**
```
Rule: Minimal Belanja 50rb
- nilaiMinimal: 50000
- jumlahVoucher: 1

Transaksi 75,000 → Dapat 1 voucher ✅
Transaksi 40,000 → Tidak dapat voucher ❌
```

#### B. KELIPATAN
Pelanggan mendapat voucher berdasarkan kelipatan nilai belanja.

**Contoh:**
```
Rule: Kelipatan 100rb
- nilaiMinimal: 100000
- kelipatanDari: 100000
- jumlahVoucher: 1

Transaksi 250,000 → 250k / 100k = 2 kelipatan → Dapat 2 voucher ✅
Transaksi 350,000 → 350k / 100k = 3 kelipatan → Dapat 3 voucher ✅
Transaksi 80,000 → Tidak mencapai minimal → Tidak dapat voucher ❌
```

**Formula:**
```
kelipatan = floor(totalBelanja / kelipatanDari)
totalVoucher = kelipatan × jumlahVoucher
```

#### C. EVENT_KHUSUS
Voucher khusus yang hanya berlaku saat ada event aktif, dengan bonus voucher tambahan.

**Contoh:**
```
Event: Grand Opening
- bonusVoucherKhusus: 2

Rule: Event Grand Opening
- tipeRule: EVENT_KHUSUS
- nilaiMinimal: 200000
- jumlahVoucher: 3
- eventId: [event_id]

Transaksi 250,000 (saat event aktif) → Dapat 3 + 2 = 5 voucher ✅
Transaksi 250,000 (event tidak aktif) → Tidak dapat voucher ❌
```

---

### 2. Prioritas Rule

Rule diproses berurutan berdasarkan prioritas (angka lebih kecil = prioritas lebih tinggi).

**Contoh:**
```
Rule A: Prioritas 1 (diproses pertama)
Rule B: Prioritas 2 (diproses kedua)
Rule C: Prioritas 3 (diproses ketiga)
```

**Kenapa penting?**
Jika ada rule dengan `akumulasiRule = false`, sistem akan berhenti setelah rule pertama yang memenuhi syarat.

---

### 3. Akumulasi Rule

Menentukan apakah rule bisa digabungkan dengan rule lain atau tidak.

#### akumulasiRule = true (Default)
Semua rule yang memenuhi syarat akan diproses.

**Contoh:**
```
Rule A: Minimal 50rb → 1 voucher (akumulasi: true)
Rule B: Kelipatan 100rb → 1 voucher per 100rb (akumulasi: true)

Transaksi 250,000:
- Rule A: ✅ Dapat 1 voucher (250k >= 50k)
- Rule B: ✅ Dapat 2 voucher (250k / 100k = 2)
- Total: 3 voucher
```

#### akumulasiRule = false
Hanya rule pertama yang memenuhi syarat yang diproses (berdasarkan prioritas).

**Contoh:**
```
Rule A: Minimal 500rb → 5 voucher (prioritas: 1, akumulasi: false)
Rule B: Kelipatan 100rb → 1 voucher per 100rb (prioritas: 2, akumulasi: true)

Transaksi 600,000:
- Rule A: ✅ Dapat 5 voucher (600k >= 500k)
- Rule B: ❌ Tidak diproses (Rule A sudah match dan akumulasi = false)
- Total: 5 voucher
```

**Use Case:**
Gunakan `akumulasiRule = false` untuk rule premium/VIP yang ingin memberikan benefit eksklusif tanpa digabung dengan rule lain.

---

## 🔄 Alur Proses Generate Voucher

### Step-by-Step Process

```
1. Kasir input transaksi
   ↓
2. Sistem validasi:
   - User exists?
   - Kode struk unique?
   - Total belanja > 0?
   ↓
3. Simpan transaksi ke database
   ↓
4. EVALUASI RULES:
   ↓
   4a. Ambil semua rule aktif pada tanggal transaksi
   4b. Sort by prioritas (ASC)
   4c. Cek apakah ada event aktif hari ini
   ↓
5. PROSES SETIAP RULE:
   ↓
   For each rule:
     - Hitung jumlah voucher berdasarkan tipe rule
     - Jika dapat voucher:
       * Tambahkan ke list voucher yang akan digenerate
       * Jika akumulasiRule = false, STOP
     - Lanjut ke rule berikutnya
   ↓
6. GENERATE VOUCHER:
   ↓
   For each voucher:
     - Generate kode voucher unik (VCH-YYYYMMDD-XXXXX)
     - Generate nomor undian
     - Hitung tanggal kadaluarsa
     - Simpan voucher ke database
     - Buat log audit
   ↓
7. Return response dengan detail voucher yang digenerate
```

---

## 💡 Contoh Kasus Nyata

### Kasus 1: Toko Jam Tangan Reguler

**Setup Rules:**
```
Rule 1: Minimal Belanja 50rb
- Dapat 1 voucher
- Prioritas: 2
- Akumulasi: true
- Masa berlaku: 30 hari

Rule 2: Kelipatan 100rb
- Dapat 1 voucher per 100rb
- Prioritas: 1
- Akumulasi: true
- Masa berlaku: 60 hari
```

**Skenario Transaksi:**

| Total Belanja | Rule 1 (50rb) | Rule 2 (100rb) | Total Voucher |
|---------------|---------------|----------------|---------------|
| 40,000        | ❌ (< 50k)    | ❌ (< 100k)    | 0             |
| 75,000        | ✅ 1 voucher  | ❌ (< 100k)    | 1             |
| 150,000       | ✅ 1 voucher  | ✅ 1 voucher   | 2             |
| 250,000       | ✅ 1 voucher  | ✅ 2 voucher   | 3             |
| 500,000       | ✅ 1 voucher  | ✅ 5 voucher   | 6             |

---

### Kasus 2: Program VIP Customer

**Setup Rules:**
```
Rule 1: VIP Premium (Minimal 1 juta)
- Dapat 10 voucher
- Prioritas: 1
- Akumulasi: false ⚠️
- Masa berlaku: 90 hari

Rule 2: Kelipatan 100rb
- Dapat 1 voucher per 100rb
- Prioritas: 2
- Akumulasi: true
- Masa berlaku: 60 hari
```

**Skenario Transaksi:**

| Total Belanja | Rule 1 (VIP) | Rule 2 (100rb) | Total Voucher | Keterangan |
|---------------|--------------|----------------|---------------|------------|
| 500,000       | ❌ (< 1jt)   | ✅ 5 voucher   | 5             | Rule VIP tidak match |
| 1,200,000     | ✅ 10 voucher | ❌ Skip       | 10            | Rule VIP match, stop (akumulasi=false) |
| 2,500,000     | ✅ 10 voucher | ❌ Skip       | 10            | Rule VIP match, stop |

**Insight:**
Customer VIP dapat benefit eksklusif 10 voucher tanpa perlu dihitung kelipatan. Ini memberikan experience yang lebih premium.

---

### Kasus 3: Event Promo Spesial

**Setup:**
```
Event: Ramadan Sale
- Tanggal: 1-30 April 2024
- Bonus: 3 voucher ekstra
- Status: Aktif

Rule: Event Ramadan
- Tipe: EVENT_KHUSUS
- Minimal: 200rb
- Voucher: 2
- Prioritas: 1
- Akumulasi: false
- Event ID: [ramadan_sale_id]
```

**Skenario:**

| Tanggal | Total Belanja | Event Aktif? | Voucher | Keterangan |
|---------|---------------|--------------|---------|------------|
| 5 Apr   | 250,000       | ✅ Yes       | 2 + 3 = 5 | Event aktif, dapat bonus |
| 5 Mei   | 250,000       | ❌ No        | 0       | Event sudah selesai |
| 5 Apr   | 150,000       | ✅ Yes       | 0       | Event aktif tapi < minimal |

---

## 🎲 Nomor Undian

Setiap voucher dilengkapi dengan nomor undian unik untuk keperluan undian/lucky draw.

**Format:** `XXXX-XXXX-XXXX`
**Contoh:** `1234-5678-9012`

**Use Case:**
- Undian berhadiah bulanan
- Lucky draw event khusus
- Tracking untuk program loyalitas

---

## ⏰ Masa Berlaku Voucher

Setiap rule memiliki `masaBerlakuHari` yang menentukan berapa lama voucher valid.

**Contoh:**
```
Rule: Minimal 50rb
- masaBerlakuHari: 30

Transaksi: 30 September 2024
Voucher dibuat: 30 September 2024
Voucher kadaluarsa: 30 Oktober 2024
```

**Status Voucher:**
- **AKTIF**: Voucher baru dibuat, belum digunakan, belum expired
- **TERPAKAI**: Voucher sudah digunakan untuk transaksi
- **KADALUARSA**: Voucher melewati tanggal kadaluarsa
- **DIBATALKAN**: Voucher dibatalkan oleh admin

---

## 🔐 Authorization & Security

### Role-Based Access Control

| Endpoint | SUPER_ADMIN | ADMIN | KASIR |
|----------|-------------|-------|-------|
| Login | ✅ | ✅ | ✅ |
| Create User | ✅ | ✅ | ✅ |
| Create Transaction | ✅ | ✅ | ✅ |
| Validate Voucher | ✅ | ✅ | ✅ |
| Use Voucher | ✅ | ✅ | ✅ |
| Create Event | ✅ | ✅ | ❌ |
| Create Rule | ✅ | ✅ | ❌ |
| Register Admin | ✅ | ❌ | ❌ |
| Cancel Voucher | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ |

---

## 📊 Audit Trail

Setiap perubahan status voucher dicatat dalam `LogVoucher`:

```
Voucher dibuat → Log: DIBUAT
Voucher digunakan → Log: DIGUNAKAN
Voucher expired → Log: KADALUARSA
Voucher dibatalkan → Log: DIBATALKAN
```

**Informasi yang dicatat:**
- Aksi yang dilakukan
- Tanggal dan waktu
- Admin yang melakukan (jika ada)
- Keterangan tambahan

**Use Case:**
- Tracking untuk audit
- Investigasi jika ada dispute
- Analisis behavior customer
- Compliance requirement

---

## 🎯 Best Practices

### 1. Desain Rule yang Efektif

**DO:**
- ✅ Buat rule dengan prioritas yang jelas
- ✅ Gunakan akumulasi = false untuk rule premium
- ✅ Set masa berlaku yang reasonable (30-90 hari)
- ✅ Test rule dengan berbagai skenario transaksi

**DON'T:**
- ❌ Buat terlalu banyak rule yang overlap
- ❌ Set prioritas yang sama untuk banyak rule
- ❌ Masa berlaku terlalu pendek (< 7 hari)
- ❌ Lupa set tanggal selesai untuk rule temporary

### 2. Event Management

**DO:**
- ✅ Set tanggal mulai dan selesai yang jelas
- ✅ Deaktivasi event setelah selesai
- ✅ Buat rule khusus untuk setiap event
- ✅ Test event rule sebelum go-live

**DON'T:**
- ❌ Overlap event dengan periode yang sama
- ❌ Lupa deaktivasi event yang sudah selesai
- ❌ Set bonus voucher terlalu besar tanpa perhitungan

### 3. Voucher Lifecycle

**DO:**
- ✅ Jalankan cron job expire-vouchers setiap hari
- ✅ Kirim notifikasi 7 hari sebelum expired
- ✅ Monitor tingkat penggunaan voucher
- ✅ Analisis rule mana yang paling efektif

**DON'T:**
- ❌ Biarkan voucher expired tanpa notifikasi
- ❌ Cancel voucher tanpa alasan yang jelas
- ❌ Ignore voucher yang tidak pernah digunakan

---

## 📈 Metrics & KPI

### Key Metrics to Track:

1. **Voucher Generation Rate**
   - Berapa voucher yang digenerate per transaksi
   - Rule mana yang paling sering trigger

2. **Voucher Usage Rate**
   - Persentase voucher yang digunakan vs dibuat
   - Target: > 60%

3. **Voucher Expiry Rate**
   - Persentase voucher yang expired tanpa digunakan
   - Target: < 20%

4. **Average Transaction Value**
   - Apakah program voucher meningkatkan nilai transaksi?
   - Compare before vs after program

5. **Customer Retention**
   - Apakah customer kembali untuk menggunakan voucher?
   - Repeat purchase rate

---

## 🔮 Future Enhancements

### Potential Features:

1. **Dynamic Rule Adjustment**
   - Auto-adjust rule based on inventory
   - Time-based multiplier (happy hour)

2. **Voucher Transfer**
   - Allow customers to gift vouchers
   - Implement transfer limit

3. **Tiered Loyalty Program**
   - Bronze, Silver, Gold, Platinum
   - Different rules for each tier

4. **Smart Notifications**
   - WhatsApp/SMS integration
   - Email marketing automation

5. **Advanced Analytics**
   - Predictive analytics
   - Customer segmentation
   - ROI calculation

---

## ❓ FAQ

### Q: Apakah 1 transaksi bisa menggunakan multiple voucher?
**A:** Tidak, dalam implementasi saat ini 1 voucher = 1 transaksi. Untuk menggunakan multiple voucher, perlu enhancement di business logic.

### Q: Apakah voucher bisa ditransfer ke user lain?
**A:** Tidak, voucher terikat ke user yang melakukan transaksi. Untuk enable transfer, perlu tambahan endpoint dan business logic.

### Q: Bagaimana handle transaksi dengan tanggal masa lalu?
**A:** Sistem accept tanggal masa lalu. Rule evaluation akan menggunakan tanggal transaksi yang diinput, bukan tanggal sekarang.

### Q: Apakah bisa ada multiple event aktif bersamaan?
**A:** Ya, tapi hanya 1 event yang akan digunakan (yang pertama ditemukan). Untuk multiple event, perlu enhancement di logic.

### Q: Bagaimana jika rule overlap?
**A:** Sistem akan proses berdasarkan prioritas dan akumulasi. Jika akumulasi = true, semua rule yang match akan diproses. Jika false, hanya rule pertama.

---

**End of Business Logic Documentation**
