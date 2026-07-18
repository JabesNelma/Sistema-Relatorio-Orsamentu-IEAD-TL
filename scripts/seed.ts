import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth'

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Create default Super Admin
  const superAdminEmail = 'superadmin@gereja.id'
  const existingSuper = await db.user.findUnique({ where: { email: superAdminEmail } })
  if (!existingSuper) {
    const superAdmin = await db.user.create({
      data: {
        email: superAdminEmail,
        name: 'Super Admin Gereja',
        passwordHash: await hashPassword('superadmin123'),
        role: 'SUPER_ADMIN',
      },
    })
    console.log(`✅ Created Super Admin: ${superAdmin.email} / superadmin123`)

    // 2. Create a Region
    const region = await db.region.create({
      data: {
        name: 'Wilayah Jakarta',
        description: 'Wilayah gereja DKI Jakarta',
        address: 'Jakarta, Indonesia',
        createdById: superAdmin.id,
      },
    })
    console.log(`✅ Created Region: ${region.name}`)

    // 3. Create Regional Admin for that region
    const regionalAdmin = await db.user.create({
      data: {
        email: 'regional@gereja.id',
        name: 'Admin Wilayah Jakarta',
        passwordHash: await hashPassword('regional123'),
        role: 'REGIONAL_ADMIN',
        regionId: region.id,
        createdById: superAdmin.id,
      },
    })
    console.log(`✅ Created Regional Admin: ${regionalAdmin.email} / regional123`)

    // 4. Create Local churches under the region
    const local1 = await db.local.create({
      data: {
        name: 'Gereja Lokal Jakarta Pusat',
        address: 'Jl. Medan Merdeka, Jakarta Pusat',
        regionId: region.id,
        createdById: regionalAdmin.id,
      },
    })
    const local2 = await db.local.create({
      data: {
        name: 'Gereja Lokal Jakarta Selatan',
        address: 'Jl. Sudirman, Jakarta Selatan',
        regionId: region.id,
        createdById: regionalAdmin.id,
      },
    })
    console.log(`✅ Created Locals: ${local1.name}, ${local2.name}`)

    // 5. Create Local Admins
    const localAdmin1 = await db.user.create({
      data: {
        email: 'lokal.pusat@gereja.id',
        name: 'Admin Lokal Jakarta Pusat',
        passwordHash: await hashPassword('lokal123'),
        role: 'LOCAL_ADMIN',
        localId: local1.id,
        regionId: region.id,
        createdById: regionalAdmin.id,
      },
    })
    const localAdmin2 = await db.user.create({
      data: {
        email: 'lokal.selatan@gereja.id',
        name: 'Admin Lokal Jakarta Selatan',
        passwordHash: await hashPassword('lokal123'),
        role: 'LOCAL_ADMIN',
        localId: local2.id,
        regionId: region.id,
        createdById: regionalAdmin.id,
      },
    })
    console.log(`✅ Created Local Admins:`)
    console.log(`   - ${localAdmin1.email} / lokal123`)
    console.log(`   - ${localAdmin2.email} / lokal123`)

    // 6. Seed sample transactions for the past 6 months
    const categories = {
      CASH_IN: ['Persembahan Minggu', 'Donasi Jemaat', 'Sumbangan Khusus'],
      CASH_OUT: ['Gaji Pegawai', 'Biaya Operasional', 'Pemeliharaan Gedung', 'Listrik & Air'],
      REVENUE: ['Pendapatan Kegiatan', 'Penjualan Buku Rohani', 'Sewa Ruangan'],
    }
    const now = new Date()
    const txs: any[] = []
    for (let m = 5; m >= 0; m--) {
      for (let day = 1; day <= 4; day++) {
        const month = now.getMonth() - m
        const dateObj = new Date(now.getFullYear(), month, day * 7)
        txs.push({
          localId: local1.id,
          type: 'CASH_IN',
          category: categories.CASH_IN[day % 3],
          amount: 1500000 + Math.round(Math.random() * 2000000),
          description: 'Persembahan ibadah minggu',
          date: dateObj,
          createdById: localAdmin1.id,
        })
        txs.push({
          localId: local1.id,
          type: 'CASH_OUT',
          category: categories.CASH_OUT[day % 4],
          amount: 500000 + Math.round(Math.random() * 1500000),
          description: 'Pengeluaran rutin',
          date: dateObj,
          createdById: localAdmin1.id,
        })
        txs.push({
          localId: local1.id,
          type: 'REVENUE',
          category: categories.REVENUE[day % 3],
          amount: 800000 + Math.round(Math.random() * 1200000),
          description: 'Pendapatan kegiatan',
          date: dateObj,
          createdById: localAdmin1.id,
        })
        txs.push({
          localId: local2.id,
          type: 'CASH_IN',
          category: categories.CASH_IN[day % 3],
          amount: 1200000 + Math.round(Math.random() * 1800000),
          description: 'Persembahan ibadah',
          date: dateObj,
          createdById: localAdmin2.id,
        })
        txs.push({
          localId: local2.id,
          type: 'CASH_OUT',
          category: categories.CASH_OUT[day % 4],
          amount: 400000 + Math.round(Math.random() * 1300000),
          description: 'Pengeluaran',
          date: dateObj,
          createdById: localAdmin2.id,
        })
        txs.push({
          localId: local2.id,
          type: 'REVENUE',
          category: categories.REVENUE[day % 3],
          amount: 600000 + Math.round(Math.random() * 1000000),
          description: 'Pendapatan',
          date: dateObj,
          createdById: localAdmin2.id,
        })
      }
    }
    await db.transaction.createMany({ data: txs })
    console.log(`✅ Seeded ${txs.length} sample transactions`)
  } else {
    console.log('ℹ️  Super admin already exists, skipping seed.')
  }

  console.log('\n🎉 Seed complete!')
  console.log('═══════════════════════════════════════════')
  console.log('Login credentials:')
  console.log('  Super Admin:    superadmin@gereja.id / superadmin123')
  console.log('  Regional Admin: regional@gereja.id / regional123')
  console.log('  Local Admin:    lokal.pusat@gereja.id / lokal123')
  console.log('  Local Admin:    lokal.selatan@gereja.id / lokal123')
  console.log('═══════════════════════════════════════════')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
