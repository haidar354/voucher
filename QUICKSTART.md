# 🚀 Quick Start Guide

Get your Voucher Management System up and running in 5 minutes!

## ⚡ Prerequisites

- Node.js 18+ installed
- MySQL (MAMP, XAMPP, atau MySQL standalone) installed and running
- Git (optional)

> **🔥 Menggunakan MAMP MySQL?** Ikuti panduan lengkap di **`SETUP_MAMP_MYSQL.md`**

## 📦 Step 1: Install Dependencies

```bash
cd coba4
npm install
```

## 🗄️ Step 2: Setup Database

### Create MySQL Database (MAMP)

```bash
# 1. Start MAMP
# 2. Buka phpMyAdmin: http://localhost:8888/phpMyAdmin/
# 3. Login: username=root, password=root
# 4. Buat database baru: voucher_db
```

### Configure Environment

```bash
# Copy .env.example to .env
copy .env.example .env

# Edit .env file and update DATABASE_URL
# Untuk MAMP (port 8889):
# DATABASE_URL="mysql://root:root@localhost:8889/voucher_db"

# Untuk MySQL standalone (port 3306):
# DATABASE_URL="mysql://root:password@localhost:3306/voucher_db"
```

## 🔧 Step 3: Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed
```

**Expected Output:**
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

## 🎯 Step 4: Start Development Server

```bash
npm run dev
```

Server will start at: **http://localhost:3000**

## 🔐 Step 5: Test API

### Login to Get Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

**Copy the token from response!**

### Create a Test Transaction

```bash
# Replace YOUR_TOKEN and USER_ID
curl -X POST http://localhost:3000/api/transaksi \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"userId\":\"USER_ID\",\"kodeStruk\":\"TEST-001\",\"totalBelanja\":250000}"
```

**You should see vouchers generated automatically! 🎉**

## 📚 What's Next?

1. **Read Full Documentation**: Check `README.md` for complete API reference
2. **Follow Testing Guide**: See `TESTING_GUIDE.md` for detailed test scenarios
3. **Understand Business Logic**: Read `BUSINESS_LOGIC.md` for rule evaluation details
4. **Explore Database**: Run `npm run db:studio` to open Prisma Studio

## 🎓 Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | SUPER_ADMIN |
| kasir | admin123 | KASIR |

## 🛠️ Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to DB
npm run db:migrate       # Create migration
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio GUI

# Linting
npm run lint             # Run ESLint
```

## 🎯 Quick Test Scenarios

### Scenario 1: Minimal Belanja (75k → 1 voucher)
```json
{
  "userId": "USER_ID",
  "kodeStruk": "TEST-001",
  "totalBelanja": 75000
}
```

### Scenario 2: Kelipatan (250k → 3 vouchers)
```json
{
  "userId": "USER_ID",
  "kodeStruk": "TEST-002",
  "totalBelanja": 250000
}
```

### Scenario 3: Premium (550k → 5 vouchers)
```json
{
  "userId": "USER_ID",
  "kodeStruk": "TEST-003",
  "totalBelanja": 550000
}
```

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
# Windows:
services.msc
# Look for "postgresql" service

# Verify connection
psql -U postgres -d voucher_db
```

### Port Already in Use
```bash
# Change port in package.json or kill process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Prisma Client Not Generated
```bash
npm run db:generate
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## 📞 Need Help?

- 📖 Full Documentation: `README.md`
- 🧪 Testing Guide: `TESTING_GUIDE.md`
- 💡 Business Logic: `BUSINESS_LOGIC.md`
- 🐛 Issues: Check console logs and database

## ✅ Checklist

- [ ] Node.js installed
- [ ] PostgreSQL installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Database schema pushed (`npm run db:push`)
- [ ] Database seeded (`npm run db:seed`)
- [ ] Dev server running (`npm run dev`)
- [ ] Login successful (got JWT token)
- [ ] Test transaction created
- [ ] Vouchers generated automatically

**Congratulations! Your Voucher Management System is ready! 🎉**
