export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount)
}

export function formatCompact(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)} M`
  if (Math.abs(amount) >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)} jt`
  if (Math.abs(amount) >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)} rb`
  return `Rp ${amount}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  CASH_IN: 'Uang Masuk',
  CASH_OUT: 'Uang Keluar',
  REVENUE: 'Pendapatan',
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  REGIONAL_ADMIN: 'Admin Wilayah',
  LOCAL_ADMIN: 'Admin Lokal',
}
