'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, Loader2, RefreshCw } from 'lucide-react'

interface QrCodeDisplayProps {
  dataUrl: string
  userName: string
  userRole: string
  token: string
  onClose?: () => void
  onRegenerate?: () => void
}

export function QrCodeDisplay({
  dataUrl,
  userName,
  userRole,
  token,
  onClose,
  onRegenerate,
}: QrCodeDisplayProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = () => {
    setDownloading(true)
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `qr-${userName.replace(/\s+/g, '-').toLowerCase()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setDownloading(false)
  }

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-center">QR Code ba {userName}</DialogTitle>
        <DialogDescription className="text-center">
          QR Code nee bele uza atu login. Inda ita boot haruka nee ba admin nee.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col items-center gap-4 py-4">
        {/* QR Code Image */}
        <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
          <img
            src={dataUrl}
            alt={`QR Code for ${userName}`}
            className="w-64 h-64"
          />
        </div>

        {/* User Info */}
        <div className="text-center">
          <p className="font-semibold text-gray-900">{userName}</p>
          <p className="text-sm text-gray-500">
            {userRole === 'ADMIN_REGIONAL' ? 'Admin Regional' : 'Admin Lokal'}
          </p>
        </div>

        {/* Token (truncated, for reference) */}
        <div className="w-full bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Token (first 16 chars):</p>
          <p className="font-mono text-xs text-gray-700 break-all">
            {token.substring(0, 16)}...
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            variant="outline"
            className="flex-1"
          >
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download
          </Button>
          {onRegenerate && (
            <Button
              onClick={onRegenerate}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Fó QR Foun
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center">
          Scan QR Code nee ho kamera telefón ka uza URL ba login.
        </p>
      </div>
    </DialogContent>
  )
}
