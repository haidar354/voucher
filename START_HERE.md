# 🎯 START HERE - Voucher Management System

## 👋 Welcome!

Selamat datang di **Voucher Management System** - sistem backend lengkap untuk manajemen voucher toko jam tangan dengan auto-generation berdasarkan rule yang dapat dikonfigurasi.

---

## 🚀 Quick Setup (5 Minutes)

> **🔥 Menggunakan MAMP MySQL?** Baca panduan lengkap: **`SETUP_MAMP_MYSQL.md`**

### Option 1: Automatic Setup (Windows)

```bash
# Run setup script
SETUP.bat
```

### Option 2: Manual Setup (MAMP MySQL)

```bash
# 1. Start MAMP dan pastikan MySQL running

# 2. Buat database via phpMyAdmin
# http://localhost:8888/phpMyAdmin/
# Buat database: voucher_db

# 3. Install dependencies
npm install

# 4. Copy environment file
copy .env.example .env
# Edit .env: DATABASE_URL="mysql://root:root@localhost:8889/voucher_db"

# 5. Setup database
npm run db:generate
npm run db:push
npm run db:seed

# 6. Start server
npm run dev
```

**Server will run at**: http://localhost:3000

---

## 📚 Documentation Guide

### 1. **QUICKSTART.md** ⚡ (Start Here!)
- 5-minute setup guide
- First API test
- Default credentials
- Common commands

### 2. **README.md** 📖 (Complete Reference)
- All 27 API endpoints
- Request/response examples
- Database schema
- Deployment guide
- Full API documentation

### 3. **TESTING_GUIDE.md** 🧪 (Testing)
- Step-by-step testing scenarios
- cURL examples
- Expected results
- Edge cases

### 4. **BUSINESS_LOGIC.md** 💡 (Understanding)
- Rule evaluation algorithm
- Business logic deep dive
- Real-world examples
- Best practices
- FAQ

### 5. **PROJECT_SUMMARY.md** 📊 (Overview)
- Project structure
- Tech stack
- Features list
- Metrics & KPIs
- Future enhancements

---

## 🎯 What Can This System Do?

### Core Features

✅ **Auto-Generate Vouchers**
- Voucher otomatis dibuat saat transaksi
- Berdasarkan rule yang dapat dikonfigurasi
- 3 tipe rule: Minimal Belanja, Kelipatan, Event Khusus

✅ **Flexible Rule System**
- Prioritas rule
- Akumulasi atau non-akumulasi
- Event-based bonuses
- Masa berlaku customizable

✅ **Complete Management**
- User management
- Transaction tracking
- Voucher validation & redemption
- Event management
- Admin role-based access

✅ **Reporting & Analytics**
- Voucher usage statistics
- Transaction summaries
- Customer leaderboard
- Rule performance metrics

✅ **Automation**
- Auto-expire old vouchers
- Notification for expiring vouchers
- Audit trail for all actions

---

## 🔑 Default Login Credentials

After running `npm run db:seed`:

| Username | Password | Role | Access Level |
|----------|----------|------|--------------|
| admin | admin123 | SUPER_ADMIN | Full access |
| kasir | admin123 | KASIR | Limited access |

**⚠️ Change these in production!**

---

## 🎯 Quick Test

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

**Copy the token!**

### 2. Get Users
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Copy a user ID!**

### 3. Create Transaction (Auto-Generate Vouchers!)
```bash
curl -X POST http://localhost:3000/api/transaksi \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"userId\":\"USER_ID\",\"kodeStruk\":\"TEST-001\",\"totalBelanja\":250000}"
```

**🎉 You should see vouchers generated automatically!**

---

## 📊 System Architecture

```
┌─────────────┐
│   Client    │ (Postman, cURL, Frontend)
└──────┬──────┘
       │ HTTP/JSON
       ↓
┌─────────────────────────────────────┐
│       Next.js API Routes            │
│  ┌─────────────────────────────┐   │
│  │  Middleware Layer           │   │
│  │  - Authentication (JWT)     │   │
│  │  - Authorization (RBAC)     │   │
│  │  - Validation (Zod)         │   │
│  │  - Rate Limiting            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Business Logic Layer       │   │
│  │  - Rule Evaluation ⭐       │   │
│  │  - Voucher Generation       │   │
│  │  - Transaction Processing   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  Data Access Layer          │   │
│  │  - Prisma ORM               │   │
│  │  - Type-safe queries        │   │
│  └─────────────────────────────┘   │
└──────────────┬──────────────────────┘
               │
               ↓
       ┌──────────────┐
       │ PostgreSQL   │
       │   Database   │
       └──────────────┘
```

---

## 🎓 Learning Path

### For Developers

1. **Day 1**: Setup & Basic Understanding
   - Run SETUP.bat
   - Read QUICKSTART.md
   - Test login and basic endpoints
   - Explore database with `npm run db:studio`

2. **Day 2**: Deep Dive
   - Read BUSINESS_LOGIC.md
   - Understand rule evaluation
   - Test all scenarios in TESTING_GUIDE.md
   - Review code in `lib/voucher-service.ts`

3. **Day 3**: Advanced
   - Read complete README.md
   - Test all 27 endpoints
   - Understand database relations
   - Review middleware and utilities

4. **Day 4**: Customization
   - Modify rules for your business
   - Add custom endpoints
   - Integrate with frontend
   - Deploy to production

### For Business Users

1. **Understanding Rules**
   - Read BUSINESS_LOGIC.md sections 1-3
   - Understand 3 rule types
   - Learn about prioritas and akumulasi

2. **Testing Scenarios**
   - Follow TESTING_GUIDE.md
   - Test with different transaction amounts
   - Observe voucher generation

3. **Managing System**
   - Create events for promotions
   - Configure rules for campaigns
   - Monitor reports and analytics

---

## 🛠️ Useful Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:migrate       # Create migration (production)
npm run db:seed          # Seed initial data
npm run db:studio        # Open Prisma Studio GUI

# Maintenance
npm run lint             # Check code quality
```

---

## 📦 What's Included?

### API Endpoints (27 total)
- ✅ 3 Authentication endpoints
- ✅ 3 User management endpoints
- ✅ 4 Event management endpoints
- ✅ 4 Rule management endpoints
- ✅ 3 Transaction endpoints (core)
- ✅ 6 Voucher management endpoints
- ✅ 2 Cron job endpoints
- ✅ 3 Reporting endpoints

### Database Models (8 total)
- ✅ User (Pelanggan)
- ✅ Admin (3 roles)
- ✅ Event (Promo events)
- ✅ RuleVoucher (3 types)
- ✅ TransaksiBelanja
- ✅ Voucher
- ✅ LogVoucher (Audit trail)
- ✅ Enums (4 types)

### Documentation (6 files)
- ✅ START_HERE.md (this file)
- ✅ QUICKSTART.md
- ✅ README.md
- ✅ TESTING_GUIDE.md
- ✅ BUSINESS_LOGIC.md
- ✅ PROJECT_SUMMARY.md

### Code Quality
- ✅ TypeScript for type safety
- ✅ Zod for validation
- ✅ Prisma for database
- ✅ JWT for authentication
- ✅ Bcrypt for password hashing
- ✅ Error handling
- ✅ Rate limiting
- ✅ Audit logging

---

## 🎯 Next Steps

### Immediate (Today)
1. [ ] Run setup: `SETUP.bat` or manual setup
2. [ ] Read QUICKSTART.md
3. [ ] Test login endpoint
4. [ ] Create first transaction
5. [ ] See vouchers generated!

### Short Term (This Week)
1. [ ] Read complete README.md
2. [ ] Follow all scenarios in TESTING_GUIDE.md
3. [ ] Understand BUSINESS_LOGIC.md
4. [ ] Explore database with Prisma Studio
5. [ ] Customize rules for your business

### Long Term (This Month)
1. [ ] Integrate with frontend
2. [ ] Setup production environment
3. [ ] Configure cron jobs
4. [ ] Train team members
5. [ ] Launch to production!

---

## 🐛 Troubleshooting

### Can't connect to database?
- Check if PostgreSQL is running
- Verify DATABASE_URL in .env
- Test connection: `psql -U postgres -d voucher_db`

### Module not found errors?
- Run: `npm install`
- Run: `npm run db:generate`

### Port 3000 already in use?
- Kill process or change port in package.json

### Prisma errors?
- Run: `npm run db:generate`
- Run: `npm run db:push`

---

## 📞 Need Help?

### Documentation
- 📖 Complete API: `README.md`
- ⚡ Quick Start: `QUICKSTART.md`
- 🧪 Testing: `TESTING_GUIDE.md`
- 💡 Business Logic: `BUSINESS_LOGIC.md`
- 📊 Overview: `PROJECT_SUMMARY.md`

### Tools
- 🗄️ Database GUI: `npm run db:studio`
- 🔍 API Testing: Postman, Insomnia, cURL
- 📝 Logs: Check terminal console

---

## ✅ Pre-Flight Checklist

Before starting:
- [ ] Node.js 18+ installed
- [ ] PostgreSQL 14+ installed and running
- [ ] Git installed (optional)
- [ ] API testing tool ready (Postman/cURL)
- [ ] Text editor ready (VS Code recommended)

After setup:
- [ ] Dependencies installed
- [ ] .env file configured
- [ ] Database schema pushed
- [ ] Database seeded
- [ ] Server running
- [ ] Login successful
- [ ] First transaction created
- [ ] Vouchers generated

---

## 🎉 You're Ready!

Sistem Anda sudah siap digunakan! 

**Recommended Reading Order:**
1. ✅ START_HERE.md (you are here!)
2. ⚡ QUICKSTART.md (5 minutes)
3. 🧪 TESTING_GUIDE.md (30 minutes)
4. 💡 BUSINESS_LOGIC.md (1 hour)
5. 📖 README.md (reference)

**Happy Coding! 🚀**

---

*Built with ❤️ using Next.js 14, Prisma, PostgreSQL, and TypeScript*
