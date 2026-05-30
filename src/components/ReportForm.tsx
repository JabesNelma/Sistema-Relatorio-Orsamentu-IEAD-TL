'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ChurchReport, REGIONS, MONTHS, generateId, calculateTotalRevenue, calculateTotalExpense, calculateBalance, formatUSD } from '@/lib/data'
import { SummaryCard } from './SummaryCard'
import { TrendingUp, TrendingDown, Wallet, Plus, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ReportFormProps {
  onSubmit?: (report: ChurchReport) => void
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

export function ReportForm({ onSubmit }: ReportFormProps) {
  const [formData, setFormData] = useState<Partial<ChurchReport>>({
    churchName: '',
    region: '',
    month: '',
    year: currentYear,
    persembahan: 0,
    perpuluhan: 0,
    donasaun: 0,
    osanTamaSeluk: 0,
    operasional: 0,
    manutensaun: 0,
    programaMinisteriu: 0,
    gastuSeluk: 0,
  })

  const [submitted, setSubmitted] = useState(false)

  const totalRevenue = useMemo(() => calculateTotalRevenue(formData), [formData])
  const totalExpense = useMemo(() => calculateTotalExpense(formData), [formData])
  const balance = useMemo(() => calculateBalance(formData), [formData])

  const handleNumberInput = (field: keyof ChurchReport, value: string) => {
    const numValue = parseFloat(value) || 0
    if (numValue >= 0) {
      setFormData((prev) => ({ ...prev, [field]: numValue }))
    }
  }

  const handleSubmit = () => {
    if (!formData.churchName || !formData.region || !formData.month || !formData.year) {
      toast.error('Preenche dados hotu-hotu', {
        description: 'Favor prenche naran igreja, região, fulan no tinan',
      })
      return
    }

    const newReport: ChurchReport = {
      id: generateId(),
      churchName: formData.churchName!,
      region: formData.region!,
      month: formData.month!,
      year: formData.year!,
      persembahan: formData.persembahan || 0,
      perpuluhan: formData.perpuluhan || 0,
      donasaun: formData.donasaun || 0,
      osanTamaSeluk: formData.osanTamaSeluk || 0,
      operasional: formData.operasional || 0,
      manutensaun: formData.manutensaun || 0,
      programaMinisteriu: formData.programaMinisteriu || 0,
      gastuSeluk: formData.gastuSeluk || 0,
    }

    onSubmit?.(newReport)
    setSubmitted(true)
    toast.success('Relatóriu konklui!', {
      description: `Dadus ba ${formData.churchName} tau ona`,
    })

    // Reset form after short delay
    setTimeout(() => {
      setFormData({
        churchName: '',
        region: '',
        month: '',
        year: currentYear,
        persembahan: 0,
        perpuluhan: 0,
        donasaun: 0,
        osanTamaSeluk: 0,
        operasional: 0,
        manutensaun: 0,
        programaMinisteriu: 0,
        gastuSeluk: 0,
      })
      setSubmitted(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      {/* Main Form Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl text-gray-900">Form Relatóriu Finanseiru</CardTitle>
          <CardDescription>
            Hatama relatóriu finanseiru ba igreja ida
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Church Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Informasaun Igreja
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="churchName">Naran Igreja</Label>
                <Input
                  id="churchName"
                  placeholder="Hatan: Igreja Dili Centro"
                  value={formData.churchName || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, churchName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">Região</Label>
                <Select
                  value={formData.region}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, region: value }))}
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
              <div className="space-y-2">
                <Label htmlFor="month">Fulan</Label>
                <Select
                  value={formData.month}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, month: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hili Fulan" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Tinan</Label>
                <Select
                  value={formData.year?.toString()}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, year: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Hili Tinan" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Revenue Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Osan Tama (Receita)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="persembahan">Persembahan</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="persembahan"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.persembahan || ''}
                    onChange={(e) => handleNumberInput('persembahan', e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="perpuluhan">Perpuluhan</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="perpuluhan"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.perpuluhan || ''}
                    onChange={(e) => handleNumberInput('perpuluhan', e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="donasaun">Donasaun</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="donasaun"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.donasaun || ''}
                    onChange={(e) => handleNumberInput('donasaun', e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="osanTamaSeluk">Osan Tama Seluk</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="osanTamaSeluk"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.osanTamaSeluk || ''}
                    onChange={(e) => handleNumberInput('osanTamaSeluk', e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-right">
              <span className="text-sm text-green-700">Total Osan Tama: </span>
              <span className="font-bold text-green-700">{formatUSD(totalRevenue)}</span>
            </div>
          </div>

          <Separator />

          {/* Expense Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-red-700 uppercase tracking-wide flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Gastu (Despesa)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="operasional">Operasional</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="operasional"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.operasional || ''}
                    onChange={(e) => handleNumberInput('operasional', e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manutensaun">Manutensaun Igreja</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="manutensaun"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.manutensaun || ''}
                    onChange={(e) => handleNumberInput('manutensaun', e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="programaMinisteriu">Programa Ministeriu</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="programaMinisteriu"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.programaMinisteriu || ''}
                    onChange={(e) => handleNumberInput('programaMinisteriu', e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gastuSeluk">Gastu Seluk</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                  <Input
                    id="gastuSeluk"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.gastuSeluk || ''}
                    onChange={(e) => handleNumberInput('gastuSeluk', e.target.value)}
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-right">
              <span className="text-sm text-red-700">Total Gastu: </span>
              <span className="font-bold text-red-700">{formatUSD(totalExpense)}</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={submitted}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8"
            >
              {submitted ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Relatóriu Konklui
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Hatama Relatóriu
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Osan Tama"
          amount={totalRevenue}
          icon={TrendingUp}
          variant="success"
        />
        <SummaryCard
          title="Total Gastu"
          amount={totalExpense}
          icon={TrendingDown}
          variant="danger"
        />
        <SummaryCard
          title="Saldo"
          amount={balance}
          icon={Wallet}
          variant={balance >= 0 ? 'success' : 'danger'}
        />
      </div>
    </div>
  )
}
