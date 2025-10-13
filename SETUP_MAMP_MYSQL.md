# 🔧 Setup Guide untuk MAMP MySQL

## 📋 Prerequisites

- MAMP sudah terinstall
- Node.js 18+ terinstall
- MAMP MySQL sudah running

---

## 🚀 Step-by-Step Setup

### Step 1: Start MAMP

1. Buka aplikasi MAMP
2. Klik tombol **"Start"** untuk menjalankan Apache & MySQL
3. Pastikan MySQL berjalan (lampu hijau)
4. Catat port MySQL yang digunakan (biasanya **8889** atau **3306**)

### Step 2: Buat Database

**Option A: Via phpMyAdmin**
1. Buka browser: `http://localhost:8888/phpMyAdmin/` (atau port MAMP Anda)
2. Login dengan:
   - Username: `root`
   - Password: `root` (default MAMP)
3. Klik tab **"Databases"**
4. Buat database baru dengan nama: `voucher_db`
5. Collation: `utf8mb4_unicode_ci` (recommended)

**Option B: Via MySQL Command Line**
```bash
# Masuk ke MySQL (sesuaikan path MAMP Anda)
/Applications/MAMP/Library/bin/mysql -u root -p

# Windows MAMP:
C:\MAMP\bin\mysql\bin\mysql.exe -u root -p

# Password: root (default)

# Buat database
CREATE DATABASE voucher_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# Keluar
EXIT;
```

### Step 3: Install Dependencies

```bash
cd coba4
npm install
```

### Step 4: Setup Environment File

```bash
# Copy .env.example ke .env
copy .env.example .env
```

**Edit file `.env`** dan sesuaikan dengan konfigurasi MAMP Anda:

```env
# Untuk MAMP dengan port 8889 (default Mac)
DATABASE_URL="mysql://root:root@localhost:8889/voucher_db"

# Atau untuk MAMP dengan port 3306 (default Windows)
DATABASE_URL="mysql://root:root@localhost:3306/voucher_db"

# Atau jika menggunakan password berbeda
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:8889/voucher_db"
```

**Format DATABASE_URL:**
```
mysql://[username]:[password]@[host]:[port]/[database_name]
```

### Step 5: Generate Prisma Client

```bash
npm run db:generate
```

**Expected output:**
```
✔ Generated Prisma Client
```

### Step 6: Push Database Schema

```bash
npm run db:push
```

**Expected output:**
```
🚀  Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

### Step 7: Seed Database

```bash
npm run db:seed
```

**Expected output:**
```
🌱 Starting database seeding...
✅ Created 2 admins
✅ Created 5 users
✅ Created 1 event
✅ Created 4 voucher rules
✅ Created 3 transactions
✅ Created 3 sample vouchers

🎉 Seeding completed successfully!
```

### Step 8: Start Development Server

```bash
npm run dev
```

Server akan berjalan di: **http://localhost:3000**

---

## 🔍 Verifikasi Setup

### 1. Cek Database via phpMyAdmin

1. Buka: `http://localhost:8888/phpMyAdmin/`
2. Pilih database `voucher_db`
3. Anda harus melihat 8 tabel:
   - `admins`
   - `users`
   - `events`
   - `rule_vouchers`
   - `transaksi_belanja`
   - `vouchers`
   - `log_vouchers`
   - `_prisma_migrations`

### 2. Test API Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": "...",
      "username": "admin",
      "namaLengkap": "Super Administrator",
      "role": "SUPER_ADMIN"
    }
  }
}
```

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"

**Solusi:**
1. Pastikan MAMP MySQL sudah running (lampu hijau)
2. Cek port MySQL di MAMP preferences
3. Update DATABASE_URL di `.env` dengan port yang benar

### Error: "Access denied for user 'root'@'localhost'"

**Solusi:**
1. Cek username dan password di `.env`
2. Default MAMP: username=`root`, password=`root`
3. Jika sudah diganti, sesuaikan di DATABASE_URL

### Error: "Unknown database 'voucher_db'"

**Solusi:**
1. Buat database dulu via phpMyAdmin atau MySQL command
2. Pastikan nama database di DATABASE_URL sama dengan yang dibuat

### Error: "P1001: Can't reach database server at localhost:8889"

**Solusi:**
1. MAMP belum running → Start MAMP
2. Port salah → Cek MAMP preferences untuk port MySQL
3. Firewall blocking → Allow MAMP di firewall

### Error: "Port 3000 already in use"

**Solusi:**
```bash
# Windows - Kill process di port 3000
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F

# Atau ubah port di package.json
"dev": "next dev -p 3001"
```

---

## 📊 Perbedaan MySQL vs PostgreSQL

### Yang Berubah:
- ✅ Provider di `schema.prisma`: `mysql` (bukan `postgresql`)
- ✅ DATABASE_URL format: `mysql://` (bukan `postgresql://`)
- ✅ Port default: `8889` atau `3306` (bukan `5432`)

### Yang Tetap Sama:
- ✅ Semua API endpoints
- ✅ Business logic
- ✅ Prisma schema models
- ✅ Seeder data
- ✅ Dokumentasi

**Tidak ada perubahan kode!** Prisma ORM menangani perbedaan database secara otomatis.

---

## 🎯 MAMP Configuration Tips

### Recommended MAMP Settings:

1. **MySQL Port**: 8889 (Mac) atau 3306 (Windows)
2. **PHP Version**: 8.0+ (untuk phpMyAdmin)
3. **Apache Port**: 8888 (default)

### Cara Cek Port MySQL di MAMP:

1. Buka MAMP
2. Klik **"Preferences"** / **"Pengaturan"**
3. Tab **"Ports"**
4. Lihat **"MySQL Port"**

### Cara Akses MySQL via Terminal:

**Mac:**
```bash
/Applications/MAMP/Library/bin/mysql -u root -p
```

**Windows:**
```bash
C:\MAMP\bin\mysql\bin\mysql.exe -u root -p
```

---

## 📝 Quick Reference

### Default MAMP Credentials:
- **MySQL Username**: `root`
- **MySQL Password**: `root`
- **MySQL Port**: `8889` (Mac) atau `3306` (Windows)
- **phpMyAdmin**: `http://localhost:8888/phpMyAdmin/`

### DATABASE_URL Examples:

```env
# MAMP Mac (port 8889)
DATABASE_URL="mysql://root:root@localhost:8889/voucher_db"

# MAMP Windows (port 3306)
DATABASE_URL="mysql://root:root@localhost:3306/voucher_db"

# Custom password
DATABASE_URL="mysql://root:mypassword@localhost:8889/voucher_db"

# Custom host (jika tidak localhost)
DATABASE_URL="mysql://root:root@127.0.0.1:8889/voucher_db"
```

---

## ✅ Setup Checklist

- [ ] MAMP installed dan running
- [ ] MySQL service running (lampu hijau)
- [ ] Database `voucher_db` sudah dibuat
- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured dengan DATABASE_URL yang benar
- [ ] Prisma Client generated (`npm run db:generate`)
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Database seeded (`npm run db:seed`)
- [ ] Dev server running (`npm run dev`)
- [ ] Login test berhasil

---

## 🎉 Selesai!

Sistem Anda sekarang sudah berjalan dengan **MAMP MySQL**!

**Next Steps:**
1. Baca `QUICKSTART.md` untuk panduan cepat
2. Ikuti `TESTING_GUIDE.md` untuk test semua fitur
3. Baca `README.md` untuk dokumentasi lengkap

**Happy Coding! 🚀**
