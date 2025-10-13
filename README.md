# Voucher Management System - Toko Jam Tangan

Sistem manajemen voucher untuk toko jam tangan yang otomatis menghasilkan voucher berdasarkan transaksi pelanggan dengan rule yang dapat dikonfigurasi.

## 🚀 Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Database**: MySQL (compatible with PostgreSQL)
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Date Handling**: date-fns
- **Password Hashing**: bcryptjs

## 📋 Features

### Core Features
- ✅ **Manajemen Admin** - Multi-level admin (SUPER_ADMIN, ADMIN, KASIR)
- ✅ **Manajemen Pelanggan** - CRUD pelanggan dengan pencarian
- ✅ **Manajemen Event** - Event promo dengan bonus voucher
- ✅ **Rule Voucher Fleksibel** - 3 tipe rule (Minimal Belanja, Kelipatan, Event Khusus)
- ✅ **Auto-Generate Voucher** - Otomatis generate voucher saat transaksi
- ✅ **Validasi & Penggunaan Voucher** - Validasi dan redeem voucher
- ✅ **Audit Trail** - Log semua aktivitas voucher
- ✅ **Reporting & Analytics** - Laporan lengkap voucher dan transaksi
- ✅ **Cron Jobs** - Auto-expire voucher dan notifikasi

### Business Logic Highlights

#### 1. Tipe Rule Voucher
- **MINIMAL_BELANJA**: Dapat voucher jika belanja >= nilai minimal
- **KELIPATAN**: Dapat voucher berdasarkan kelipatan nilai (contoh: setiap 100rb dapat 1 voucher)
- **EVENT_KHUSUS**: Voucher khusus untuk event tertentu dengan bonus tambahan

#### 2. Rule Akumulasi
- **Akumulasi = true**: Semua rule yang memenuhi syarat akan diproses
- **Akumulasi = false**: Hanya rule pertama yang memenuhi syarat (berdasarkan prioritas)

#### 3. Prioritas Rule
- Angka lebih kecil = prioritas lebih tinggi
- Rule diproses berurutan dari prioritas tertinggi

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js 18+ 
- MySQL (MAMP, XAMPP, atau MySQL standalone)
- npm atau yarn

> **📘 Menggunakan MAMP?** Lihat panduan lengkap di **`SETUP_MAMP_MYSQL.md`**

### 2. Clone & Install Dependencies

```bash
# Clone repository (atau extract zip)
cd coba4

# Install dependencies
npm install
```

### 3. Setup Database

**Option A: MAMP MySQL (Recommended untuk Development)**
```bash
# 1. Start MAMP dan pastikan MySQL running
# 2. Buka phpMyAdmin: http://localhost:8888/phpMyAdmin/
# 3. Buat database: voucher_db
# 4. Copy .env.example ke .env
copy .env.example .env

# 5. Edit .env dan sesuaikan DATABASE_URL
# DATABASE_URL="mysql://root:root@localhost:8889/voucher_db"
```

**Option B: MySQL Standalone**
```bash
# Buat database MySQL
mysql -u root -p
CREATE DATABASE voucher_db;
EXIT;

# Copy .env.example ke .env
copy .env.example .env

# Edit .env dan sesuaikan DATABASE_URL
# DATABASE_URL="mysql://root:password@localhost:3306/voucher_db"
```

**Option C: PostgreSQL**
```bash
# Buat database PostgreSQL
createdb voucher_db

# Edit schema.prisma, ubah provider ke "postgresql"
# Edit DATABASE_URL
# DATABASE_URL="postgresql://username:password@localhost:5432/voucher_db"
```

### 4. Generate Prisma Client & Run Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Push schema ke database
npm run db:push

# Atau gunakan migrations (recommended untuk production)
npm run db:migrate
```

### 5. Seed Database

```bash
# Seed initial data
npm run db:seed
```

**Default Admin Credentials:**
- Username: `admin` | Password: `admin123` (SUPER_ADMIN)
- Username: `kasir` | Password: `admin123` (KASIR)

### 6. Run Development Server

```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Semua endpoint (kecuali login) memerlukan JWT token di header:
```
Authorization: Bearer <token>
```

---

## 🔐 Authentication Endpoints

### 1. Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}

Response:
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "clxxx",
      "username": "admin",
      "namaLengkap": "Super Administrator",
      "role": "SUPER_ADMIN"
    }
  }
}
```

### 2. Register Admin (SUPER_ADMIN only)
```http
POST /api/auth/register
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "kasir2",
  "password": "password123",
  "namaLengkap": "Kasir Baru",
  "role": "KASIR"
}
```

### 3. Get Profile
```http
GET /api/admin/profile
Authorization: Bearer <token>
```

---

## 👥 User Management Endpoints

### 4. Create User
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "nama": "John Doe",
  "email": "john@example.com",
  "noHp": "081234567890",
  "alamat": "Jl. Contoh No. 123"
}
```

### 5. Search Users
```http
GET /api/users?query=john
Authorization: Bearer <token>
```

### 6. Get User Detail
```http
GET /api/users/{userId}
Authorization: Bearer <token>
```

---

## 🎉 Event Management Endpoints

### 7. Create Event (ADMIN/SUPER_ADMIN)
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "namaEvent": "Promo Lebaran",
  "deskripsi": "Promo spesial lebaran",
  "tanggalMulai": "2024-04-01T00:00:00Z",
  "tanggalSelesai": "2024-04-15T23:59:59Z",
  "bonusVoucherKhusus": 2,
  "aktif": true
}
```

### 8. Get Events
```http
GET /api/events?aktif=true
Authorization: Bearer <token>
```

### 9. Get Active Event Today
```http
GET /api/events/active-today
Authorization: Bearer <token>
```

### 10. Update Event (ADMIN/SUPER_ADMIN)
```http
PATCH /api/events/{eventId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "aktif": false
}
```

---

## 📋 Rule Voucher Endpoints

### 11. Create Rule (ADMIN/SUPER_ADMIN)
```http
POST /api/rules
Authorization: Bearer <token>
Content-Type: application/json

{
  "namaRule": "Minimal Belanja 100rb",
  "tipeRule": "MINIMAL_BELANJA",
  "nilaiMinimal": 100000,
  "jumlahVoucher": 2,
  "masaBerlakuHari": 30,
  "prioritas": 1,
  "akumulasiRule": true,
  "aktif": true,
  "tanggalMulai": "2024-01-01T00:00:00Z"
}
```

**Contoh Rule Kelipatan:**
```json
{
  "namaRule": "Kelipatan 50rb",
  "tipeRule": "KELIPATAN",
  "nilaiMinimal": 50000,
  "jumlahVoucher": 1,
  "kelipatanDari": 50000,
  "masaBerlakuHari": 60,
  "prioritas": 2,
  "akumulasiRule": true,
  "aktif": true,
  "tanggalMulai": "2024-01-01T00:00:00Z"
}
```

**Contoh Rule Event:**
```json
{
  "namaRule": "Event Spesial",
  "tipeRule": "EVENT_KHUSUS",
  "nilaiMinimal": 200000,
  "jumlahVoucher": 3,
  "eventId": "clxxx",
  "masaBerlakuHari": 90,
  "prioritas": 1,
  "akumulasiRule": false,
  "aktif": true,
  "tanggalMulai": "2024-01-01T00:00:00Z",
  "tanggalSelesai": "2024-12-31T23:59:59Z"
}
```

### 12. Get Rules
```http
GET /api/rules?aktif=true&tipeRule=MINIMAL_BELANJA
Authorization: Bearer <token>
```

### 13. Get Active Rules
```http
GET /api/rules/active
Authorization: Bearer <token>
```

### 14. Update Rule (ADMIN/SUPER_ADMIN)
```http
PATCH /api/rules/{ruleId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "aktif": false
}
```

---

## 💳 Transaction Endpoints (CORE LOGIC)

### 15. Create Transaction & Auto-Generate Vouchers ⭐
```http
POST /api/transaksi
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "clxxx",
  "kodeStruk": "STR-20240930-001",
  "totalBelanja": 250000,
  "tanggalTransaksi": "2024-09-30T10:00:00Z",
  "catatan": "Pembelian jam tangan Seiko"
}

Response:
{
  "success": true,
  "message": "Transaksi berhasil dibuat. 3 voucher telah digenerate.",
  "data": {
    "transaksi": {
      "id": "clxxx",
      "kodeStruk": "STR-20240930-001",
      "totalBelanja": 250000,
      "tanggalTransaksi": "2024-09-30T10:00:00Z",
      "user": {
        "nama": "John Doe",
        "noHp": "081234567890"
      }
    },
    "vouchersGenerated": [
      {
        "kodeVoucher": "VCH-20240930-ABC12",
        "tanggalKadaluarsa": "2024-10-30T10:00:00Z",
        "status": "AKTIF",
        "nomorUndian": "1234-5678-9012"
      }
    ],
    "summary": {
      "totalVoucher": 3,
      "rules": ["Minimal Belanja 50rb", "Kelipatan 100rb"]
    }
  }
}
```

**Business Logic Explanation:**
1. Sistem mengambil semua rule aktif pada tanggal transaksi
2. Cek apakah ada event aktif hari ini
3. Evaluasi setiap rule berdasarkan prioritas:
   - MINIMAL_BELANJA: Jika totalBelanja >= nilaiMinimal, dapat voucher
   - KELIPATAN: Hitung kelipatan, misal 250rb / 100rb = 2 voucher
   - EVENT_KHUSUS: Hanya jika ada event aktif + bonus voucher event
4. Jika rule.akumulasiRule = false, stop setelah rule pertama yang match
5. Generate voucher dengan kode unik dan nomor undian
6. Simpan log audit untuk setiap voucher

### 16. Get Transactions
```http
GET /api/transaksi?userId=clxxx&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=10
Authorization: Bearer <token>
```

### 17. Get Transaction Detail
```http
GET /api/transaksi/{transaksiId}
Authorization: Bearer <token>
```

---

## 🎟️ Voucher Management Endpoints

### 18. Validate Voucher
```http
POST /api/voucher/validate
Authorization: Bearer <token>
Content-Type: application/json

{
  "kodeVoucher": "VCH-20240930-ABC12"
}

Response:
{
  "success": true,
  "message": "Validasi voucher",
  "data": {
    "valid": true,
    "voucher": {
      "id": "clxxx",
      "kodeVoucher": "VCH-20240930-ABC12",
      "status": "AKTIF",
      "tanggalKadaluarsa": "2024-10-30T10:00:00Z",
      "user": {
        "nama": "John Doe",
        "noHp": "081234567890"
      }
    },
    "message": "Voucher valid dan dapat digunakan"
  }
}
```

### 19. Use Voucher
```http
POST /api/voucher/use
Authorization: Bearer <token>
Content-Type: application/json

{
  "kodeVoucher": "VCH-20240930-ABC12",
  "transaksiBelanjaId": "clxxx"
}
```

### 20. Get Vouchers
```http
GET /api/voucher?userId=clxxx&status=AKTIF&expired=false
Authorization: Bearer <token>
```

### 21. Get User Vouchers (Grouped by Status)
```http
GET /api/voucher/user/{userId}
Authorization: Bearer <token>
```

### 22. Cancel Voucher (SUPER_ADMIN only)
```http
PATCH /api/voucher/{voucherId}/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "keterangan": "Voucher dibatalkan karena kesalahan sistem"
}
```

---

## ⏰ Cron Job Endpoints

### 23. Expire Vouchers
```http
POST /api/cron/expire-vouchers

Response:
{
  "success": true,
  "message": "5 voucher berhasil diupdate menjadi kadaluarsa",
  "data": {
    "totalExpired": 5,
    "voucherIds": ["clxxx1", "clxxx2", ...]
  }
}
```

**Setup Cron:**
Jalankan endpoint ini setiap hari jam 00:00 menggunakan cron job atau task scheduler.

### 24. Notify Expiring Vouchers
```http
POST /api/cron/notify-expiring

Response:
{
  "success": true,
  "message": "10 user memiliki 25 voucher yang akan kadaluarsa dalam 7 hari",
  "data": {
    "totalNotified": 10,
    "totalVouchers": 25,
    "notifications": {
      "userId1": {
        "user": {...},
        "vouchers": [...]
      }
    }
  }
}
```

---

## 📊 Reporting Endpoints

### 25. Voucher Summary Report
```http
GET /api/reports/voucher-summary?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "totalDibuat": 150,
    "totalDigunakan": 85,
    "totalKadaluarsa": 20,
    "tingkatPenggunaan": 57,
    "voucherByRule": [
      { "namaRule": "Minimal Belanja 50rb", "jumlah": 80 },
      { "namaRule": "Kelipatan 100rb", "jumlah": 70 }
    ],
    "voucherByStatus": [
      { "status": "AKTIF", "jumlah": 45 },
      { "status": "TERPAKAI", "jumlah": 85 },
      { "status": "KADALUARSA", "jumlah": 20 }
    ]
  }
}
```

### 26. Transaction Summary Report
```http
GET /api/reports/transaksi-summary?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "totalTransaksi": 250,
    "totalBelanja": 125000000,
    "avgBelanja": 500000,
    "transaksiPerHari": [
      { "tanggal": "2024-01-01", "jumlah": 5, "total": 2500000 },
      { "tanggal": "2024-01-02", "jumlah": 8, "total": 4000000 }
    ]
  }
}
```

### 27. User Leaderboard
```http
GET /api/reports/user-leaderboard?limit=10
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "userId": "clxxx",
        "nama": "John Doe",
        "noHp": "081234567890",
        "totalBelanja": 5000000,
        "totalTransaksi": 15,
        "totalVoucher": 25
      }
    ]
  }
}
```

---

## 🗂️ Database Schema

### Models Overview
- **User** - Pelanggan toko
- **Admin** - Admin sistem (3 role: SUPER_ADMIN, ADMIN, KASIR)
- **Event** - Event promo
- **RuleVoucher** - Aturan generate voucher
- **TransaksiBelanja** - Transaksi pembelian
- **Voucher** - Voucher yang digenerate
- **LogVoucher** - Audit trail voucher

### Key Relations
- User → TransaksiBelanja (1:N)
- User → Voucher (1:N)
- Admin → TransaksiBelanja (1:N)
- Event → RuleVoucher (1:N)
- RuleVoucher → Voucher (1:N)
- TransaksiBelanja → Voucher (1:N) - voucher yang dibuat
- TransaksiBelanja → Voucher (1:N) - voucher yang digunakan
- Voucher → LogVoucher (1:N)

---

## 🧪 Testing Guide

### Manual Testing Flow

1. **Login sebagai Admin**
```bash
POST /api/auth/login
```

2. **Buat User Baru**
```bash
POST /api/users
```

3. **Buat Rule Voucher**
```bash
POST /api/rules
```

4. **Buat Transaksi (Voucher Auto-Generate)**
```bash
POST /api/transaksi
```

5. **Validasi Voucher**
```bash
POST /api/voucher/validate
```

6. **Gunakan Voucher**
```bash
POST /api/voucher/use
```

7. **Lihat Report**
```bash
GET /api/reports/voucher-summary
```

### Test Scenarios

#### Scenario 1: Minimal Belanja
- Rule: Minimal 50rb dapat 1 voucher
- Transaksi: 75rb
- Expected: 1 voucher

#### Scenario 2: Kelipatan
- Rule: Kelipatan 100rb dapat 1 voucher
- Transaksi: 350rb
- Expected: 3 voucher (350/100 = 3)

#### Scenario 3: Event Khusus
- Rule: Event minimal 200rb dapat 3 voucher + 2 bonus
- Transaksi: 250rb (saat event aktif)
- Expected: 5 voucher

#### Scenario 4: Akumulasi Rule
- Rule 1: Minimal 50rb dapat 1 voucher (akumulasi: true)
- Rule 2: Kelipatan 100rb dapat 1 voucher (akumulasi: true)
- Transaksi: 250rb
- Expected: 1 + 2 = 3 voucher

#### Scenario 5: Non-Akumulasi
- Rule 1: Minimal 500rb dapat 5 voucher (prioritas 1, akumulasi: false)
- Rule 2: Kelipatan 100rb dapat 1 voucher (prioritas 2, akumulasi: true)
- Transaksi: 600rb
- Expected: 5 voucher (hanya dari rule 1)

---

## 🔧 Prisma Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Create migration (production)
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
```

---

## 📝 Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/voucher_db?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Bcrypt
BCRYPT_ROUNDS=10

# API Rate Limiting
API_RATE_LIMIT=100

# Node Environment
NODE_ENV="development"
```

---

## 🚀 Deployment

### Production Checklist
- [ ] Change JWT_SECRET to strong random string
- [ ] Use production PostgreSQL database
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Setup proper CORS
- [ ] Configure rate limiting
- [ ] Setup cron jobs for expire-vouchers and notify-expiring
- [ ] Setup backup strategy
- [ ] Configure logging and monitoring

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 💡 Business Logic Deep Dive

### Rule Evaluation Algorithm

```typescript
// Pseudocode for rule evaluation
function evaluateRules(totalBelanja, tanggalTransaksi) {
  // 1. Get active rules sorted by priority
  activeRules = getRules({
    aktif: true,
    tanggalMulai <= tanggalTransaksi,
    tanggalSelesai >= tanggalTransaksi OR null
  }).sortBy('prioritas ASC')
  
  // 2. Check active event
  activeEvent = getEvent({
    aktif: true,
    tanggalMulai <= tanggalTransaksi,
    tanggalSelesai >= tanggalTransaksi
  })
  
  vouchersToGenerate = []
  
  // 3. Process each rule
  for (rule of activeRules) {
    jumlahVoucher = 0
    
    switch (rule.tipeRule) {
      case 'MINIMAL_BELANJA':
        if (totalBelanja >= rule.nilaiMinimal) {
          jumlahVoucher = rule.jumlahVoucher
        }
        break
        
      case 'KELIPATAN':
        if (totalBelanja >= rule.nilaiMinimal) {
          kelipatan = floor(totalBelanja / rule.kelipatanDari)
          jumlahVoucher = kelipatan * rule.jumlahVoucher
        }
        break
        
      case 'EVENT_KHUSUS':
        if (rule.eventId && activeEvent && rule.eventId == activeEvent.id) {
          jumlahVoucher = rule.jumlahVoucher + activeEvent.bonusVoucherKhusus
        }
        break
    }
    
    if (jumlahVoucher > 0) {
      vouchersToGenerate.push({
        ruleId: rule.id,
        jumlah: jumlahVoucher,
        masaBerlakuHari: rule.masaBerlakuHari
      })
      
      // IMPORTANT: Stop if not accumulative
      if (!rule.akumulasiRule) break
    }
  }
  
  return vouchersToGenerate
}
```

---

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the development team.

---

**Happy Coding! 🎉**
