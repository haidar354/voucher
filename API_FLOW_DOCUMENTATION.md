# 📚 Dokumentasi Lengkap Alur Semua API Endpoints

## 📋 Daftar Isi

1. [Authentication APIs](#1-authentication-apis)
2. [User Management APIs](#2-user-management-apis)
3. [Event Management APIs](#3-event-management-apis)
4. [Rule Management APIs](#4-rule-management-apis)
5. [Transaction & Voucher Generation APIs](#5-transaction--voucher-generation-apis)
6. [Voucher Management APIs](#6-voucher-management-apis)
7. [Cron Job APIs](#7-cron-job-apis)
8. [Reporting & Analytics APIs](#8-reporting--analytics-apis)

---

## 1. Authentication APIs

### 1.1 POST /api/auth/login

**Fungsi**: Login admin dan mendapatkan JWT token

**Alur Lengkap**:

```
Client
  ↓
  POST /api/auth/login
  Body: { username, password }
  ↓
app/api/auth/login/route.ts (POST function)
  ↓
  1. Validate input dengan loginSchema (lib/validations.ts)
     - username: min 3 karakter
     - password: min 6 karakter
  ↓
  2. Cari admin di database (lib/prisma.ts)
     SQL: SELECT * FROM admins WHERE username = ?
  ↓
  3. Verify password dengan bcrypt.compare()
     - Compare password input dengan hash di database
  ↓
  4. Generate JWT token (jsonwebtoken)
     - Payload: { adminId, username, role }
     - Secret: process.env.JWT_SECRET
     - Expires: 7 days
  ↓
  5. Format response (lib/response.ts)
     - Return token + admin info
  ↓
Client menerima token
```

**Request Example**:
```json
POST /api/auth/login
{
  "username": "admin",
  "password": "admin123"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Login berhasil",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "admin": {
      "id": 1,
      "username": "admin",
      "namaLengkap": "Super Administrator",
      "role": "SUPER_ADMIN"
    }
  }
}
```

**File yang Terlibat**:
- `app/api/auth/login/route.ts` - Main handler
- `lib/validations.ts` - loginSchema
- `lib/prisma.ts` - Database query
- `lib/response.ts` - Response formatter
- `bcryptjs` - Password verification
- `jsonwebtoken` - JWT generation

---

### 1.2 POST /api/auth/register

**Fungsi**: Register admin baru (hanya SUPER_ADMIN)

**Alur Lengkap**:

```
Client
  ↓
  POST /api/auth/register
  Header: Authorization: Bearer <token>
  Body: { username, password, namaLengkap, role }
  ↓
app/api/auth/register/route.ts (POST function)
  ↓
  1. Authentication (middleware/auth.ts)
     - Extract & verify JWT token
     - Check admin exists & aktif
  ↓
  2. Authorization (middleware/authorize.ts)
     - Check role = SUPER_ADMIN
  ↓
  3. Validate input (lib/validations.ts)
     - registerAdminSchema
  ↓
  4. Check username unique
     SQL: SELECT * FROM admins WHERE username = ?
  ↓
  5. Hash password dengan bcrypt
     - bcrypt.hash(password, 10)
  ↓
  6. Create admin di database
     SQL: INSERT INTO admins (username, password, namaLengkap, role)
  ↓
  7. Return success response
  ↓
Client
```

**Request Example**:
```json
POST /api/auth/register
Authorization: Bearer <super_admin_token>
{
  "username": "kasir2",
  "password": "kasir123",
  "namaLengkap": "Kasir Dua",
  "role": "KASIR"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Admin berhasil didaftarkan",
  "data": {
    "admin": {
      "id": 3,
      "username": "kasir2",
      "namaLengkap": "Kasir Dua",
      "role": "KASIR",
      "aktif": true
    }
  }
}
```

---

### 1.3 GET /api/auth/me

**Fungsi**: Get current logged in admin info

**Alur Lengkap**:

```
Client
  ↓
  GET /api/auth/me
  Header: Authorization: Bearer <token>
  ↓
app/api/auth/me/route.ts (GET function)
  ↓
  1. Authentication (middleware/auth.ts)
     - Verify JWT token
     - Extract adminId from token
  ↓
  2. Get admin from database
     SQL: SELECT * FROM admins WHERE id = ?
  ↓
  3. Return admin info (without password)
  ↓
Client
```

**Request Example**:
```
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Example**:
```json
{
  "success": true,
  "message": "Admin info berhasil diambil",
  "data": {
    "admin": {
      "id": 1,
      "username": "admin",
      "namaLengkap": "Super Administrator",
      "role": "SUPER_ADMIN",
      "aktif": true
    }
  }
}
```

---

## 2. User Management APIs

### 2.1 GET /api/users

**Fungsi**: Get list semua users dengan pagination

**Alur Lengkap**:

```
Client
  ↓
  GET /api/users?page=1&limit=10
  Header: Authorization: Bearer <token>
  ↓
app/api/users/route.ts (GET function)
  ↓
  1. Authentication (middleware/auth.ts)
  ↓
  2. Authorization (middleware/authorize.ts)
     - Allow: SUPER_ADMIN, ADMIN, KASIR
  ↓
  3. Parse & validate query params (lib/validations.ts)
     - paginationSchema: { page, limit }
  ↓
  4. Database query (lib/prisma.ts)
     - Query 1: Get users dengan pagination
       SQL: SELECT * FROM users ORDER BY createdAt DESC LIMIT 10 OFFSET 0
     - Query 2: Count total users
       SQL: SELECT COUNT(*) FROM users
  ↓
  5. Calculate pagination metadata
     - totalPages = Math.ceil(total / limit)
  ↓
  6. Format response dengan pagination
  ↓
Client
```

**Request Example**:
```
GET /api/users?page=1&limit=10
Authorization: Bearer <token>
```

**Response Example**:
```json
{
  "success": true,
  "message": "Users berhasil diambil",
  "data": {
    "users": [
      {
        "id": 1,
        "nama": "Budi Santoso",
        "email": "budi@example.com",
        "noHp": "081234567890",
        "alamat": "Jakarta",
        "memberTier": "VIP",
        "tanggalDaftar": "2025-01-01T00:00:00.000Z"
      }
    ]
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### 2.2 POST /api/users

**Fungsi**: Create user baru

**Alur Lengkap**:

```
Client
  ↓
  POST /api/users
  Header: Authorization: Bearer <token>
  Body: { nama, email, noHp, alamat, memberTier }
  ↓
app/api/users/route.ts (POST function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Validate input (createUserSchema)
     - nama: min 2 karakter
     - email: valid email (optional)
     - noHp: 10-15 digit
     - alamat: optional
     - memberTier: optional (VIP, GOLD, SILVER, BRONZE)
  ↓
  4. Check noHp unique
     SQL: SELECT * FROM users WHERE noHp = ?
  ↓
  5. Check email unique (if provided)
     SQL: SELECT * FROM users WHERE email = ?
  ↓
  6. Create user di database
     SQL: INSERT INTO users (nama, email, noHp, alamat, memberTier)
  ↓
  7. Return created user
  ↓
Client
```

**Request Example**:
```json
POST /api/users
Authorization: Bearer <token>
{
  "nama": "Citra Dewi",
  "email": "citra@example.com",
  "noHp": "081234567892",
  "alamat": "Surabaya",
  "memberTier": "GOLD"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "User berhasil dibuat",
  "data": {
    "user": {
      "id": 3,
      "nama": "Citra Dewi",
      "email": "citra@example.com",
      "noHp": "081234567892",
      "alamat": "Surabaya",
      "memberTier": "GOLD",
      "tanggalDaftar": "2025-09-30T07:00:00.000Z"
    }
  }
}
```

---

### 2.3 GET /api/users/[id]

**Fungsi**: Get detail user by ID

**Alur Lengkap**:

```
Client
  ↓
  GET /api/users/1
  Header: Authorization: Bearer <token>
  ↓
app/api/users/[id]/route.ts (GET function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Get user by ID
     SQL: SELECT * FROM users WHERE id = 1
  ↓
  4. If not found → 404 error
  ↓
  5. Include related data (optional):
     - transaksi (transactions)
     - voucher (vouchers)
  ↓
  6. Return user detail
  ↓
Client
```

**Request Example**:
```
GET /api/users/1
Authorization: Bearer <token>
```

**Response Example**:
```json
{
  "success": true,
  "message": "User berhasil diambil",
  "data": {
    "user": {
      "id": 1,
      "nama": "Budi Santoso",
      "email": "budi@example.com",
      "noHp": "081234567890",
      "alamat": "Jakarta",
      "memberTier": "VIP",
      "tanggalDaftar": "2025-01-01T00:00:00.000Z",
      "transaksi": [],
      "voucher": []
    }
  }
}
```

---

### 2.4 PATCH /api/users/[id]

**Fungsi**: Update user data

**Alur Lengkap**:

```
Client
  ↓
  PATCH /api/users/1
  Header: Authorization: Bearer <token>
  Body: { nama, email, alamat, memberTier }
  ↓
app/api/users/[id]/route.ts (PATCH function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN)
  ↓
  3. Validate input (updateUserSchema)
     - All fields optional
  ↓
  4. Check user exists
     SQL: SELECT * FROM users WHERE id = 1
  ↓
  5. If email changed, check unique
     SQL: SELECT * FROM users WHERE email = ? AND id != 1
  ↓
  6. Update user
     SQL: UPDATE users SET nama=?, email=?, alamat=?, memberTier=? WHERE id=1
  ↓
  7. Return updated user
  ↓
Client
```

**Request Example**:
```json
PATCH /api/users/1
Authorization: Bearer <token>
{
  "memberTier": "VIP",
  "alamat": "Jakarta Selatan"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "User berhasil diupdate",
  "data": {
    "user": {
      "id": 1,
      "nama": "Budi Santoso",
      "email": "budi@example.com",
      "noHp": "081234567890",
      "alamat": "Jakarta Selatan",
      "memberTier": "VIP"
    }
  }
}
```

---

## 3. Event Management APIs

### 3.1 GET /api/events

**Fungsi**: Get list semua events

**Alur Lengkap**:

```
Client
  ↓
  GET /api/events?page=1&limit=10
  ↓
app/api/events/route.ts (GET function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Validate pagination
  ↓
  4. Query events dengan pagination
     SQL: SELECT * FROM events ORDER BY tanggalMulai DESC
  ↓
  5. Return events dengan pagination
  ↓
Client
```

---

### 3.2 POST /api/events

**Fungsi**: Create event baru

**Alur Lengkap**:

```
Client
  ↓
  POST /api/events
  Body: { namaEvent, deskripsi, tanggalMulai, tanggalSelesai, bonusVoucherKhusus, aktif }
  ↓
app/api/events/route.ts (POST function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN)
  ↓
  3. Validate input (createEventSchema)
     - namaEvent: min 3 karakter
     - tanggalMulai & tanggalSelesai: valid dates
     - tanggalSelesai >= tanggalMulai
     - bonusVoucherKhusus: >= 0
  ↓
  4. Create event
     SQL: INSERT INTO events (namaEvent, deskripsi, tanggalMulai, tanggalSelesai, bonusVoucherKhusus, aktif)
  ↓
  5. Return created event
  ↓
Client
```

**Request Example**:
```json
POST /api/events
Authorization: Bearer <token>
{
  "namaEvent": "Promo Tahun Baru 2025",
  "deskripsi": "Promo spesial tahun baru",
  "tanggalMulai": "2025-01-01T00:00:00Z",
  "tanggalSelesai": "2025-01-31T23:59:59Z",
  "bonusVoucherKhusus": 2,
  "aktif": true
}
```

---

### 3.3 PATCH /api/events/[id]

**Fungsi**: Update event

**Alur Lengkap**:

```
Client
  ↓
  PATCH /api/events/1
  Body: { namaEvent, aktif }
  ↓
app/api/events/[id]/route.ts (PATCH function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN)
  ↓
  3. Validate input (updateEventSchema)
  ↓
  4. Check event exists
  ↓
  5. Update event
     SQL: UPDATE events SET namaEvent=?, aktif=? WHERE id=1
  ↓
  6. Return updated event
  ↓
Client
```

---

### 3.4 DELETE /api/events/[id]

**Fungsi**: Delete event

**Alur Lengkap**:

```
Client
  ↓
  DELETE /api/events/1
  ↓
app/api/events/[id]/route.ts (DELETE function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN only)
  ↓
  3. Check event exists
  ↓
  4. Check if event has related rules
     SQL: SELECT COUNT(*) FROM rule_vouchers WHERE eventId = 1
  ↓
  5. If has rules → Error (cannot delete)
  ↓
  6. Delete event
     SQL: DELETE FROM events WHERE id = 1
  ↓
  7. Return success
  ↓
Client
```

---

## 4. Rule Management APIs

### 4.1 GET /api/rules

**Fungsi**: Get list semua rules

**Alur Lengkap**:

```
Client
  ↓
  GET /api/rules?page=1&limit=10
  ↓
app/api/rules/route.ts (GET function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Validate pagination
  ↓
  4. Query rules dengan pagination & include event
     SQL: SELECT r.*, e.* FROM rule_vouchers r 
          LEFT JOIN events e ON r.eventId = e.id
          ORDER BY r.prioritas ASC
  ↓
  5. Return rules dengan pagination
  ↓
Client
```

---

### 4.2 POST /api/rules

**Fungsi**: Create rule baru

**Alur Lengkap**:

```
Client
  ↓
  POST /api/rules
  Body: { namaRule, tipeRule, nilaiMinimal, jumlahVoucher, ... }
  ↓
app/api/rules/route.ts (POST function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN)
  ↓
  3. Validate input (createRuleSchema)
     - Tipe rule: MINIMAL_BELANJA, KELIPATAN, EVENT_KHUSUS, 
                  BRAND_SPECIFIC, HIGH_VALUE_PURCHASE, NEW_COLLECTION,
                  MEMBER_EXCLUSIVE, TIME_BASED, BUNDLING
     - Validasi field sesuai tipe rule
  ↓
  4. VALIDASI PENTING: Jika aktif = true
     - Nonaktifkan semua rule lain
     SQL: UPDATE rule_vouchers SET aktif = false WHERE aktif = true
  ↓
  5. Create rule
     SQL: INSERT INTO rule_vouchers (namaRule, tipeRule, nilaiMinimal, ...)
  ↓
  6. Return created rule
  ↓
Client
```

**Request Example (KELIPATAN)**:
```json
POST /api/rules
Authorization: Bearer <token>
{
  "namaRule": "Kelipatan 100rb",
  "tipeRule": "KELIPATAN",
  "nilaiMinimal": 100000,
  "kelipatanDari": 100000,
  "jumlahVoucher": 1,
  "masaBerlakuHari": 60,
  "aktif": true,
  "tanggalMulai": "2025-01-01T00:00:00Z"
}
```

**Request Example (BRAND_SPECIFIC)**:
```json
POST /api/rules
Authorization: Bearer <token>
{
  "namaRule": "Promo Seiko",
  "tipeRule": "BRAND_SPECIFIC",
  "nilaiMinimal": 2000000,
  "brandName": "Seiko",
  "jumlahVoucher": 1,
  "voucherValue": 200000,
  "masaBerlakuHari": 30,
  "aktif": true,
  "tanggalMulai": "2025-01-01T00:00:00Z"
}
```

---

### 4.3 PATCH /api/rules/[id]

**Fungsi**: Update rule

**Alur Lengkap**:

```
Client
  ↓
  PATCH /api/rules/1
  Body: { aktif: true }
  ↓
app/api/rules/[id]/route.ts (PATCH function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN)
  ↓
  3. Validate input (updateRuleSchema)
  ↓
  4. Check rule exists
  ↓
  5. VALIDASI: Jika aktif = true
     - Nonaktifkan rule lain (kecuali rule ini)
     SQL: UPDATE rule_vouchers SET aktif = false 
          WHERE aktif = true AND id != 1
  ↓
  6. Update rule
     SQL: UPDATE rule_vouchers SET aktif=true WHERE id=1
  ↓
  7. Return updated rule
  ↓
Client
```

---

### 4.4 DELETE /api/rules/[id]

**Fungsi**: Delete rule

**Alur Lengkap**:

```
Client
  ↓
  DELETE /api/rules/1
  ↓
app/api/rules/[id]/route.ts (DELETE function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN only)
  ↓
  3. Check rule exists
  ↓
  4. Check if rule has vouchers
     SQL: SELECT COUNT(*) FROM vouchers WHERE ruleId = 1
  ↓
  5. If has vouchers → Error (cannot delete)
  ↓
  6. Delete rule
     SQL: DELETE FROM rule_vouchers WHERE id = 1
  ↓
  7. Return success
  ↓
Client
```

---

## 5. Transaction & Voucher Generation APIs

### 5.1 POST /api/transaksi

**Fungsi**: Create transaksi & AUTO-GENERATE voucher

**⭐ INI ENDPOINT PALING PENTING! ⭐**

**Alur Lengkap**:

```
Client
  ↓
  POST /api/transaksi
  Body: { 
    userId, kodeStruk, totalBelanja, 
    brandName, collectionName, collectionYear, items 
  }
  ↓
app/api/transaksi/route.ts (POST function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Validate input (createTransaksiSchema)
     - userId: integer
     - kodeStruk: min 3 karakter
     - totalBelanja: positive number
     - brandName, collectionName, items: optional
  ↓
  4. Check user exists
     SQL: SELECT * FROM users WHERE id = ?
  ↓
  5. Check kodeStruk unique
     SQL: SELECT * FROM transaksi_belanja WHERE kodeStruk = ?
  ↓
  6. Process transaksi (lib/voucher-service.ts)
     ↓
     6.1 Start database transaction (prisma.$transaction)
     ↓
     6.2 Get user data (untuk memberTier)
         SQL: SELECT nama, noHp, memberTier FROM users WHERE id = ?
     ↓
     6.3 Create transaksi record
         SQL: INSERT INTO transaksi_belanja 
              (userId, kodeStruk, totalBelanja, adminId, brandName, ...)
     ↓
     6.4 Evaluate rules (lib/voucher-service.ts → evaluateRules)
         ↓
         6.4.1 Get THE ONLY active rule
               SQL: SELECT * FROM rule_vouchers 
                    WHERE aktif = true 
                    AND tanggalMulai <= NOW()
                    AND (tanggalSelesai IS NULL OR tanggalSelesai >= NOW())
                    LIMIT 1
         ↓
         6.4.2 Evaluate rule berdasarkan tipe:
         
               MINIMAL_BELANJA:
               - if (totalBelanja >= nilaiMinimal) → dapat voucher
               
               KELIPATAN:
               - kelipatan = floor(totalBelanja / kelipatanDari)
               - jumlahVoucher = kelipatan * jumlahVoucher
               
               EVENT_KHUSUS:
               - Check event aktif
               - if (totalBelanja >= nilaiMinimal) 
                 → dapat voucher + bonus event
               
               BRAND_SPECIFIC:
               - if (brandName match && totalBelanja >= nilaiMinimal)
                 → dapat voucher
               
               HIGH_VALUE_PURCHASE:
               - if (totalBelanja >= nilaiMinimal)
                 → dapat multiple vouchers
               
               NEW_COLLECTION:
               - if (collectionName match && collectionYear match)
                 → dapat voucher
               
               MEMBER_EXCLUSIVE:
               - if (userMemberTier match && totalBelanja >= nilaiMinimal)
                 → dapat voucher
               
               TIME_BASED:
               - Check hari khusus (WEEKEND, MONDAY, dll)
               - Check jam khusus (22:00-02:00 untuk midnight sale)
               - if match → dapat voucher
               
               BUNDLING:
               - Parse items JSON
               - Check if all required items purchased
               - if match → dapat voucher
         ↓
         6.4.3 Return vouchers to generate
               [{ ruleId, jumlah, masaBerlakuHari, namaRule }]
     ↓
     6.5 Generate vouchers (loop)
         For each voucher to generate:
         ↓
         6.5.1 Generate unique voucher code
               - Format: VCH-YYYYMMDD-XXXXX
               - lib/voucher-generator.ts → generateVoucherCode()
         ↓
         6.5.2 Generate nomor undian (optional)
               - Format: 5 digit random
         ↓
         6.5.3 Calculate expiry date
               - tanggalKadaluarsa = NOW() + masaBerlakuHari
         ↓
         6.5.4 Create voucher
               SQL: INSERT INTO vouchers 
                    (userId, transaksiId, ruleId, kodeVoucher, 
                     nomorUndian, tanggalKadaluarsa, status)
         ↓
         6.5.5 Create log
               SQL: INSERT INTO log_vouchers 
                    (voucherId, aksi, adminId, keterangan)
     ↓
     6.6 Commit transaction
     ↓
     6.7 Return result
  ↓
  7. Format response
     - transaksi info
     - vouchers generated
     - summary (total voucher, rules applied)
  ↓
Client
```

**Request Example (Simple)**:
```json
POST /api/transaksi
Authorization: Bearer <token>
{
  "userId": 1,
  "kodeStruk": "STR-20250930-001",
  "totalBelanja": 250000
}
```

**Request Example (With Brand)**:
```json
POST /api/transaksi
Authorization: Bearer <token>
{
  "userId": 1,
  "kodeStruk": "STR-20250930-002",
  "totalBelanja": 2500000,
  "brandName": "Seiko"
}
```

**Request Example (Bundling)**:
```json
POST /api/transaksi
Authorization: Bearer <token>
{
  "userId": 1,
  "kodeStruk": "STR-20250930-003",
  "totalBelanja": 1500000,
  "items": "[\"jam_seiko\", \"tali_kulit\", \"kotak_jam\"]"
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Transaksi berhasil dibuat",
  "data": {
    "transaksi": {
      "id": 1,
      "kodeStruk": "STR-20250930-001",
      "totalBelanja": 250000,
      "tanggalTransaksi": "2025-09-30T07:00:00.000Z",
      "user": {
        "nama": "Budi Santoso",
        "noHp": "081234567890"
      }
    },
    "vouchersGenerated": [
      {
        "kodeVoucher": "VCH-20250930-ABC12",
        "tanggalKadaluarsa": "2025-11-29T07:00:00.000Z",
        "status": "AKTIF",
        "nomorUndian": "12345"
      },
      {
        "kodeVoucher": "VCH-20250930-DEF34",
        "tanggalKadaluarsa": "2025-11-29T07:00:00.000Z",
        "status": "AKTIF",
        "nomorUndian": "67890"
      }
    ],
    "summary": {
      "totalVoucher": 2,
      "rules": ["Kelipatan 100rb"]
    }
  }
}
```

**Console Log Debug**:
```
🔢 KELIPATAN DEBUG: {
  totalBelanja: 250000,
  kelipatanDari: 100000,
  kelipatan: 2,
  jumlahVoucherPerKelipatan: 1,
  totalVoucher: 2
}
```

---

### 5.2 GET /api/transaksi

**Fungsi**: Get list transaksi dengan pagination

**Alur Lengkap**:

```
Client
  ↓
  GET /api/transaksi?page=1&limit=10
  ↓
app/api/transaksi/route.ts (GET function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Validate pagination
  ↓
  4. Query transaksi dengan include user & vouchers
     SQL: SELECT t.*, u.nama, u.noHp, 
               (SELECT COUNT(*) FROM vouchers WHERE transaksiId = t.id) as voucherCount
          FROM transaksi_belanja t
          JOIN users u ON t.userId = u.id
          ORDER BY t.tanggalTransaksi DESC
  ↓
  5. Return transaksi dengan pagination
  ↓
Client
```

---

### 5.3 GET /api/transaksi/[id]

**Fungsi**: Get detail transaksi by ID

**Alur Lengkap**:

```
Client
  ↓
  GET /api/transaksi/1
  ↓
app/api/transaksi/[id]/route.ts (GET function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Get transaksi by ID dengan include:
     - user (nama, noHp)
     - admin (username)
     - voucher (all vouchers generated)
     SQL: SELECT t.*, u.*, a.username, v.*
          FROM transaksi_belanja t
          JOIN users u ON t.userId = u.id
          JOIN admins a ON t.adminId = a.id
          LEFT JOIN vouchers v ON t.id = v.transaksiId
          WHERE t.id = 1
  ↓
  4. If not found → 404
  ↓
  5. Return detail transaksi
  ↓
Client
```

---

## 6. Voucher Management APIs

### 6.1 GET /api/vouchers

**Fungsi**: Get list vouchers dengan filter

**Alur Lengkap**:

```
Client
  ↓
  GET /api/vouchers?page=1&limit=10&status=AKTIF
  ↓
app/api/vouchers/route.ts (GET function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Parse query params:
     - page, limit (pagination)
     - status (AKTIF, TERPAKAI, KADALUARSA, DIBATALKAN)
     - userId (filter by user)
  ↓
  4. Build where clause
     where: {
       status: status || undefined,
       userId: userId || undefined
     }
  ↓
  5. Query vouchers dengan include user & rule
     SQL: SELECT v.*, u.nama, u.noHp, r.namaRule
          FROM vouchers v
          JOIN users u ON v.userId = u.id
          JOIN rule_vouchers r ON v.ruleId = r.id
          WHERE v.status = 'AKTIF'
          ORDER BY v.createdAt DESC
  ↓
  6. Return vouchers dengan pagination
  ↓
Client
```

---

### 6.2 POST /api/vouchers/validate

**Fungsi**: Validate voucher (cek apakah voucher valid)

**Alur Lengkap**:

```
Client
  ↓
  POST /api/vouchers/validate
  Body: { kodeVoucher }
  ↓
app/api/vouchers/validate/route.ts (POST function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Validate input (validateVoucherSchema)
  ↓
  4. Find voucher by kodeVoucher
     SQL: SELECT v.*, u.nama, u.noHp
          FROM vouchers v
          JOIN users u ON v.userId = u.id
          WHERE v.kodeVoucher = ?
  ↓
  5. Check validasi:
     ✅ Voucher exists
     ✅ Status = AKTIF
     ✅ tanggalKadaluarsa >= NOW()
  ↓
  6. Return validation result
     - valid: true/false
     - message: alasan jika tidak valid
     - voucher: data voucher (jika valid)
  ↓
Client
```

**Request Example**:
```json
POST /api/vouchers/validate
Authorization: Bearer <token>
{
  "kodeVoucher": "VCH-20250930-ABC12"
}
```

**Response Example (Valid)**:
```json
{
  "success": true,
  "message": "Voucher valid",
  "data": {
    "valid": true,
    "voucher": {
      "id": 1,
      "kodeVoucher": "VCH-20250930-ABC12",
      "status": "AKTIF",
      "tanggalKadaluarsa": "2025-11-29T07:00:00.000Z",
      "user": {
        "nama": "Budi Santoso",
        "noHp": "081234567890"
      }
    }
  }
}
```

**Response Example (Invalid - Expired)**:
```json
{
  "success": true,
  "message": "Voucher tidak valid",
  "data": {
    "valid": false,
    "message": "Voucher sudah kadaluarsa"
  }
}
```

---

### 6.3 POST /api/vouchers/use

**Fungsi**: Use voucher (gunakan voucher untuk transaksi)

**Alur Lengkap**:

```
Client
  ↓
  POST /api/vouchers/use
  Body: { kodeVoucher, transaksiBelanjaId }
  ↓
app/api/vouchers/use/route.ts (POST function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Validate input (useVoucherSchema)
  ↓
  4. Start database transaction
  ↓
  5. Find voucher
     SQL: SELECT * FROM vouchers WHERE kodeVoucher = ?
  ↓
  6. Validate voucher:
     - exists
     - status = AKTIF
     - not expired
  ↓
  7. Check transaksi exists
     SQL: SELECT * FROM transaksi_belanja WHERE id = ?
  ↓
  8. Update voucher
     SQL: UPDATE vouchers 
          SET status = 'TERPAKAI',
              tanggalDigunakan = NOW(),
              transaksiDigunakanId = ?
          WHERE id = ?
  ↓
  9. Create log
     SQL: INSERT INTO log_vouchers 
          (voucherId, aksi, adminId, keterangan)
          VALUES (?, 'DIGUNAKAN', ?, ?)
  ↓
  10. Commit transaction
  ↓
  11. Return success
  ↓
Client
```

**Request Example**:
```json
POST /api/vouchers/use
Authorization: Bearer <token>
{
  "kodeVoucher": "VCH-20250930-ABC12",
  "transaksiBelanjaId": 2
}
```

**Response Example**:
```json
{
  "success": true,
  "message": "Voucher berhasil digunakan",
  "data": {
    "voucher": {
      "id": 1,
      "kodeVoucher": "VCH-20250930-ABC12",
      "status": "TERPAKAI",
      "tanggalDigunakan": "2025-09-30T08:00:00.000Z"
    }
  }
}
```

---

### 6.4 POST /api/vouchers/[id]/cancel

**Fungsi**: Cancel voucher (batalkan voucher)

**Alur Lengkap**:

```
Client
  ↓
  POST /api/vouchers/1/cancel
  Body: { keterangan }
  ↓
app/api/vouchers/[id]/cancel/route.ts (POST function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN only)
  ↓
  3. Validate input (cancelVoucherSchema)
  ↓
  4. Find voucher
     SQL: SELECT * FROM vouchers WHERE id = 1
  ↓
  5. Check voucher can be cancelled:
     - status = AKTIF (belum digunakan)
  ↓
  6. Update voucher
     SQL: UPDATE vouchers 
          SET status = 'DIBATALKAN'
          WHERE id = 1
  ↓
  7. Create log
     SQL: INSERT INTO log_vouchers 
          (voucherId, aksi, adminId, keterangan)
          VALUES (1, 'DIBATALKAN', ?, ?)
  ↓
  8. Return success
  ↓
Client
```

---

### 6.5 GET /api/vouchers/[id]

**Fungsi**: Get detail voucher by ID

**Alur Lengkap**:

```
Client
  ↓
  GET /api/vouchers/1
  ↓
app/api/vouchers/[id]/route.ts (GET function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Get voucher by ID dengan include:
     - user (nama, noHp)
     - transaksi (kodeStruk, totalBelanja)
     - rule (namaRule, tipeRule)
     - logVoucher (history)
     SQL: SELECT v.*, u.*, t.*, r.*, l.*
          FROM vouchers v
          JOIN users u ON v.userId = u.id
          JOIN transaksi_belanja t ON v.transaksiId = t.id
          JOIN rule_vouchers r ON v.ruleId = r.id
          LEFT JOIN log_vouchers l ON v.id = l.voucherId
          WHERE v.id = 1
  ↓
  4. If not found → 404
  ↓
  5. Return detail voucher
  ↓
Client
```

---

### 6.6 GET /api/vouchers/user/[userId]

**Fungsi**: Get vouchers by user ID

**Alur Lengkap**:

```
Client
  ↓
  GET /api/vouchers/user/1?status=AKTIF
  ↓
app/api/vouchers/user/[userId]/route.ts (GET function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN, KASIR)
  ↓
  3. Check user exists
  ↓
  4. Query vouchers by userId
     SQL: SELECT v.*, r.namaRule
          FROM vouchers v
          JOIN rule_vouchers r ON v.ruleId = r.id
          WHERE v.userId = 1
          AND v.status = 'AKTIF'
          ORDER BY v.createdAt DESC
  ↓
  5. Return vouchers
  ↓
Client
```

---

## 7. Cron Job APIs

### 7.1 POST /api/cron/expire-vouchers

**Fungsi**: Expire vouchers yang sudah kadaluarsa (run daily)

**Alur Lengkap**:

```
Cron Job / Manual Trigger
  ↓
  POST /api/cron/expire-vouchers
  Header: X-Cron-Secret: <secret>
  ↓
app/api/cron/expire-vouchers/route.ts (POST function)
  ↓
  1. Verify cron secret
     - Check X-Cron-Secret header
     - Compare dengan process.env.CRON_SECRET
  ↓
  2. Find expired vouchers
     SQL: SELECT * FROM vouchers 
          WHERE status = 'AKTIF'
          AND tanggalKadaluarsa < NOW()
  ↓
  3. Update vouchers to KADALUARSA
     SQL: UPDATE vouchers 
          SET status = 'KADALUARSA'
          WHERE id IN (...)
  ↓
  4. Create logs for each voucher
     SQL: INSERT INTO log_vouchers 
          (voucherId, aksi, keterangan)
          VALUES (?, 'KADALUARSA', 'Auto-expired by cron')
  ↓
  5. Return summary
     - totalExpired: jumlah voucher yang di-expire
  ↓
Response
```

**Request Example**:
```
POST /api/cron/expire-vouchers
X-Cron-Secret: your_secret_key
```

**Response Example**:
```json
{
  "success": true,
  "message": "Vouchers expired successfully",
  "data": {
    "totalExpired": 15
  }
}
```

**Setup Cron Job (Vercel)**:
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/expire-vouchers",
    "schedule": "0 0 * * *"
  }]
}
```

---

### 7.2 POST /api/cron/notify-expiring

**Fungsi**: Notify vouchers yang akan expire dalam 3 hari

**Alur Lengkap**:

```
Cron Job / Manual Trigger
  ↓
  POST /api/cron/notify-expiring
  Header: X-Cron-Secret: <secret>
  ↓
app/api/cron/notify-expiring/route.ts (POST function)
  ↓
  1. Verify cron secret
  ↓
  2. Find vouchers expiring in 3 days
     SQL: SELECT v.*, u.nama, u.noHp
          FROM vouchers v
          JOIN users u ON v.userId = u.id
          WHERE v.status = 'AKTIF'
          AND v.tanggalKadaluarsa BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
  ↓
  3. For each voucher:
     - Send notification (SMS/Email/WhatsApp)
     - Log notification sent
  ↓
  4. Return summary
     - totalNotified: jumlah notifikasi yang dikirim
  ↓
Response
```

---

## 8. Reporting & Analytics APIs

### 8.1 GET /api/reports/vouchers

**Fungsi**: Get voucher summary report

**Alur Lengkap**:

```
Client
  ↓
  GET /api/reports/vouchers?startDate=2025-01-01&endDate=2025-12-31
  ↓
app/api/reports/vouchers/route.ts (GET function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN)
  ↓
  3. Validate date range (dateRangeSchema)
  ↓
  4. Query voucher statistics:
  
     4.1 Total vouchers by status
         SQL: SELECT status, COUNT(*) as count
              FROM vouchers
              WHERE createdAt BETWEEN ? AND ?
              GROUP BY status
     
     4.2 Total vouchers by rule
         SQL: SELECT r.namaRule, COUNT(v.id) as count
              FROM vouchers v
              JOIN rule_vouchers r ON v.ruleId = r.id
              WHERE v.createdAt BETWEEN ? AND ?
              GROUP BY r.id
     
     4.3 Usage rate
         totalDibuat = COUNT(*)
         totalDigunakan = COUNT(*) WHERE status = 'TERPAKAI'
         tingkatPenggunaan = (totalDigunakan / totalDibuat) * 100
  ↓
  5. Format report
  ↓
Client
```

**Response Example**:
```json
{
  "success": true,
  "message": "Voucher report berhasil diambil",
  "data": {
    "totalDibuat": 150,
    "totalDigunakan": 75,
    "totalKadaluarsa": 20,
    "totalAktif": 55,
    "tingkatPenggunaan": 50,
    "voucherByRule": [
      { "namaRule": "Kelipatan 100rb", "jumlah": 80 },
      { "namaRule": "Promo Seiko", "jumlah": 70 }
    ],
    "voucherByStatus": [
      { "status": "AKTIF", "jumlah": 55 },
      { "status": "TERPAKAI", "jumlah": 75 },
      { "status": "KADALUARSA", "jumlah": 20 }
    ]
  }
}
```

---

### 8.2 GET /api/reports/transaksi

**Fungsi**: Get transaction summary report

**Alur Lengkap**:

```
Client
  ↓
  GET /api/reports/transaksi?startDate=2025-01-01&endDate=2025-12-31
  ↓
app/api/reports/transaksi/route.ts (GET function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN)
  ↓
  3. Validate date range
  ↓
  4. Query transaction statistics:
  
     4.1 Total transactions & revenue
         SQL: SELECT 
                COUNT(*) as totalTransaksi,
                SUM(totalBelanja) as totalBelanja,
                AVG(totalBelanja) as avgBelanja
              FROM transaksi_belanja
              WHERE tanggalTransaksi BETWEEN ? AND ?
     
     4.2 Transactions per day
         SQL: SELECT 
                DATE(tanggalTransaksi) as tanggal,
                COUNT(*) as jumlah,
                SUM(totalBelanja) as total
              FROM transaksi_belanja
              WHERE tanggalTransaksi BETWEEN ? AND ?
              GROUP BY DATE(tanggalTransaksi)
              ORDER BY tanggal ASC
  ↓
  5. Format report
  ↓
Client
```

**Response Example**:
```json
{
  "success": true,
  "message": "Transaction report berhasil diambil",
  "data": {
    "totalTransaksi": 250,
    "totalBelanja": 125000000,
    "avgBelanja": 500000,
    "transaksiPerHari": [
      {
        "tanggal": "2025-01-01",
        "jumlah": 15,
        "total": 7500000
      },
      {
        "tanggal": "2025-01-02",
        "jumlah": 20,
        "total": 10000000
      }
    ]
  }
}
```

---

### 8.3 GET /api/reports/leaderboard

**Fungsi**: Get user leaderboard (top spenders)

**Alur Lengkap**:

```
Client
  ↓
  GET /api/reports/leaderboard?limit=10
  ↓
app/api/reports/leaderboard/route.ts (GET function)
  ↓
  1. Authentication
  ↓
  2. Authorization (SUPER_ADMIN, ADMIN)
  ↓
  3. Query top users:
     SQL: SELECT 
            u.id, u.nama, u.noHp, u.memberTier,
            COUNT(t.id) as totalTransaksi,
            SUM(t.totalBelanja) as totalBelanja,
            COUNT(v.id) as totalVoucher
          FROM users u
          LEFT JOIN transaksi_belanja t ON u.id = t.userId
          LEFT JOIN vouchers v ON u.id = v.userId
          GROUP BY u.id
          ORDER BY totalBelanja DESC
          LIMIT 10
  ↓
  4. Return leaderboard
  ↓
Client
```

**Response Example**:
```json
{
  "success": true,
  "message": "Leaderboard berhasil diambil",
  "data": {
    "leaderboard": [
      {
        "userId": 1,
        "nama": "Budi Santoso",
        "noHp": "081234567890",
        "memberTier": "VIP",
        "totalBelanja": 15000000,
        "totalTransaksi": 30,
        "totalVoucher": 60
      },
      {
        "userId": 2,
        "nama": "Ani Wijaya",
        "noHp": "081234567891",
        "memberTier": "GOLD",
        "totalBelanja": 12000000,
        "totalTransaksi": 25,
        "totalVoucher": 50
      }
    ]
  }
}
```

---

## 📊 Summary - Total API Endpoints

| Category | Endpoints | Auth Required |
|----------|-----------|---------------|
| Authentication | 3 | Partial |
| User Management | 4 | Yes |
| Event Management | 4 | Yes |
| Rule Management | 4 | Yes |
| Transaction & Voucher | 3 | Yes |
| Voucher Management | 6 | Yes |
| Cron Jobs | 2 | Secret Key |
| Reporting | 3 | Yes |
| **TOTAL** | **29** | - |

---

## 🔐 Authentication & Authorization Summary

### Roles:
1. **SUPER_ADMIN** - Full access
2. **ADMIN** - Most operations (no delete)
3. **KASIR** - Read + Create transactions

### Authorization Matrix:

| Endpoint | SUPER_ADMIN | ADMIN | KASIR |
|----------|-------------|-------|-------|
| POST /api/auth/login | ✅ | ✅ | ✅ |
| POST /api/auth/register | ✅ | ❌ | ❌ |
| GET /api/users | ✅ | ✅ | ✅ |
| POST /api/users | ✅ | ✅ | ✅ |
| PATCH /api/users/[id] | ✅ | ✅ | ❌ |
| POST /api/events | ✅ | ✅ | ❌ |
| DELETE /api/events/[id] | ✅ | ❌ | ❌ |
| POST /api/rules | ✅ | ✅ | ❌ |
| DELETE /api/rules/[id] | ✅ | ❌ | ❌ |
| POST /api/transaksi | ✅ | ✅ | ✅ |
| POST /api/vouchers/use | ✅ | ✅ | ✅ |
| POST /api/vouchers/[id]/cancel | ✅ | ✅ | ❌ |
| GET /api/reports/* | ✅ | ✅ | ❌ |

---

## 🎯 Key Takeaways

### 1. **Modular Architecture**
- Setiap layer punya tanggung jawab sendiri
- Middleware untuk auth & authorization
- Helper functions untuk reusable code

### 2. **Security First**
- JWT authentication di semua endpoint
- Role-based authorization
- Input validation dengan Zod
- Password hashing dengan bcrypt

### 3. **Database Transactions**
- Atomic operations untuk consistency
- Rollback jika ada error
- Cascade delete untuk data integrity

### 4. **Error Handling**
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages

### 5. **Business Logic**
- Rule evaluation engine
- Auto-generate vouchers
- Flexible rule types (9 types)
- Only 1 active rule at a time

---

## 📚 File Structure Reference

```
c:/coba4/
├── app/api/
│   ├── auth/
│   │   ├── login/route.ts
│   │   ├── register/route.ts
│   │   └── me/route.ts
│   ├── users/
│   │   ├── route.ts (GET, POST)
│   │   └── [id]/route.ts (GET, PATCH)
│   ├── events/
│   │   ├── route.ts (GET, POST)
│   │   └── [id]/route.ts (GET, PATCH, DELETE)
│   ├── rules/
│   │   ├── route.ts (GET, POST)
│   │   └── [id]/route.ts (GET, PATCH, DELETE)
│   ├── transaksi/
│   │   ├── route.ts (GET, POST)
│   │   └── [id]/route.ts (GET)
│   ├── vouchers/
│   │   ├── route.ts (GET)
│   │   ├── validate/route.ts (POST)
│   │   ├── use/route.ts (POST)
│   │   ├── [id]/
│   │   │   ├── route.ts (GET)
│   │   │   └── cancel/route.ts (POST)
│   │   └── user/[userId]/route.ts (GET)
│   ├── cron/
│   │   ├── expire-vouchers/route.ts (POST)
│   │   └── notify-expiring/route.ts (POST)
│   └── reports/
│       ├── vouchers/route.ts (GET)
│       ├── transaksi/route.ts (GET)
│       └── leaderboard/route.ts (GET)
├── middleware/
│   ├── auth.ts
│   ├── authorize.ts
│   └── errorHandler.ts
├── lib/
│   ├── prisma.ts
│   ├── response.ts
│   ├── validations.ts
│   ├── voucher-service.ts ⭐
│   ├── voucher-generator.ts
│   ├── calculator.ts
│   └── date-utils.ts
└── types/
    └── index.ts
```

---

**END OF DOCUMENTATION**

Untuk detail lebih lanjut setiap endpoint, lihat:
- `TUTORIAL.txt` - Detail alur GET /api/users
- `README.md` - API documentation
- `TESTING_GUIDE.md` - Testing scenarios
- `BUSINESS_LOGIC.md` - Business rules explanation
