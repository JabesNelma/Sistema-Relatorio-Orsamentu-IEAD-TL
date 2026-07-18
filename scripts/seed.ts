import { db } from '../src/lib/db'
import { hashPassword, generateLoginToken } from '../src/lib/auth'

async function main() {
  console.log('🌱 Seeding database...')

  // Wipe existing data so re-seeding produces clean tokens & regions.
  await db.session.deleteMany()
  await db.transaction.deleteMany()
  await db.user.deleteMany()
  await db.local.deleteMany()
  await db.region.deleteMany()

  // 1. Create default Super Admin (logs in with email + password, no QR token)
  const superAdmin = await db.user.create({
    data: {
      email: 'superadmin@gereja.id',
      name: 'Super Admin Gereja',
      passwordHash: await hashPassword('superadmin123'),
      role: 'SUPER_ADMIN',
    },
  })
  console.log(`✅ Super Admin: ${superAdmin.email} / superadmin123`)

  // 2. Create 4 regions (Wilayah 1 - Wilayah 4)
  const regionNames = ['Wilayah 1', 'Wilayah 2', 'Wilayah 3', 'Wilayah 4']
  const regions = await Promise.all(
    regionNames.map((name) =>
      db.region.create({
        data: {
          name,
          description: `Wilayah gereja ${name}`,
          createdById: superAdmin.id,
        },
      })
    )
  )
  console.log(`✅ Created ${regions.length} regions (Wilayah 1-4)`)

  // 3. Create a Regional Admin for Wilayah 1 (logs in via QR token)
  const regionalToken = generateLoginToken()
  const regionalAdmin = await db.user.create({
    data: {
      email: 'regional.wilayah1@gereja.internal',
      name: 'Admin Wilayah 1',
      passwordHash: await hashPassword('regional123'),
      role: 'REGIONAL_ADMIN',
      regionId: regions[0].id,
      createdById: superAdmin.id,
      loginToken: regionalToken,
      tokenActive: true,
      tokenCreatedAt: new Date(),
    },
  })
  console.log(`✅ Regional Admin: ${regionalAdmin.name} / regional123`)
  console.log(`   🔑 Login link: /?token=${regionalToken}`)

  // 4. Create Local churches under Wilayah 1
  const local1 = await db.local.create({
    data: {
      name: 'Gereja Lokal Pusat',
      address: 'Jl. Medan Merdeka, Jakarta Pusat',
      regionId: regions[0].id,
      createdById: regionalAdmin.id,
    },
  })
  const local2 = await db.local.create({
    data: {
      name: 'Gereja Lokal Selatan',
      address: 'Jl. Sudirman, Jakarta Selatan',
      regionId: regions[0].id,
      createdById: regionalAdmin.id,
    },
  })
  console.log(`✅ Locals: ${local1.name}, ${local2.name}`)

  // 5. Create Local Admins (each logs in via QR token)
  const la1Token = generateLoginToken()
  const localAdmin1 = await db.user.create({
    data: {
      email: 'lokal.pusat@gereja.internal',
      name: 'Admin Lokal Pusat',
      passwordHash: await hashPassword('lokal123'),
      role: 'LOCAL_ADMIN',
      localId: local1.id,
      regionId: regions[0].id,
      createdById: regionalAdmin.id,
      loginToken: la1Token,
      tokenActive: true,
      tokenCreatedAt: new Date(),
    },
  })
  const la2Token = generateLoginToken()
  const localAdmin2 = await db.user.create({
    data: {
      email: 'lokal.selatan@gereja.internal',
      name: 'Admin Lokal Selatan',
      passwordHash: await hashPassword('lokal123'),
      role: 'LOCAL_ADMIN',
      localId: local2.id,
      regionId: regions[0].id,
      createdById: regionalAdmin.id,
      loginToken: la2Token,
      tokenActive: true,
      tokenCreatedAt: new Date(),
    },
  })
  console.log(`✅ Local Admin: ${localAdmin1.name} / lokal123`)
  console.log(`   🔑 Login link: /?token=${la1Token}`)
  console.log(`✅ Local Admin: ${localAdmin2.name} / lokal123`)
  console.log(`   🔑 Login link: /?token=${la2Token}`)

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
      txs.push({ localId: local1.id, type: 'CASH_IN', category: categories.CASH_IN[day % 3], amount: 1500000 + Math.round(Math.random() * 2000000), description: 'Persembahan ibadah minggu', date: dateObj, createdById: localAdmin1.id })
      txs.push({ localId: local1.id, type: 'CASH_OUT', category: categories.CASH_OUT[day % 4], amount: 500000 + Math.round(Math.random() * 1500000), description: 'Pengeluaran rutin', date: dateObj, createdById: localAdmin1.id })
      txs.push({ localId: local1.id, type: 'REVENUE', category: categories.REVENUE[day % 3], amount: 800000 + Math.round(Math.random() * 1200000), description: 'Pendapatan kegiatan', date: dateObj, createdById: localAdmin1.id })
      txs.push({ localId: local2.id, type: 'CASH_IN', category: categories.CASH_IN[day % 3], amount: 1200000 + Math.round(Math.random() * 1800000), description: 'Persembahan ibadah', date: dateObj, createdById: localAdmin2.id })
      txs.push({ localId: local2.id, type: 'CASH_OUT', category: categories.CASH_OUT[day % 4], amount: 400000 + Math.round(Math.random() * 1300000), description: 'Pengeluaran', date: dateObj, createdById: localAdmin2.id })
      txs.push({ localId: local2.id, type: 'REVENUE', category: categories.REVENUE[day % 3], amount: 600000 + Math.round(Math.random() * 1000000), description: 'Pendapatan', date: dateObj, createdById: localAdmin2.id })
    }
  }
  await db.transaction.createMany({ data: txs })
  console.log(`✅ Seeded ${txs.length} sample transactions`)

  console.log('\n🎉 Seed complete!')
  console.log('═══════════════════════════════════════════')
  console.log('Login credentials:')
  console.log('  Super Admin (email): superadmin@gereja.id / superadmin123')
  console.log('  Regional & Local admins login via QR code link + password')
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
