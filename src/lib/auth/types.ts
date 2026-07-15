import { Role } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string | null
  name: string
  role: Role
  region: string | null
  churchName: string | null
  isActive: boolean
}

export interface AdminListItem {
  id: string
  name: string
  email: string | null
  role: Role
  region: string | null
  churchName: string | null
  isActive: boolean
  createdAt: Date
  qrCode: {
    id: string
    status: string
    createdAt: Date
  } | null
}

export interface LoginHistoryItem {
  id: string
  userId: string
  userName: string
  userRole: Role
  loginMethod: string
  deviceInfo: string | null
  ipAddress: string | null
  success: boolean
  createdAt: Date
}

// Role labels in Tetum
export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN_REGIONAL: 'Admin Regional',
  ADMIN_LOKAL: 'Admin Lokal',
}

// Role badge colors
export const ROLE_COLORS: Record<Role, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  ADMIN_REGIONAL: 'bg-blue-100 text-blue-700',
  ADMIN_LOKAL: 'bg-green-100 text-green-700',
}
