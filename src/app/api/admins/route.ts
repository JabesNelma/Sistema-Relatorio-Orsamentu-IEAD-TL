import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword, toSafeUser, generateLoginToken, syncSupabaseAuthUser, deleteSupabaseAuthUser } from '@/lib/auth'
import { randomBytes } from 'crypto'

// GET: list admins visible to current user
// - SUPER_ADMIN: all regional admins (default), or all local admins with ?role=LOCAL_ADMIN
// - REGIONAL_ADMIN: local admins in their region (read-only view)
// - LOCAL_ADMIN: (no subordinates) -> empty
export async function GET(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const roleFilter = url.searchParams.get('role') // 'LOCAL_ADMIN' to list local admins

  let users: any[] = []
  if (me.role === 'SUPER_ADMIN') {
    if (roleFilter === 'LOCAL_ADMIN') {
      users = await db.user.findMany({
        where: { role: 'LOCAL_ADMIN' },
        include: {
          region: { select: { id: true, name: true } },
          local: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    } else {
      users = await db.user.findMany({
        where: { role: 'REGIONAL_ADMIN' },
        include: {
          region: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
    }
  } else if (me.role === 'REGIONAL_ADMIN') {
    users = await db.user.findMany({
      where: { role: 'LOCAL_ADMIN', regionId: me.regionId },
      include: {
        local: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  return NextResponse.json({
    users: users.map((u) => ({
      ...toSafeUser(u),
      createdBy: u.createdBy?.name ?? null,
    })),
  })
}

// Build a unique internal email (regional/local admins never use email to log in).
function makeInternalEmail(prefix: string): string {
  return `${prefix}-${randomBytes(5).toString('hex')}@gereja.internal`
}

// POST: create an admin (SUPER_ADMIN only)
//   body for REGIONAL_ADMIN: { name, wilayah: 1|2|3|4, password }
//   body for LOCAL_ADMIN:    { name, password, type: 'local', regionId,
//                              localId? | localName?, localAddress? }
//   Generates a secret login token (for QR code login link).
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (me.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Anda tidak memiliki izin untuk membuat admin' }, { status: 403 })
  }

  const body = await req.json()
  const { name, password, wilayah, type, regionId, localId, localName, localAddress } = body

  if (!name || !password) {
    return NextResponse.json({ error: 'Nama lengkap dan password wajib diisi' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
  }

  // Branch: create a LOCAL_ADMIN under a chosen region + local church.
  if (type === 'local') {
    if (!regionId) {
      return NextResponse.json({ error: 'Wilayah wajib dipilih' }, { status: 400 })
    }

    const region = await db.region.findUnique({ where: { id: regionId } })
    if (!region) {
      return NextResponse.json({ error: 'Wilayah tidak valid' }, { status: 400 })
    }

    // Resolve the local church: existing localId (must belong to region) or create new.
    let finalLocalId = localId as string | undefined
    if (!finalLocalId && localName) {
      const local = await db.local.create({
        data: {
          name: localName,
          address: localAddress ?? null,
          regionId: region.id,
          createdById: me.id,
        },
      })
      finalLocalId = local.id
    }
    if (!finalLocalId) {
      return NextResponse.json({ error: 'Gereja lokal wajib dipilih atau dibuat' }, { status: 400 })
    }

    const local = await db.local.findUnique({ where: { id: finalLocalId } })
    if (!local || local.regionId !== region.id) {
      return NextResponse.json({ error: 'Gereja lokal tidak valid' }, { status: 400 })
    }

    let email = makeInternalEmail('lokal')
    while (await db.user.findUnique({ where: { email } })) {
      email = makeInternalEmail('lokal')
    }

    const loginToken = generateLoginToken()
    const authUserId = await syncSupabaseAuthUser({ email, name, role: 'LOCAL_ADMIN' }, password)
    let user
    try {
      user = await db.user.create({
        data: {
          name,
          email,
          passwordHash: await hashPassword(password),
          authUserId: authUserId ?? undefined,
          role: 'LOCAL_ADMIN',
          regionId: region.id,
          localId: finalLocalId,
          createdById: me.id,
          loginToken,
          tokenActive: true,
          tokenCreatedAt: new Date(),
        },
        include: {
          local: { select: { id: true, name: true } },
          region: { select: { id: true, name: true } },
        },
      })
    } catch (error) {
      await deleteSupabaseAuthUser(authUserId).catch(() => {})
      throw error
    }

    return NextResponse.json({
      user: toSafeUser(user),
      loginToken,
      loginUrl: `/?token=${loginToken}`,
    })
  }

  // Default branch: create a REGIONAL_ADMIN for a numbered Wilayah (1..4).
  const n = Number(wilayah)
  if (![1, 2, 3, 4].includes(n)) {
    return NextResponse.json({ error: 'Wilayah harus 1, 2, 3, atau 4' }, { status: 400 })
  }

  // Find-or-create the region named "Wilayah N"
  const regionName = `Wilayah ${n}`
  let region = await db.region.findFirst({ where: { name: regionName } })
  if (!region) {
    region = await db.region.create({
      data: {
        name: regionName,
        description: `Wilayah gereja ${regionName}`,
        createdById: me.id,
      },
    })
  }

  // Auto-generate a unique internal email (not used for login)
  let email = makeInternalEmail(`wilayah${n}`)
  while (await db.user.findUnique({ where: { email } })) {
    email = makeInternalEmail(`wilayah${n}`)
  }

  const loginToken = generateLoginToken()
  const authUserId = await syncSupabaseAuthUser({ email, name, role: 'REGIONAL_ADMIN' }, password)
  let user
  try {
    user = await db.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        authUserId: authUserId ?? undefined,
        role: 'REGIONAL_ADMIN',
        regionId: region.id,
        createdById: me.id,
        loginToken,
        tokenActive: true,
        tokenCreatedAt: new Date(),
      },
      include: {
        region: { select: { id: true, name: true } },
      },
    })
  } catch (error) {
    await deleteSupabaseAuthUser(authUserId).catch(() => {})
    throw error
  }

  return NextResponse.json({
    user: toSafeUser(user),
    loginToken,
    loginUrl: `/?token=${loginToken}`,
  })
}
