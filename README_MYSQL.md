# 🎯 Voucher Management System - MySQL Version

## ✅ Sistem Sudah Dikonfigurasi untuk MySQL (MAMP)

Sistem ini telah disesuaikan untuk menggunakan **MySQL** sebagai database, compatible dengan **MAMP**, **XAMPP**, atau MySQL standalone.

---

## 🚀 Quick Start (MAMP MySQL)

### 1. Start MAMP
- Buka aplikasi MAMP
- Klik tombol **"Start"**
- Pastikan MySQL running (lampu hijau)

### 2. Buat Database
- Buka: http://localhost:8888/phpMyAdmin/
- Login: `root` / `root`
- Buat database baru: **`voucher_db`**

### 3. Install & Setup
```bash
# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Edit .env file:
# DATABASE_URL="mysql://root:root@localhost:8889/voucher_db"

# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

### 4. Test API
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

**🎉 Done! Server running at http://localhost:3000**

---

## 📚 Documentation

### Setup Guides:
1. **SETUP_MAMP_MYSQL.md** ⭐ - Panduan lengkap setup MAMP
2. **QUICKSTART.md** - Quick start guide (5 menit)
3. **START_HERE.md** - Welcome guide

### Complete Documentation:
4. **README.md** - Complete API documentation
5. **TESTING_GUIDE.md** - Testing scenarios
6. **BUSINESS_LOGIC.md** - Business logic explanation
7. **PROJECT_SUMMARY.md** - Project overview

### Technical Notes:
8. **MYSQL_MIGRATION_NOTES.md** - Migration details

---

## 🔧 Configuration

### Database Connection (MAMP)

**File: `.env`**
```env
# MAMP MySQL (Mac - port 8889)
DATABASE_URL="mysql://root:root@localhost:8889/voucher_db"

# MAMP MySQL (Windows - port 3306)
DATABASE_URL="mysql://root:root@localhost:3306/voucher_db"

# MySQL Standalone
DATABASE_URL="mysql://username:password@localhost:3306/voucher_db"
```

### Prisma Schema

**File: `prisma/schema.prisma`**
```prisma
datasource db {
  provider = "mysql"  // ✅ Already configured
  url      = env("DATABASE_URL")
}
```

---

## ✅ What's Included

### API Endpoints (27 total)
- ✅ Authentication (3 endpoints)
- ✅ User Management (3 endpoints)
- ✅ Event Management (4 endpoints)
- ✅ Rule Management (4 endpoints)
- ✅ Transaction & Voucher Generation (3 endpoints) ⭐
- ✅ Voucher Management (6 endpoints)
- ✅ Cron Jobs (2 endpoints)
- ✅ Reports & Analytics (3 endpoints)

### Database Models (8 total)
- ✅ User (Customers)
- ✅ Admin (3 roles: SUPER_ADMIN, ADMIN, KASIR)
- ✅ Event (Promo events)
- ✅ RuleVoucher (3 types: MINIMAL_BELANJA, KELIPATAN, EVENT_KHUSUS)
- ✅ TransaksiBelanja (Transactions)
- ✅ Voucher (Generated vouchers)
- ✅ LogVoucher (Audit trail)
- ✅ Enums (4 types)

### Features
- ✅ Auto-generate vouchers based on rules
- ✅ 3 rule types with flexible configuration
- ✅ Priority & accumulation logic
- ✅ Event-based bonus vouchers
- ✅ Unique voucher codes & lottery numbers
- ✅ Complete audit trail
- ✅ Reporting & analytics
- ✅ Role-based access control
- ✅ Production-ready security

---

## 🎯 Default Credentials

After running `npm run db:seed`:

| Username | Password | Role | Access |
|----------|----------|------|--------|
| admin | admin123 | SUPER_ADMIN | Full access |
| kasir | admin123 | KASIR | Limited access |

**⚠️ Change these in production!**

---

## 🐛 Troubleshooting

### Can't connect to database?
```bash
# Check if MAMP MySQL is running
# Check port in MAMP Preferences → Ports → MySQL Port
# Update DATABASE_URL in .env with correct port
```

### Database not found?
```bash
# Create database via phpMyAdmin
# http://localhost:8888/phpMyAdmin/
# Create database: voucher_db
```

### Wrong port?
```bash
# MAMP Mac default: 8889
# MAMP Windows default: 3306
# MySQL standalone: 3306
```

### Module not found?
```bash
npm install
npm run db:generate
```

---

## 📊 Verify Setup

### Check Database Tables (phpMyAdmin)
1. Open: http://localhost:8888/phpMyAdmin/
2. Select database: `voucher_db`
3. You should see 8 tables:
   - admins
   - users
   - events
   - rule_vouchers
   - transaksi_belanja
   - vouchers
   - log_vouchers
   - _prisma_migrations

### Test API
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"

# 2. Get users (use token from login)
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎓 Learning Path

### Day 1: Setup & Basic Understanding
1. ✅ Follow `SETUP_MAMP_MYSQL.md`
2. ✅ Run `npm run db:seed`
3. ✅ Test login endpoint
4. ✅ Explore database in phpMyAdmin

### Day 2: Testing
1. ✅ Follow `TESTING_GUIDE.md`
2. ✅ Test all scenarios
3. ✅ Understand rule evaluation

### Day 3: Deep Dive
1. ✅ Read `BUSINESS_LOGIC.md`
2. ✅ Read complete `README.md`
3. ✅ Review code structure

### Day 4: Customization
1. ✅ Customize rules for your business
2. ✅ Integrate with frontend
3. ✅ Deploy to production

---

## 🚀 Next Steps

1. **Setup**: Follow `SETUP_MAMP_MYSQL.md`
2. **Test**: Follow `TESTING_GUIDE.md`
3. **Learn**: Read `BUSINESS_LOGIC.md`
4. **Deploy**: Follow deployment guide in `README.md`

---

## 📞 Support

### Documentation
- 📘 Complete Setup: `SETUP_MAMP_MYSQL.md`
- ⚡ Quick Start: `QUICKSTART.md`
- 📖 Full API: `README.md`
- 🧪 Testing: `TESTING_GUIDE.md`
- 💡 Business Logic: `BUSINESS_LOGIC.md`

### Tools
- 🗄️ Database GUI: phpMyAdmin (http://localhost:8888/phpMyAdmin/)
- 🔍 Prisma Studio: `npm run db:studio`
- 📝 API Testing: Postman (import `Postman_Collection.json`)

---

## ✅ Checklist

Before starting:
- [ ] MAMP installed
- [ ] Node.js 18+ installed
- [ ] MAMP MySQL running

After setup:
- [ ] Database `voucher_db` created
- [ ] `.env` configured
- [ ] Dependencies installed
- [ ] Prisma Client generated
- [ ] Database schema pushed
- [ ] Sample data seeded
- [ ] Server running
- [ ] Login test successful

---

## 🎉 You're Ready!

Sistem Anda sudah dikonfigurasi untuk **MySQL (MAMP)** dan siap digunakan!

**Recommended Reading Order:**
1. ⭐ **SETUP_MAMP_MYSQL.md** (Complete setup guide)
2. ⚡ **QUICKSTART.md** (5 minutes)
3. 🧪 **TESTING_GUIDE.md** (30 minutes)
4. 💡 **BUSINESS_LOGIC.md** (1 hour)
5. 📖 **README.md** (reference)

**Happy Coding! 🚀**

---

*Built with ❤️ using Next.js 14, Prisma, MySQL, and TypeScript*
