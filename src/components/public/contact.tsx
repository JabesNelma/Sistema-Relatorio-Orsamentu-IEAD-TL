'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Mail, MapPin, Phone, Send, Loader2, Clock, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Gagal mengirim pesan')
        return
      }
      toast.success('Pesan Anda telah terkirim. Terima kasih!')
      setForm({ name: '', email: '', phone: '', subject: '', message: '' })
    } catch {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  const contactInfo = [
    { icon: MapPin, label: 'Alamat', value: 'Jl. Emanuel No. 88, Jakarta, Indonesia', sub: 'IEAD-TL Pusat' },
    { icon: Phone, label: 'Telepon', value: '+62 21 555 8899', sub: 'Senin–Sabtu, 08.00–17.00' },
    { icon: Mail, label: 'Email', value: 'kontak@gereja-emanuel.id', sub: 'Respon dalam 1×24 jam' },
  ]

  return (
    <section id="kontak" className="relative py-20 sm:py-28 bg-background overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px divider-gold opacity-60" />
      {/* decorative */}
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gold/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: info */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-medium">Hubungi Kami</span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl text-foreground leading-tight">
              Mari berdialog &
              <span className="text-gradient-gold"> bertumbuh bersama</span>
            </h2>
            <p className="mt-5 text-foreground/70 leading-relaxed max-w-md">
              Punya pertanyaan tentang sistem laporan keuangan, ingin berkonsultasi, atau
              membutuhkan bantuan? Tim kami siap menyambut Anda.
            </p>

            <div className="mt-8 space-y-3">
              {contactInfo.map((info) => (
                <div
                  key={info.label}
                  className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/70 hover:border-gold/40 transition-colors group"
                >
                  <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-primary/15 to-gold/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <info.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                      {info.label}
                    </p>
                    <p className="text-sm font-medium text-foreground mt-0.5 break-words">{info.value}</p>
                    <p className="text-xs text-foreground/55 mt-0.5">{info.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-emerald-deep text-cream">
              <Clock className="w-5 h-5 text-gold shrink-0" />
              <div>
                <p className="text-sm font-medium">Ibadah Raya</p>
                <p className="text-xs text-cream/70">Setiap Minggu · 07.00 &amp; 10.00 WIB</p>
              </div>
            </div>
          </motion.div>

          {/* Right: form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -top-3 -right-3 w-16 h-16 rounded-2xl bg-gold/20 -z-10" />
            <div className="absolute -bottom-3 -left-3 w-16 h-16 rounded-2xl bg-primary/15 -z-10" />
            <form
              onSubmit={handleSubmit}
              className="relative p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-elegant-lg space-y-5"
            >
              <div className="flex items-center gap-2 pb-2">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-primary" />
                </div>
                <h3 className="font-serif text-xl text-foreground">Kirim Pesan</h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-name" className="text-foreground/80">Nama Lengkap</Label>
                  <Input
                    id="c-name"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    placeholder="Nama Anda"
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-email" className="text-foreground/80">Email</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="email@contoh.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="c-phone" className="text-foreground/80">Telepon <span className="text-muted-foreground text-xs">(opsional)</span></Label>
                  <Input
                    id="c-phone"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+62 812 3456 7890"
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="c-subject" className="text-foreground/80">Subjek</Label>
                  <Input
                    id="c-subject"
                    value={form.subject}
                    onChange={(e) => update('subject', e.target.value)}
                    placeholder="Perihal pesan"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="c-message" className="text-foreground/80">Pesan</Label>
                <Textarea
                  id="c-message"
                  value={form.message}
                  onChange={(e) => update('message', e.target.value)}
                  placeholder="Tuliskan pesan Anda di sini..."
                  rows={5}
                  required
                  disabled={loading}
                  className="resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-primary text-cream hover:bg-primary/90 font-medium"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                Kirim Pesan
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
