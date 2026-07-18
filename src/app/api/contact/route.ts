import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, subject, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Nama, email, dan pesan wajib diisi' }, { status: 400 })
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }
    if (message.length < 5) {
      return NextResponse.json({ error: 'Pesan terlalu pendek' }, { status: 400 })
    }

    const saved = await db.contactMessage.create({
      data: {
        name: String(name).slice(0, 120),
        email: String(email).slice(0, 160),
        phone: phone ? String(phone).slice(0, 40) : null,
        subject: subject ? String(subject).slice(0, 200) : null,
        message: String(message).slice(0, 4000),
      },
    })

    return NextResponse.json({ ok: true, id: saved.id })
  } catch (e) {
    console.error('Contact error:', e)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
