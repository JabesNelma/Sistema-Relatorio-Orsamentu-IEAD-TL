'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { QRCodeSVG } from 'qrcode.react'
import { Check, Copy, Download, KeyRound, Link2, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  token: string | null
  name: string
  roleLabel: string
  scopeLabel?: string | null
  password?: string | null
  isNew?: boolean
}

export function QrCodeDialog({ open, onOpenChange, token, name, roleLabel, scopeLabel, password, isNew }: Props) {
  const [copied, setCopied] = useState(false)

  // The dialog only renders content when open=true (always client-side), so it
  // is safe to read window.location.origin directly here.
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const loginUrl = token ? `${origin}/?token=${token}` : ''
  const filename = `qr-${(name || 'admin').toLowerCase().replace(/\s+/g, '-')}.png`

  function copyLink() {
    if (!loginUrl) return
    navigator.clipboard.writeText(loginUrl)
    setCopied(true)
    toast.success('Link login disalin')
    setTimeout(() => setCopied(false), 1800)
  }

  function downloadQr() {
    const svg = document.getElementById('qr-svg') as unknown as SVGSVGElement | null
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(svgBlob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const size = 1024
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => {
        if (!blob) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = filename
        a.click()
        URL.revokeObjectURL(a.href)
        toast.success('QR code diunduh')
      })
    }
    img.src = url
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 gap-0">
        <div className="relative bg-emerald-deep text-cream px-6 pt-6 pb-5 overflow-hidden">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gold/20 blur-2xl" />
          <DialogHeader className="relative space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-gold" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl text-cream tracking-wide">
                  {isNew ? 'QR Login Dibuat' : 'QR Code Login'}
                </DialogTitle>
                <DialogDescription className="text-cream/70 text-xs">
                  {roleLabel}{scopeLabel ? ` · ${scopeLabel}` : ''}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-4">
          {isNew && (
            <div className="rounded-lg border border-gold/30 bg-gold/5 p-3 text-xs text-foreground/75 flex gap-2">
              <ShieldAlert className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span>
                Simpan QR code & link ini dengan aman. Admin akan <b>memindai QR</b> atau
                membuka link rahasia ini, lalu memasukkan password untuk masuk.
                {password ? <> Password sementara: <b className="text-foreground">{password}</b></> : null}
              </span>
            </div>
          )}

          {/* QR code */}
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-white border border-border shadow-elegant">
              {token ? (
                <QRCodeSVG
                  id="qr-svg"
                  value={loginUrl || 'no-token'}
                  size={208}
                  level="M"
                  bgColor="#ffffff"
                  fgColor="#14342b"
                />
              ) : (
                <div className="w-[208px] h-[208px] flex items-center justify-center text-xs text-muted-foreground">
                  Tidak ada token
                </div>
              )}
            </div>
          </div>

          {/* Secret link */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
              <Link2 className="w-3.5 h-3.5" /> Link Login Rahasia
            </div>
            <div className="flex items-stretch gap-2">
              <code className="flex-1 min-w-0 truncate rounded-md border border-border bg-muted/50 px-3 py-2 text-[11px] text-foreground/80">
                {loginUrl || '—'}
              </code>
              <Button type="button" size="sm" variant="outline" onClick={copyLink} className="px-3">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" onClick={downloadQr} variant="outline" className="flex-1 h-10">
              <Download className="w-4 h-4 mr-2" /> Unduh QR
            </Button>
            <Button type="button" onClick={() => onOpenChange(false)} className="flex-1 h-10 bg-primary hover:bg-primary/90 text-primary-foreground">
              Selesai
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
