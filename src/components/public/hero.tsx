'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ArrowDown, ChevronRight, HandHeart, ShieldCheck, Sparkles } from 'lucide-react'

type Props = {
  onLogin: () => void
}

export function Hero({ onLogin }: Props) {
  return (
    <section id="beranda" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/images/hero-church.jpg"
          alt="Interior katedral dengan cahaya jendela kaca patri"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 hero-overlay" />
        {/* subtle gold vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(20,45,38,0.55)_100%)]" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute top-1/4 right-[8%] w-40 h-40 rounded-full bg-gold/10 blur-3xl animate-floaty pointer-events-none" />
      <div className="absolute bottom-1/4 left-[10%] w-56 h-56 rounded-full bg-gold/5 blur-3xl animate-floaty pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="relative container mx-auto max-w-6xl px-4 sm:px-6 pt-24 pb-16">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cream/10 border border-gold/30 backdrop-blur-sm mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-cream/90 font-medium">
              Transparansi · Iman · Akuntabilitas
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-cream leading-[1.05] tracking-tight"
          >
            Laporan Keuangan
            <span className="block text-gradient-gold glow-gold mt-2">Gereja yang Terpadu</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-base sm:text-lg text-cream/85 max-w-xl leading-relaxed"
          >
            Satu platform yang menghubungkan admin pusat, wilayah, dan gereja lokal —
            menghadirkan laporan keuangan yang transparan, visual, dan penuh syukur atas
            setiap berkat yang kita terima.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Button
              onClick={onLogin}
              size="lg"
              className="h-12 px-7 bg-gold text-emerald-deep hover:bg-gold/90 font-medium shadow-elegant-lg group"
            >
              Masuk ke Sistem
              <ChevronRight className="w-4 h-4 ml-1.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
            <a href="#tentang">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-7 bg-cream/5 border-cream/30 text-cream hover:bg-cream/15 hover:text-cream backdrop-blur-sm"
              >
                Pelajari Lebih Lanjut
                <ArrowDown className="w-4 h-4 ml-1.5" />
              </Button>
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-xl"
          >
            {[
              { icon: ShieldCheck, label: 'Tingkat Akses', value: '3 Peran' },
              { icon: HandHeart, label: 'Transparansi', value: '100%' },
              { icon: Sparkles, label: 'Laporan Visual', value: 'Real-time' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col">
                <item.icon className="w-5 h-5 text-gold mb-2" />
                <span className="font-serif text-2xl sm:text-3xl text-cream">{item.value}</span>
                <span className="text-[11px] sm:text-xs uppercase tracking-wider text-cream/60">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 text-cream/50">
        <span className="text-[10px] uppercase tracking-[0.3em]">Gulir</span>
        <div className="w-px h-10 bg-gradient-to-b from-cream/40 to-transparent" />
      </div>
    </section>
  )
}
