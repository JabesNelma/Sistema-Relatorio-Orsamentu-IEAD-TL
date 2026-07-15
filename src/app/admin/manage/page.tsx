'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { useAdminUsers, useLoginHistory } from '@/hooks/use-admin-users'
import { useAdminQr } from '@/hooks/use-admin-qr'
import { QrCodeDisplay } from '@/components/QrCodeDisplay'
import { REGIONS } from '@/lib/data'
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/auth/types'
import { Role } from '@prisma/client'
import { Church, Users, QrCode, Plus, LogOut, Loader2, Trash2, Power, History, Shield, UserCheck, UserX, Download } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function ManageAdminPage() {
  const { user, loading: authLoading, logout } = useAuth()
  const { users, loading: usersLoading, createUser, toggleUserActive, deleteUser, refetch } = useAdminUsers()
  const { history, loading: historyLoading, refetch: refetchHistory } = useLoginHistory()
  const { generateQr, toggleQr, generating, toggling } = useAdminQr()
  const router = useRouter()

  // Create user dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    role: 'ADMIN_LOKAL' as 'ADMIN_REGIONAL' | 'ADMIN_LOKAL',
    region: '',
    churchName: '',
  })
  const [creating, setCreating] = useState(false)

  // QR display dialog state
  const [qrDialog, setQrDialog] = useState<{
    open: boolean
    dataUrl: string
    userName: string
    userRole: string
    token: string
    userId: string
  } | null>(null)

  // Delete confirmation
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; userName: string } | null>(null)

  // Redirect if not super admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.push('/login?redirect=/admin/manage')
    }
  }, [user, authLoading, router])

  const handleCreateUser = async () => {
    if (!createForm.name || createForm.name.length < 2) {
      toast.error('Erro', { description: 'Naran tenke bele iha letra 2 ka liu' })
      return
    }

    setCreating(true)
    const payload =
      createForm.role === 'ADMIN_REGIONAL'
        ? { name: createForm.name, role: createForm.role, region: createForm.region }
        : { name: createForm.name, role: createForm.role, churchName: createForm.churchName }

    const success = await createUser(payload)
    setCreating(false)

    if (success) {
      toast.success('Admin foun konklui!', { description: `Admin ${createForm.name} tau ona` })
      setCreateForm({ name: '', role: 'ADMIN_LOKAL', region: '', churchName: '' })
      setCreateDialogOpen(false)
    } else {
      toast.error('Erro', { description: 'La bele kria admin. Tenta fali.' })
    }
  }

  const handleGenerateQr = async (userId: string, userName: string) => {
    const result = await generateQr(userId)
    if (result) {
      setQrDialog({
        open: true,
        dataUrl: result.qrCodeDataUrl,
        userName: result.userName,
        userRole: result.userRole,
        token: result.token,
        userId,
      })
      toast.success('QR Code konklui!', { description: `QR ba ${userName} hameno ona` })
      refetch()
    } else {
      toast.error('Erro', { description: 'La bele kria QR Code' })
    }
  }

  const handleToggleQr = async (qrId: string, currentStatus: string, userName: string) => {
    const action = currentStatus === 'ACTIVE' ? 'disable' : 'enable'
    const success = await toggleQr(qrId, action)
    if (success) {
      toast.success(action === 'disable' ? 'QR Disable ona' : 'QR Enable ona', {
        description: `QR ba ${userName} ${action === 'disable' ? 'disable' : 'enable'} ona`,
      })
      refetch()
    } else {
      toast.error('Erro', { description: 'La bele troka QR status' })
    }
  }

  const handleToggleUserActive = async (userId: string, isActive: boolean, userName: string) => {
    const success = await toggleUserActive(userId, !isActive)
    if (success) {
      toast.success(isActive ? 'User Disable ona' : 'User Enable ona', {
        description: `${userName} ${isActive ? 'disable' : 'enable'} ona`,
      })
    } else {
      toast.error('Erro', { description: 'La bele troka user status' })
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteDialog) return
    const success = await deleteUser(deleteDialog.userId)
    if (success) {
      toast.success('User hapus ona', { description: `${deleteDialog.userName} hapus ona` })
      setDeleteDialog(null)
    } else {
      toast.error('Erro', { description: 'La bele hapus user' })
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </main>
    )
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return null // Will redirect
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <Header title="Super Admin Dashboard" showHome />

      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-600" />
                Manage Admin
              </h2>
              <p className="text-gray-600 mt-1">
                Hanoro admin sira, kria QR Code, no haree login history.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={ROLE_COLORS.SUPER_ADMIN}>
                {user.name} (Super Admin)
              </Badge>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sai
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                    <p className="text-xs text-gray-500">Total Admin</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50">
                    <UserCheck className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter((u) => u.isActive).length}
                    </p>
                    <p className="text-xs text-gray-500">Admin Aktivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50">
                    <QrCode className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {users.filter((u) => u.qrCode?.status === 'ACTIVE').length}
                    </p>
                    <p className="text-xs text-gray-500">QR Aktivo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-gray-200 shadow-sm">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-50">
                    <History className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{history.length}</p>
                    <p className="text-xs text-gray-500">Login História</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="admins" className="space-y-4">
            <TabsList>
              <TabsTrigger value="admins">Admin Lista</TabsTrigger>
              <TabsTrigger value="history">Login História</TabsTrigger>
            </TabsList>

            {/* Admin List Tab */}
            <TabsContent value="admins" className="space-y-4">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Admin Lista</CardTitle>
                      <CardDescription>
                        Admin hotu-hotu ho QR Code status sira
                      </CardDescription>
                    </div>
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Aumenta Admin
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Kria Admin Foun</DialogTitle>
                          <DialogDescription>
                            Hatama informasaun admin foun. QR Code bele kria depois.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Naran</Label>
                            <Input
                              id="name"
                              placeholder="Hatan: Pastor João"
                              value={createForm.name}
                              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                              value={createForm.role}
                              onValueChange={(value: 'ADMIN_REGIONAL' | 'ADMIN_LOKAL') =>
                                setCreateForm({ ...createForm, role: value })
                              }
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
                          {createForm.role === 'ADMIN_REGIONAL' ? (
                            <div className="space-y-2">
                              <Label htmlFor="region">Região</Label>
                              <Select
                                value={createForm.region}
                                onValueChange={(value) => setCreateForm({ ...createForm, region: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Hili Região" />
                                </SelectTrigger>
                                <SelectContent>
                                  {REGIONS.map((region) => (
                                    <SelectItem key={region} value={region}>
                                      {region}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Label htmlFor="churchName">Naran Igreja</Label>
                              <Input
                                id="churchName"
                                placeholder="Hatan: Igreja Baucau Centro"
                                value={createForm.churchName}
                                onChange={(e) => setCreateForm({ ...createForm, churchName: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Kansela
                          </Button>
                          <Button onClick={handleCreateUser} disabled={creating}>
                            {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Kria Admin
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold text-gray-700">Naran</TableHead>
                            <TableHead className="font-semibold text-gray-700">Role</TableHead>
                            <TableHead className="font-semibold text-gray-700">Região/Igreja</TableHead>
                            <TableHead className="font-semibold text-gray-700">QR Status</TableHead>
                            <TableHead className="font-semibold text-gray-700">User Status</TableHead>
                            <TableHead className="font-semibold text-gray-700 text-right">Aksaun</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                Seidauk iha admin. Klik "Aumenta Admin" atu kria.
                              </TableCell>
                            </TableRow>
                          ) : (
                            users.map((u) => (
                              <TableRow key={u.id}>
                                <TableCell className="font-medium text-gray-900">{u.name}</TableCell>
                                <TableCell>
                                  <Badge className={ROLE_COLORS[u.role]}>{ROLE_LABELS[u.role]}</Badge>
                                </TableCell>
                                <TableCell className="text-gray-600">
                                  {u.role === 'ADMIN_REGIONAL' ? u.region : u.churchName}
                                </TableCell>
                                <TableCell>
                                  {u.qrCode ? (
                                    <Badge
                                      className={
                                        u.qrCode.status === 'ACTIVE'
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-gray-100 text-gray-600'
                                      }
                                    >
                                      {u.qrCode.status}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-gray-400">Seidauk iha</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={
                                      u.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                    }
                                  >
                                    {u.isActive ? 'Aktivo' : 'La Aktivo'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center justify-end gap-1">
                                    {/* Generate QR */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleGenerateQr(u.id, u.name)}
                                      disabled={generating}
                                      className="text-purple-600 hover:bg-purple-50"
                                      title="Kria QR Code"
                                    >
                                      <QrCode className="w-4 h-4" />
                                    </Button>
                                    {/* Toggle QR */}
                                    {u.qrCode && (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleToggleQr(u.qrCode!.id, u.qrCode!.status, u.name)}
                                        disabled={toggling}
                                        className="text-amber-600 hover:bg-amber-50"
                                        title={u.qrCode.status === 'ACTIVE' ? 'Disable QR' : 'Enable QR'}
                                      >
                                        <Power className="w-4 h-4" />
                                      </Button>
                                    )}
                                    {/* Toggle Active */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleToggleUserActive(u.id, u.isActive, u.name)}
                                      className="text-blue-600 hover:bg-blue-50"
                                      title={u.isActive ? 'Disable User' : 'Enable User'}
                                    >
                                      {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                                    </Button>
                                    {/* Delete */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setDeleteDialog({ open: true, userId: u.id, userName: u.name })}
                                      className="text-red-600 hover:bg-red-50"
                                      title="Hapus User"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
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

            {/* Login History Tab */}
            <TabsContent value="history">
              <Card className="border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Login História</CardTitle>
                  <CardDescription>
                    Login sira hotu ho informasaun device
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="rounded-lg border border-gray-200 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold text-gray-700">Naran</TableHead>
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
                                  Seidauk iha login história.
                                </TableCell>
                              </TableRow>
                            ) : (
                              history.map((h) => (
                                <TableRow key={h.id}>
                                  <TableCell className="font-medium text-gray-900">{h.userName}</TableCell>
                                  <TableCell>
                                    <Badge className={ROLE_COLORS[h.userRole]}>
                                      {ROLE_LABELS[h.userRole]}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={
                                        h.loginMethod === 'google_oauth'
                                          ? 'bg-blue-100 text-blue-700'
                                          : 'bg-purple-100 text-purple-700'
                                      }
                                    >
                                      {h.loginMethod === 'google_oauth' ? 'Google' : 'QR Code'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                                    {h.deviceInfo || '-'}
                                  </TableCell>
                                  <TableCell className="text-xs text-gray-500">{h.ipAddress || '-'}</TableCell>
                                  <TableCell className="text-xs text-gray-500">
                                    {new Date(h.createdAt).toLocaleString('pt-TL')}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* QR Code Display Dialog */}
      {qrDialog && (
        <Dialog
          open={qrDialog.open}
          onOpenChange={(open) => setQrDialog(open ? qrDialog : null)}
        >
          <QrCodeDisplay
            dataUrl={qrDialog.dataUrl}
            userName={qrDialog.userName}
            userRole={qrDialog.userRole}
            token={qrDialog.token}
            onRegenerate={() => {
              handleGenerateQr(qrDialog.userId, qrDialog.userName)
            }}
          />
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog?.open}
        onOpenChange={(open) => setDeleteDialog(open ? deleteDialog : null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User?</DialogTitle>
            <DialogDescription>
              Ita boot seguransa katak bele hapus <strong>{deleteDialog?.userName}</strong>?
              Aksaun nee la bele fila.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Kansela
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500">
            SIADTL - Super Admin Dashboard
          </p>
        </div>
      </footer>
    </main>
  )
}
