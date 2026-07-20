'use client'

import { Church, Heart, Mail, MapPin, Phone } from 'lucide-react'

type Props = {
  onLogin: () => void
}

export function Footer({ onLogin }: Props) {
  return (
    <footer className="relative bg-emerald-deep text-cream/80 mt-auto">
      <div className="absolute top-0 inset-x-0 h-px divider-gold opacity-70" />

      {/* Decorative pattern band */}
      <div className="h-1.5 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
                <Church className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-serif text-xl text-cream tracking-wide">IEAD-TL</p>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Laporan Keuangan</p>
              </div>
            </div>
            <p className="text-sm text-cream/65 leading-relaxed max-w-xs">
              Sistem terpadu untuk pengelolaan keuangan gereja yang transparan, akuntabel, dan
              penuh syukur atas setiap berkat.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold font-medium mb-4">Navigasi</p>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: 'Beranda', href: '#beranda' },
                { label: 'Tentang Sistem', href: '#tentang' },
                { label: 'Layanan & Peran', href: '#layanan' },
                { label: 'Kontak', href: '#kontak' },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-cream/70 hover:text-gold transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <button onClick={onLogin} className="text-cream/70 hover:text-gold transition-colors">
                  Portal Admin
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold font-medium mb-4">Kontak</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span className="text-cream/70">Jl. Emanuel No. 88, Jakarta</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <span className="text-cream/70">+62 21 555 8899</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-gold shrink-0" />
                <span className="text-cream/70">kontak@gereja-emanuel.id</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-cream/50">
            © {new Date().getFullYear()} IEAD-TL · Sistem Laporan Keuangan
          </p>
          <p className="text-xs text-cream/50 flex items-center gap-1.5">
            Dibuat dengan
            <Heart className="w-3 h-3 text-gold fill-gold" />
            untuk kemuliaan-Nya
          </p>
        </div>
      </div>
    </footer>
  )
}
