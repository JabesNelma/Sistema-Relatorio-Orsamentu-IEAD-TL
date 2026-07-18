import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword, toSafeUser } from '@/lib/auth'

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

// POST: create an admin
// - SUPER_ADMIN -> creates REGIONAL_ADMIN (must specify regionId; auto-creates region if name provided without regionId)
// - REGIONAL_ADMIN -> creates LOCAL_ADMIN (must specify localId in their region)
export async function POST(req: NextRequest) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, email, password, phone, regionId, regionName, regionDescription, localId, localName, localAddress } = body

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const existing = await db.user.findUnique({ where: { email: normalizedEmail } })
  if (existing) {
    return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 })
  }

  if (me.role === 'SUPER_ADMIN') {
    // Create REGIONAL_ADMIN. Need a region: either existing regionId or create new region from regionName.
    let finalRegionId = regionId as string | undefined

    if (!finalRegionId && regionName) {
      const region = await db.region.create({
        data: {
          name: regionName,
          description: regionDescription ?? null,
          address: null,
          createdById: me.id,
        },
      })
      finalRegionId = region.id
    }
    if (!finalRegionId) {
      return NextResponse.json({ error: 'Wilayah (region) wajib dipilih atau dibuat' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        role: 'REGIONAL_ADMIN',
        phone: phone ?? null,
        regionId: finalRegionId,
        createdById: me.id,
      },
      include: {
        region: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ user: toSafeUser(user) })
  }

  if (me.role === 'REGIONAL_ADMIN') {
    // Create LOCAL_ADMIN scoped to the regional admin's region.
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

    // Ensure the local belongs to this regional admin's region
    const local = await db.local.findUnique({ where: { id: finalLocalId } })
    if (!local || local.regionId !== me.regionId) {
      return NextResponse.json({ error: 'Gereja lokal tidak valid' }, { status: 400 })
    }

    const user = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
        role: 'LOCAL_ADMIN',
        phone: phone ?? null,
        regionId: me.regionId,
        localId: finalLocalId,
        createdById: me.id,
      },
      include: {
        local: { select: { id: true, name: true } },
      },
    })
    return NextResponse.json({ user: toSafeUser(user) })
  }

  return NextResponse.json({ error: 'Anda tidak memiliki izin untuk membuat admin' }, { status: 403 })
}
