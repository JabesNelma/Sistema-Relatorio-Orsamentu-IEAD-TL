'use client'

/**
 * Super Admin Management Page
 * ---------------------------
 * Only accessible by SUPER_ADMIN (enforced by middleware).
 *
 * Features:
 * - List all admins with their roles, regions, and QR status
 * - Add new admin (ADMIN_REGIONAL or ADMIN_LOKAL)
 * - Generate QR Code for an admin
 * - Enable/disable QR Code
 * - View login history
 * - Delete admin
 */

import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Plus, QrCode as QrIcon, History, Trash2, Power, Loader2, Shield, CheckCircle, XCircle, LogOut, Download } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { REGIONS } from '@/lib/data'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

// ============================================
// TYPES
// ============================================

interface AdminUser {
  id: string
  name: string
  email: string | null
  role: string
  region: string | null
  churchName: string | null
  status: string
  hasActiveQr: boolean
  createdAt: string
}

interface LoginHistoryEntry {
  id: string
  userId: string
  userName: string
  userRole: string
  method: string
  deviceInfo: string | null
  ipAddress: string | null
  createdAt: string
}

interface QrData {
  id: string
  token: string
  qrDataUrl: string
  loginUrl: string
  isActive: boolean
  createdAt: string
}

// ============================================
// MAIN PAGE
// ============================================

export default function ManageAdminsPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [history, setHistory] = useState<LoginHistoryEntry[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [qrModalUser, setQrModalUser] = useState<AdminUser | null>(null)

  // Redirect if not super admin
  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.push('/login')
    }
  }, [user, loading, router])

  const fetchAdmins = useCallback(async () => {
    try {
      setLoadingAdmins(true)
      const res = await fetch('/api/admin')
      const data = await res.json()
      if (data.success) {
        setAdmins(data.data)
      }
    } catch (error) {
      console.error('Fetch admins error:', error)
    } finally {
      setLoadingAdmins(false)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true)
      const res = await fetch('/api/login-history')
      const data = await res.json()
      if (data.success) {
        setHistory(data.data)
      }
    } catch (error) {
      console.error('Fetch history error:', error)
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      fetchAdmins()
      fetchHistory()
    }
  }, [user, fetchAdmins, fetchHistory])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tebes duni atu hapus admin "${name}"?`)) return

    try {
      const res = await fetch(`/api/admin/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Admin hapus ona')
        fetchAdmins()
      } else {
        toast.error('Erro', { description: data.error })
      }
    } catch {
      toast.error('Erro atu hapus admin')
    }
  }

  const handleToggleQr = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/qr/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(currentStatus ? 'QR Code desaktiva ona' : 'QR Code aktiva ona')
        fetchAdmins()
      } else {
        toast.error('Erro', { description: data.error })
      }
    } catch {
      toast.error('Erro atu troka QR status')
    }
  }

  const handleToggleStatus = async (admin: AdminUser) => {
    const newStatus = admin.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      const res = await fetch(`/api/admin/${admin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Admin ${newStatus === 'ACTIVE' ? 'aktiva' : 'desaktiva'} ona`)
        fetchAdmins()
      }
    } catch {
      toast.error('Erro atu troka status')
    }
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Super Admin" showHome />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900">Maneja Admin</h2>
              </div>
              <p className="text-gray-600 mt-1">
                Hatama, haree, no maneja admin hotu-hotu iha sistema.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                Login ho: <span className="font-medium text-gray-700">{user.email}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Sai
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{admins.length}</p>
                    <p className="text-sm text-gray-500">Admin Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {admins.filter((a) => a.role === 'ADMIN_REGIONAL').length}
                    </p>
                    <p className="text-sm text-gray-500">Admin Regional</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <QrIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {admins.filter((a) => a.hasActiveQr).length}
                    </p>
                    <p className="text-sm text-gray-500">QR Aktibu</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {admins.filter((a) => a.status === 'ACTIVE').length}
                    </p>
                    <p className="text-sm text-gray-500">Admin Aktibu</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs: Admins | Login History */}
          <Tabs defaultValue="admins" className="space-y-4">
            <TabsList>
              <TabsTrigger value="admins">
                <Users className="w-4 h-4 mr-2" />
                Admin Lista
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="w-4 h-4 mr-2" />
                Istória Login
              </TabsTrigger>
            </TabsList>

            {/* Admins Tab */}
            <TabsContent value="admins" className="space-y-4">
              <div className="flex justify-end">
                <AddAdminDialog onAdded={fetchAdmins} />
              </div>

              <Card className="border-gray-200 shadow-sm">
                <CardContent className="p-0">
                  {loadingAdmins ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold text-gray-700">Naran</TableHead>
                            <TableHead className="font-semibold text-gray-700">Role</TableHead>
                            <TableHead className="font-semibold text-gray-700">Região / Igreja</TableHead>
                            <TableHead className="font-semibold text-gray-700">Status</TableHead>
                            <TableHead className="font-semibold text-gray-700">QR Code</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-right">Aksaun</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {admins.map((admin) => (
                            <TableRow key={admin.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium text-gray-900">
                                <div>
                                  {admin.name}
                                  {admin.email && (
                                    <p className="text-xs text-gray-500">{admin.email}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <RoleBadge role={admin.role} />
                              </TableCell>
                              <TableCell className="text-gray-600">
                                {admin.role === 'ADMIN_REGIONAL' && admin.region}
                                {admin.role === 'ADMIN_LOKAL' && admin.churchName}
                                {admin.role === 'SUPER_ADMIN' && '—'}
                              </TableCell>
                              <TableCell>
                                {admin.status === 'ACTIVE' ? (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Aktibu
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100">
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Desaktibu
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {admin.role !== 'SUPER_ADMIN' && (
                                  admin.hasActiveQr ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                      <QrIcon className="w-3 h-3 mr-1" />
                                      Aktibu
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                                      Seidauk
                                    </Badge>
                                  )
                                )}
                                {admin.role === 'SUPER_ADMIN' && '—'}
                              </TableCell>
                              <TableCell className="text-right">
                                {admin.role !== 'SUPER_ADMIN' && (
                                  <div className="flex items-center justify-end gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setQrModalUser(admin)}
                                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                      <QrIcon className="w-3 h-3 mr-1" />
                                      QR
                                    </Button>
                                    {admin.hasActiveQr && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleToggleQr(admin.id, true)}
                                        className="text-amber-600 hover:bg-amber-50"
                                        title="Desaktiva QR"
                                      >
                                        <Power className="w-3 h-3" />
                                      </Button>
                                    )}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleToggleStatus(admin)}
                                      className="text-gray-500 hover:bg-gray-100"
                                      title={admin.status === 'ACTIVE' ? 'Desaktiva' : 'Aktiva'}
                                    >
                                      <Power className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDelete(admin.id, admin.name)}
                                      className="text-red-500 hover:bg-red-50"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Login History Tab */}
            <TabsContent value="history">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-600" />
                    Istória Login
                  </CardTitle>
                  <CardDescription>
                    Riwayat login husi admin hotu-hotu
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold text-gray-700">Uza-na'in</TableHead>
                            <TableHead className="font-semibold text-gray-700">Role</TableHead>
                            <TableHead className="font-semibold text-gray-700">Metodu</TableHead>
                            <TableHead className="font-semibold text-gray-700">Device</TableHead>
                            <TableHead className="font-semibold text-gray-700">IP</TableHead>
                            <TableHead className="font-semibold text-gray-700">Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                Seidauk iha login history
                              </TableCell>
                            </TableRow>
                          ) : (
                            history.map((entry) => (
                              <TableRow key={entry.id} className="hover:bg-gray-50">
                                <TableCell className="font-medium text-gray-900">
                                  {entry.userName}
                                </TableCell>
                                <TableCell>
                                  <RoleBadge role={entry.userRole} />
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      entry.method === 'GOOGLE'
                                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-100'
                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-100'
                                    }
                                  >
                                    {entry.method === 'GOOGLE' ? 'Google OAuth' : 'QR Code'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-600 text-sm max-w-xs truncate">
                                  {entry.deviceInfo || '—'}
                                </TableCell>
                                <TableCell className="text-gray-600 text-sm font-mono">
                                  {entry.ipAddress || '—'}
                                </TableCell>
                                <TableCell className="text-gray-600 text-sm">
                                  {new Date(entry.createdAt).toLocaleString('pt-TL')}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalUser && (
        <QrCodeModal
          user={qrModalUser}
          onClose={() => {
            setQrModalUser(null)
            fetchAdmins()
          }}
        />
      )}

      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            SIADTL — Sistema Informasaun Orsamentu Igreja Evangelika Asembleia de Deus Timor-Leste
          </p>
        </div>
      </footer>
    </main>
  )
}

// ============================================
// ROLE BADGE
// ============================================

function RoleBadge({ role }: { role: string }) {
  if (role === 'SUPER_ADMIN') {
    return (
      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
        <Shield className="w-3 h-3 mr-1" />
        Super Admin
      </Badge>
    )
  }
  if (role === 'ADMIN_REGIONAL') {
    return (
      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
        Admin Regional
      </Badge>
    )
  }
  return (
    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
      Admin Lokal
    </Badge>
  )
}

// ============================================
// ADD ADMIN DIALOG
// ============================================

function AddAdminDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState<'ADMIN_REGIONAL' | 'ADMIN_LOKAL'>('ADMIN_REGIONAL')
  const [region, setRegion] = useState('')
  const [churchName, setChurchName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Hatama naran')
      return
    }
    if (role === 'ADMIN_REGIONAL' && !region) {
      toast.error('Hili região')
      return
    }
    if (role === 'ADMIN_LOKAL' && !churchName.trim()) {
      toast.error('Hatama naran igreja')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, role, region, churchName }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Admin kria ona!', {
          description: `${name} tama ona ho role ${role}`,
        })
        setName('')
        setRegion('')
        setChurchName('')
        setOpen(false)
        onAdded()
      } else {
        toast.error('Erro', { description: data.error })
      }
    } catch {
      toast.error('Erro atu kria admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Aumenta Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Kria Admin Foun</DialogTitle>
          <DialogDescription>
            Hatama info admin foun. QR Code bele generate depois.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Naran</Label>
            <Input
              id="name"
              placeholder="Hatan: Pastor João"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v: 'ADMIN_REGIONAL' | 'ADMIN_LOKAL') => setRole(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN_REGIONAL">Admin Regional</SelectItem>
                <SelectItem value="ADMIN_LOKAL">Admin Lokal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === 'ADMIN_REGIONAL' && (
            <div className="space-y-2">
              <Label>Região</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Hili Região" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {role === 'ADMIN_LOKAL' && (
            <div className="space-y-2">
              <Label htmlFor="churchName">Naran Igreja</Label>
              <Input
                id="churchName"
                placeholder="Hatan: Igreja Baucau Centro"
                value={churchName}
                onChange={(e) => setChurchName(e.target.value)}
              />
            </div>
          )}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Kria Admin
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// QR CODE MODAL
// ============================================

function QrCodeModal({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [qrData, setQrData] = useState<QrData | null>(null)
  const [loading, setLoading] = useState(true)

  const generateQr = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
      const data = await res.json()
      if (data.success) {
        setQrData(data.data)
        toast.success('QR Code generate ona!')
      } else {
        toast.error('Erro', { description: data.error })
      }
    } catch {
      toast.error('Erro atu generate QR Code')
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    generateQr()
  }, [generateQr])

  const handleDownload = () => {
    if (!qrData) return
    const link = document.createElement('a')
    link.href = qrData.qrDataUrl
    link.download = `qr-${user.name.replace(/\s+/g, '-').toLowerCase()}.png`
    link.click()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrIcon className="w-5 h-5 text-blue-600" />
            QR Code ba {user.name}
          </DialogTitle>
          <DialogDescription>
            QR Code ne'e bele uza atu login. Fahe ho admin ne'e.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center py-4 space-y-4">
          {loading ? (
            <div className="w-[300px] h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : qrData ? (
            <>
              <div className="p-4 bg-white rounded-xl border-2 border-gray-200">
                <img
                  src={qrData.qrDataUrl}
                  alt={`QR Code for ${user.name}`}
                  className="w-[260px] h-[260px]"
                />
              </div>
              <div className="w-full space-y-2">
                <Label className="text-xs text-gray-500">Token (bele kopia):</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={qrData.token}
                    className="font-mono text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(qrData.token)
                      toast.success('Token kopia ona!')
                    }}
                  >
                    Kopia
                  </Button>
                </div>
              </div>
              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download QR Code
              </Button>
              <Button
                onClick={generateQr}
                variant="ghost"
                className="w-full text-blue-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Generate QR Foun (QR old deaktiva)
              </Button>
            </>
          ) : (
            <p className="text-gray-500">La bele generate QR Code</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
