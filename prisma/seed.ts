import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🗑️  Cleaning existing data...');
  await prisma.logVoucher.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.transaksiBelanja.deleteMany();
  await prisma.ruleVoucher.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();
  await prisma.admin.deleteMany();

  // Seed Admins
  console.log('👤 Creating admins...');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const superAdmin = await prisma.admin.create({
    data: {
      username: 'admin',
      password: hashedPassword,
      namaLengkap: 'Super Administrator',
      role: 'SUPER_ADMIN',
      aktif: true,
    },
  });

  const kasir = await prisma.admin.create({
    data: {
      username: 'kasir',
      password: hashedPassword,
      namaLengkap: 'Kasir Toko',
      role: 'KASIR',
      aktif: true,
    },
  });

  console.log(`✅ Created ${2} admins`);

  // Seed Users
  console.log('👥 Creating users...');
  const users = await Promise.all([
    prisma.user.create({
      data: {
        nama: 'Budi Santoso',
        email: 'budi@example.com',
        noHp: '081234567890',
        alamat: 'Jl. Merdeka No. 123, Jakarta',
      },
    }),
    prisma.user.create({
      data: {
        nama: 'Siti Nurhaliza',
        email: 'siti@example.com',
        noHp: '081234567891',
        alamat: 'Jl. Sudirman No. 456, Bandung',
      },
    }),
    prisma.user.create({
      data: {
        nama: 'Ahmad Rizki',
        email: 'ahmad@example.com',
        noHp: '081234567892',
        alamat: 'Jl. Gatot Subroto No. 789, Surabaya',
      },
    }),
    prisma.user.create({
      data: {
        nama: 'Dewi Lestari',
        noHp: '081234567893',
        alamat: 'Jl. Diponegoro No. 321, Yogyakarta',
      },
    }),
    prisma.user.create({
      data: {
        nama: 'Eko Prasetyo',
        email: 'eko@example.com',
        noHp: '081234567894',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Seed Events
  console.log('🎉 Creating events...');
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const event = await prisma.event.create({
    data: {
      namaEvent: 'Grand Opening Promo',
      deskripsi: 'Promo spesial grand opening dengan bonus voucher ekstra',
      tanggalMulai: today,
      tanggalSelesai: nextMonth,
      bonusVoucherKhusus: 2,
      aktif: true,
    },
  });

  console.log(`✅ Created ${1} event`);

  // Seed Rules
  console.log('📋 Creating voucher rules...');
  
  const rule1 = await prisma.ruleVoucher.create({
    data: {
      namaRule: 'Minimal Belanja 50rb',
      tipeRule: 'MINIMAL_BELANJA',
      nilaiMinimal: 50000,
      jumlahVoucher: 1,
      masaBerlakuHari: 30,
      prioritas: 2,
      akumulasiRule: true,
      aktif: true,
      tanggalMulai: today,
    },
  });

  const rule2 = await prisma.ruleVoucher.create({
    data: {
      namaRule: 'Kelipatan 100rb',
      tipeRule: 'KELIPATAN',
      nilaiMinimal: 100000,
      jumlahVoucher: 1,
      kelipatanDari: 100000,
      masaBerlakuHari: 60,
      prioritas: 1,
      akumulasiRule: true,
      aktif: true,
      tanggalMulai: today,
    },
  });

  const rule3 = await prisma.ruleVoucher.create({
    data: {
      namaRule: 'Event Grand Opening',
      tipeRule: 'EVENT_KHUSUS',
      nilaiMinimal: 200000,
      jumlahVoucher: 3,
      masaBerlakuHari: 90,
      prioritas: 1,
      akumulasiRule: false,
      eventId: event.id,
      aktif: true,
      tanggalMulai: today,
      tanggalSelesai: nextMonth,
    },
  });

  const rule4 = await prisma.ruleVoucher.create({
    data: {
      namaRule: 'Minimal Belanja 500rb (Premium)',
      tipeRule: 'MINIMAL_BELANJA',
      nilaiMinimal: 500000,
      jumlahVoucher: 5,
      masaBerlakuHari: 90,
      prioritas: 1,
      akumulasiRule: false,
      aktif: true,
      tanggalMulai: today,
    },
  });

  console.log(`✅ Created ${4} voucher rules`);

  // Seed Sample Transactions with Vouchers
  console.log('💳 Creating sample transactions...');
  
  // Transaction 1: Budi - 75,000 (gets 1 voucher from rule 50rb)
  const transaksi1 = await prisma.transaksiBelanja.create({
    data: {
      userId: users[0].id,
      kodeStruk: 'STR-20240930-001',
      totalBelanja: 75000,
      tanggalTransaksi: today,
      adminId: kasir.id,
      catatan: 'Pembelian jam tangan Casio',
    },
  });

  // Transaction 2: Siti - 250,000 (gets 2 vouchers from kelipatan 100rb)
  const transaksi2 = await prisma.transaksiBelanja.create({
    data: {
      userId: users[1].id,
      kodeStruk: 'STR-20240930-002',
      totalBelanja: 250000,
      tanggalTransaksi: today,
      adminId: kasir.id,
      catatan: 'Pembelian jam tangan Seiko',
    },
  });

  // Transaction 3: Ahmad - 550,000 (gets 5 vouchers from premium rule)
  const transaksi3 = await prisma.transaksiBelanja.create({
    data: {
      userId: users[2].id,
      kodeStruk: 'STR-20240930-003',
      totalBelanja: 550000,
      tanggalTransaksi: today,
      adminId: superAdmin.id,
      catatan: 'Pembelian jam tangan Citizen',
    },
  });

  console.log(`✅ Created ${3} transactions`);

  // Note: Vouchers would normally be generated automatically by the API
  // For seeding purposes, we'll create some sample vouchers manually
  console.log('🎟️  Creating sample vouchers...');

  const voucher1 = await prisma.voucher.create({
    data: {
      userId: users[0].id,
      transaksiId: transaksi1.id,
      ruleId: rule1.id,
      kodeVoucher: 'VCH-20240930-ABC12',
      nomorUndian: '1234-5678-9012',
      tanggalKadaluarsa: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
      status: 'AKTIF',
    },
  });

  await prisma.logVoucher.create({
    data: {
      voucherId: voucher1.id,
      aksi: 'DIBUAT',
      adminId: kasir.id,
      keterangan: 'Voucher dibuat dari transaksi STR-20240930-001',
    },
  });

  const voucher2 = await prisma.voucher.create({
    data: {
      userId: users[1].id,
      transaksiId: transaksi2.id,
      ruleId: rule2.id,
      kodeVoucher: 'VCH-20240930-DEF34',
      nomorUndian: '2345-6789-0123',
      tanggalKadaluarsa: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
      status: 'AKTIF',
    },
  });

  await prisma.logVoucher.create({
    data: {
      voucherId: voucher2.id,
      aksi: 'DIBUAT',
      adminId: kasir.id,
      keterangan: 'Voucher dibuat dari transaksi STR-20240930-002',
    },
  });

  const voucher3 = await prisma.voucher.create({
    data: {
      userId: users[1].id,
      transaksiId: transaksi2.id,
      ruleId: rule2.id,
      kodeVoucher: 'VCH-20240930-GHI56',
      nomorUndian: '3456-7890-1234',
      tanggalKadaluarsa: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000),
      status: 'AKTIF',
    },
  });

  await prisma.logVoucher.create({
    data: {
      voucherId: voucher3.id,
      aksi: 'DIBUAT',
      adminId: kasir.id,
      keterangan: 'Voucher dibuat dari transaksi STR-20240930-002',
    },
  });

  console.log(`✅ Created ${3} sample vouchers`);

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Admins: 2 (username: admin/kasir, password: admin123)`);
  console.log(`   - Users: ${users.length}`);
  console.log(`   - Events: 1`);
  console.log(`   - Rules: 4`);
  console.log(`   - Transactions: 3`);
  console.log(`   - Vouchers: 3`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
