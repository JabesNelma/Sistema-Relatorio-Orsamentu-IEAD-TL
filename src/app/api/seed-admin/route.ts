import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateSecureToken } from '@/lib/auth/session'

/**
 * POST /api/seed-admin
 *
 * Development-only endpoint that creates demo admin users with QR codes
 * so the QR login flow can be tested without Supabase being configured.
 */
export async function POST() {
  try {
    // Check if demo admins already exist
    const existing = await prisma.user.findFirst({
      where: { name: 'Demo Admin Regional' },
    })

    if (existing) {
      // Return existing tokens
      const regionalQr = await prisma.qrCode.findFirst({
        where: { userId: existing.id, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      })

      const lokalUser = await prisma.user.findFirst({
        where: { name: 'Demo Admin Lokal' },
      })
      const lokalQr = lokalUser
        ? await prisma.qrCode.findFirst({
            where: { userId: lokalUser.id, status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
          })
        : null

      return NextResponse.json({
        success: true,
        message: 'Demo admins already exist',
        data: {
          regional: {
            token: regionalQr?.token,
            loginUrl: regionalQr
              ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/qr-login?token=${regionalQr.token}`
              : null,
          },
          lokal: {
            token: lokalQr?.token,
            loginUrl: lokalQr
              ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/qr-login?token=${lokalQr.token}`
              : null,
          },
        },
      })
    }

    // Create a fake super admin to be the "generator"
    let superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' },
    })

    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          email: 'demo-superadmin@siadtl.test',
          name: 'Demo Super Admin',
          role: 'SUPER_ADMIN',
          isActive: true,
        },
      })
    }

    // Create Demo Admin Regional
    const regionalUser = await prisma.user.create({
      data: {
        name: 'Demo Admin Regional',
        role: 'ADMIN_REGIONAL',
        region: 'Baucau',
        isActive: true,
      },
    })

    const regionalToken = generateSecureToken()
    await prisma.qrCode.create({
      data: {
        token: regionalToken,
        userId: regionalUser.id,
        status: 'ACTIVE',
        generatedBy: superAdmin.id,
      },
    })

    // Create Demo Admin Lokal
    const lokalUser = await prisma.user.create({
      data: {
        name: 'Demo Admin Lokal',
        role: 'ADMIN_LOKAL',
        churchName: 'Igreja Baucau Centro',
        isActive: true,
      },
    })

    const lokalToken = generateSecureToken()
    await prisma.qrCode.create({
      data: {
        token: lokalToken,
        userId: lokalUser.id,
        status: 'ACTIVE',
        generatedBy: superAdmin.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Demo admins created successfully',
      data: {
        regional: {
          userId: regionalUser.id,
          name: regionalUser.name,
          role: regionalUser.role,
          region: regionalUser.region,
          token: regionalToken,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/qr-login?token=${regionalToken}`,
        },
        lokal: {
          userId: lokalUser.id,
          name: lokalUser.name,
          role: lokalUser.role,
          churchName: lokalUser.churchName,
          token: lokalToken,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/qr-login?token=${lokalToken}`,
        },
      },
    })
  } catch (error) {
    console.error('Seed admin error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed demo admins', details: String(error) },
      { status: 500 }
    )
  }
}
