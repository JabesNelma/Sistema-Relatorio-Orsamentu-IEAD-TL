import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword, toSafeUser, generateLoginToken, syncSupabaseAuthUser, deleteSupabaseAuthUser } from '@/lib/auth'
import { randomBytes } from 'crypto'

// GET: list admins visible to current user
// - SUPER_ADMIN: all regional admins
// - REGIONAL_ADMIN: local admins in their region
// - LOCAL_ADMIN: (no subordinates) -> empty
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let users: any[] = []
  if (me.role === 'SUPER_ADMIN') {
    users = await db.user.findMany({
      where: { role: 'REGIONAL_ADMIN' },
      include: {
        region: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
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

// POST: create an admin
// - SUPER_ADMIN -> creates REGIONAL_ADMIN
//   body: { name, wilayah: 1|2|3|4, password }
//   Generates a secret login token (for QR code login link).
// - REGIONAL_ADMIN -> creates LOCAL_ADMIN
//   body: { name, localId?, localName?, localAddress?, password }
//   Generates a secret login token (for QR code login link).
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, password, wilayah, localId, localName, localAddress } = body

  if (!name || !password) {
    return NextResponse.json({ error: 'Nama lengkap dan password wajib diisi' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
  }

  if (me.role === 'SUPER_ADMIN') {
    // Wilayah must be one of 1..4
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

  if (me.role === 'REGIONAL_ADMIN') {
    // Resolve the local church: existing localId (in this region) or create new.
    let finalLocalId = localId as string | undefined

    if (!finalLocalId && localName) {
      const local = await db.local.create({
        data: {
          name: localName,
          address: localAddress ?? null,
          regionId: me.regionId!,
          createdById: me.id,
        },
      })
      finalLocalId = local.id
    }
    if (!finalLocalId) {
      return NextResponse.json({ error: 'Gereja lokal wajib dipilih atau dibuat' }, { status: 400 })
    }

    const local = await db.local.findUnique({ where: { id: finalLocalId } })
    if (!local || local.regionId !== me.regionId) {
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
          regionId: me.regionId,
          localId: finalLocalId,
          createdById: me.id,
          loginToken,
          tokenActive: true,
          tokenCreatedAt: new Date(),
        },
        include: {
          local: { select: { id: true, name: true } },
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

  return NextResponse.json({ error: 'Anda tidak memiliki izin untuk membuat admin' }, { status: 403 })
}
