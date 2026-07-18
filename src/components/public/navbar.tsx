'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Church, LogIn, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  onLogin: () => void
}

const navLinks = [
  { label: 'Beranda', href: '#beranda' },
  { label: 'Tentang', href: '#tentang' },
  { label: 'Layanan', href: '#layanan' },
  { label: 'Kontak', href: '#kontak' },
]

export function Navbar({ onLogin }: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-cream/90 backdrop-blur-md shadow-elegant border-b border-gold/20 py-2.5'
          : 'bg-transparent py-4'
      )}
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-between">
        <a href="#beranda" className="flex items-center gap-2.5 group">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
            scrolled ? 'bg-primary text-cream' : 'bg-cream/15 border border-cream/30 text-cream backdrop-blur-sm'
          )}>
            <Church className="w-5 h-5" />
          </div>
          <div className="flex flex-col leading-none">
            <span className={cn(
              'font-serif text-lg tracking-wide transition-colors',
              scrolled ? 'text-primary' : 'text-cream'
            )}>
              Gereja Emanuel
            </span>
            <span className={cn(
              'text-[10px] uppercase tracking-[0.25em] transition-colors',
              scrolled ? 'text-gold' : 'text-cream/70'
            )}>
              Laporan Keuangan
            </span>
          </div>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'px-3.5 py-2 text-sm font-medium rounded-md transition-colors',
                scrolled
                  ? 'text-foreground/75 hover:text-primary hover:bg-accent/50'
                  : 'text-cream/85 hover:text-cream hover:bg-cream/10'
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            onClick={onLogin}
            size="sm"
            className={cn(
              'hidden sm:inline-flex h-9 font-medium transition-all',
              scrolled
                ? 'bg-primary text-cream hover:bg-primary/90'
                : 'bg-gold text-emerald-deep hover:bg-gold/90 shadow-elegant'
            )}
          >
            <LogIn className="w-4 h-4 mr-1.5" />
            Masuk
          </Button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={cn(
              'md:hidden w-10 h-10 rounded-md flex items-center justify-center transition-colors',
              scrolled ? 'text-primary hover:bg-accent/50' : 'text-cream hover:bg-cream/10'
            )}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full inset-x-0 bg-cream border-b border-gold/20 shadow-elegant-lg animate-fade-up">
          <nav className="container mx-auto max-w-6xl px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-sm font-medium text-foreground/80 hover:text-primary hover:bg-accent/40 rounded-md"
              >
                {link.label}
              </a>
            ))}
            <Button
              onClick={() => { onLogin(); setMobileOpen(false) }}
              size="sm"
              className="mt-2 bg-primary text-cream hover:bg-primary/90"
            >
              <LogIn className="w-4 h-4 mr-1.5" />
              Masuk Sistem
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
