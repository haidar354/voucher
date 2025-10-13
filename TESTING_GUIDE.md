# Testing Guide - Voucher Management System

## 📋 Prerequisites

1. Server running: `npm run dev`
2. Database seeded: `npm run db:seed`
3. API testing tool: Postman, Insomnia, or cURL

## 🔐 Step 1: Authentication

### Login as Admin

**Request:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Expected Response:**
```json
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

**Save the token** - You'll need it for all subsequent requests!

---

## 👥 Step 2: Create a User

**Request:**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "nama": "Test User",
    "email": "test@example.com",
    "noHp": "081999888777",
    "alamat": "Jl. Test No. 123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User berhasil dibuat",
  "data": {
    "user": {
      "id": "clyyy",
      "nama": "Test User",
      "email": "test@example.com",
      "noHp": "081999888777",
      "alamat": "Jl. Test No. 123",
      "tanggalDaftar": "2024-09-30T05:37:30.000Z"
    }
  }
}
```

**Save the user ID** for creating transactions!

---

## 📋 Step 3: Create Voucher Rules

### Rule 1: Minimal Belanja 50rb

**Request:**
```bash
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "namaRule": "Minimal Belanja 50rb",
    "tipeRule": "MINIMAL_BELANJA",
    "nilaiMinimal": 50000,
    "jumlahVoucher": 1,
    "masaBerlakuHari": 30,
    "prioritas": 2,
    "akumulasiRule": true,
    "aktif": true,
    "tanggalMulai": "2024-01-01T00:00:00Z"
  }'
```

### Rule 2: Kelipatan 100rb

**Request:**
```bash
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "namaRule": "Kelipatan 100rb",
    "tipeRule": "KELIPATAN",
    "nilaiMinimal": 100000,
    "jumlahVoucher": 1,
    "kelipatanDari": 100000,
    "masaBerlakuHari": 60,
    "prioritas": 1,
    "akumulasiRule": true,
    "aktif": true,
    "tanggalMulai": "2024-01-01T00:00:00Z"
  }'
```

### Rule 3: Premium 500rb

**Request:**
```bash
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "namaRule": "Premium 500rb",
    "tipeRule": "MINIMAL_BELANJA",
    "nilaiMinimal": 500000,
    "jumlahVoucher": 5,
    "masaBerlakuHari": 90,
    "prioritas": 1,
    "akumulasiRule": false,
    "aktif": true,
    "tanggalMulai": "2024-01-01T00:00:00Z"
  }'
```

---

## 💳 Step 4: Test Transaction Scenarios

### Scenario A: Belanja 75,000 (Dapat 1 Voucher)

**Request:**
```bash
curl -X POST http://localhost:3000/api/transaksi \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "userId": "USER_ID_HERE",
    "kodeStruk": "TEST-001",
    "totalBelanja": 75000,
    "catatan": "Test transaksi 75rb"
  }'
```

**Expected Result:**
- ✅ 1 voucher from "Minimal Belanja 50rb" rule
- Total: **1 voucher**

---

### Scenario B: Belanja 250,000 (Dapat 3 Voucher)

**Request:**
```bash
curl -X POST http://localhost:3000/api/transaksi \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "userId": "USER_ID_HERE",
    "kodeStruk": "TEST-002",
    "totalBelanja": 250000,
    "catatan": "Test transaksi 250rb"
  }'
```

**Expected Result:**
- ✅ 1 voucher from "Minimal Belanja 50rb" (akumulasi: true)
- ✅ 2 vouchers from "Kelipatan 100rb" (250k / 100k = 2)
- Total: **3 vouchers**

**Response Example:**
```json
{
  "success": true,
  "message": "Transaksi berhasil dibuat. 3 voucher telah digenerate.",
  "data": {
    "transaksi": {
      "id": "clzzz",
      "kodeStruk": "TEST-002",
      "totalBelanja": 250000,
      "tanggalTransaksi": "2024-09-30T05:37:30.000Z",
      "user": {
        "nama": "Test User",
        "noHp": "081999888777"
      }
    },
    "vouchersGenerated": [
      {
        "kodeVoucher": "VCH-20240930-ABC12",
        "tanggalKadaluarsa": "2024-10-30T05:37:30.000Z",
        "status": "AKTIF",
        "nomorUndian": "1234-5678-9012"
      },
      {
        "kodeVoucher": "VCH-20240930-DEF34",
        "tanggalKadaluarsa": "2024-11-29T05:37:30.000Z",
        "status": "AKTIF",
        "nomorUndian": "2345-6789-0123"
      },
      {
        "kodeVoucher": "VCH-20240930-GHI56",
        "tanggalKadaluarsa": "2024-11-29T05:37:30.000Z",
        "status": "AKTIF",
        "nomorUndian": "3456-7890-1234"
      }
    ],
    "summary": {
      "totalVoucher": 3,
      "rules": ["Minimal Belanja 50rb", "Kelipatan 100rb"]
    }
  }
}
```

---

### Scenario C: Belanja 550,000 (Dapat 5 Voucher - Non Akumulasi)

**Request:**
```bash
curl -X POST http://localhost:3000/api/transaksi \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "userId": "USER_ID_HERE",
    "kodeStruk": "TEST-003",
    "totalBelanja": 550000,
    "catatan": "Test transaksi 550rb"
  }'
```

**Expected Result:**
- ✅ 5 vouchers from "Premium 500rb" (prioritas 1, akumulasiRule: false)
- ❌ Rules lain tidak diproses karena akumulasi = false
- Total: **5 vouchers**

---

### Scenario D: Belanja 350,000 (Dapat 4 Voucher)

**Request:**
```bash
curl -X POST http://localhost:3000/api/transaksi \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "userId": "USER_ID_HERE",
    "kodeStruk": "TEST-004",
    "totalBelanja": 350000,
    "catatan": "Test transaksi 350rb"
  }'
```

**Expected Result:**
- ✅ 1 voucher from "Minimal Belanja 50rb"
- ✅ 3 vouchers from "Kelipatan 100rb" (350k / 100k = 3)
- Total: **4 vouchers**

---

## 🎟️ Step 5: Validate Voucher

**Request:**
```bash
curl -X POST http://localhost:3000/api/voucher/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "kodeVoucher": "VCH-20240930-ABC12"
  }'
```

**Expected Response (Valid):**
```json
{
  "success": true,
  "message": "Validasi voucher",
  "data": {
    "valid": true,
    "voucher": {
      "id": "clxxx",
      "kodeVoucher": "VCH-20240930-ABC12",
      "status": "AKTIF",
      "tanggalKadaluarsa": "2024-10-30T05:37:30.000Z",
      "user": {
        "nama": "Test User",
        "noHp": "081999888777"
      }
    },
    "message": "Voucher valid dan dapat digunakan"
  }
}
```

---

## ✅ Step 6: Use Voucher

**Request:**
```bash
curl -X POST http://localhost:3000/api/voucher/use \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "kodeVoucher": "VCH-20240930-ABC12",
    "transaksiBelanjaId": "TRANSAKSI_ID_HERE"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Voucher berhasil digunakan",
  "data": {
    "voucher": {
      "id": "clxxx",
      "kodeVoucher": "VCH-20240930-ABC12",
      "status": "TERPAKAI",
      "tanggalDigunakan": "2024-09-30T05:37:30.000Z",
      "transaksiPemakaianId": "clyyy"
    }
  }
}
```

---

## 📊 Step 7: View Reports

### Voucher Summary

**Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/voucher-summary?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Transaction Summary

**Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/transaksi-summary?startDate=2024-01-01&endDate=2024-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### User Leaderboard

**Request:**
```bash
curl -X GET "http://localhost:3000/api/reports/user-leaderboard?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🎉 Step 8: Test Event-Based Voucher

### Create Event

**Request:**
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "namaEvent": "Flash Sale",
    "deskripsi": "Flash sale akhir bulan",
    "tanggalMulai": "2024-09-30T00:00:00Z",
    "tanggalSelesai": "2024-10-05T23:59:59Z",
    "bonusVoucherKhusus": 3,
    "aktif": true
  }'
```

### Create Event Rule

**Request:**
```bash
curl -X POST http://localhost:3000/api/rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "namaRule": "Flash Sale Special",
    "tipeRule": "EVENT_KHUSUS",
    "nilaiMinimal": 200000,
    "jumlahVoucher": 2,
    "eventId": "EVENT_ID_HERE",
    "masaBerlakuHari": 14,
    "prioritas": 1,
    "akumulasiRule": false,
    "aktif": true,
    "tanggalMulai": "2024-09-30T00:00:00Z",
    "tanggalSelesai": "2024-10-05T23:59:59Z"
  }'
```

### Test Transaction During Event

**Request:**
```bash
curl -X POST http://localhost:3000/api/transaksi \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "userId": "USER_ID_HERE",
    "kodeStruk": "EVENT-001",
    "totalBelanja": 250000,
    "catatan": "Transaksi saat event"
  }'
```

**Expected Result:**
- ✅ 2 vouchers from rule
- ✅ 3 bonus vouchers from event
- Total: **5 vouchers**

---

## ⏰ Step 9: Test Cron Jobs

### Expire Old Vouchers

**Request:**
```bash
curl -X POST http://localhost:3000/api/cron/expire-vouchers
```

### Get Expiring Vouchers (Next 7 Days)

**Request:**
```bash
curl -X POST http://localhost:3000/api/cron/notify-expiring
```

---

## 🧪 Advanced Test Cases

### Test Case 1: Duplicate Receipt Code
**Expected:** Error 409 - Kode struk sudah digunakan

### Test Case 2: Invalid User ID
**Expected:** Error 404 - User tidak ditemukan

### Test Case 3: Use Expired Voucher
**Expected:** Error - Voucher sudah kadaluarsa

### Test Case 4: Use Already Used Voucher
**Expected:** Error - Voucher tidak dapat digunakan. Status: TERPAKAI

### Test Case 5: Cancel Voucher (SUPER_ADMIN only)
**Expected:** Success - Voucher status changed to DIBATALKAN

---

## 📝 Checklist

- [ ] Login berhasil dan dapat token
- [ ] Create user berhasil
- [ ] Create 3 voucher rules berhasil
- [ ] Transaction 75k → 1 voucher
- [ ] Transaction 250k → 3 vouchers
- [ ] Transaction 550k → 5 vouchers (non-akumulasi)
- [ ] Validate voucher berhasil
- [ ] Use voucher berhasil
- [ ] View reports berhasil
- [ ] Create event berhasil
- [ ] Transaction saat event → bonus vouchers
- [ ] Expire vouchers cron berhasil
- [ ] Notify expiring cron berhasil

---

## 🐛 Common Issues

### Issue: "Token tidak valid atau expired"
**Solution:** Login ulang dan gunakan token baru

### Issue: "User tidak ditemukan"
**Solution:** Pastikan userId yang digunakan valid

### Issue: "Kode struk sudah digunakan"
**Solution:** Gunakan kode struk yang berbeda

### Issue: Database connection error
**Solution:** Pastikan PostgreSQL running dan DATABASE_URL benar

---

## 📞 Need Help?

Jika ada error atau hasil tidak sesuai ekspektasi:
1. Cek console log server
2. Cek database dengan `npm run db:studio`
3. Pastikan semua rules aktif dan dalam range tanggal
4. Verify token masih valid

**Happy Testing! 🎉**
